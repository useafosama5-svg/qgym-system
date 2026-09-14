import { prisma } from './prisma';

export interface CheckInRequest {
  searchQuery: string; // customerCode, phone, barcode, or id
  branchId: string;    // The branch where check-in is attempted
  employeeId?: string;
  method?: 'CUSTOMER_CODE' | 'PHONE' | 'QR_CODE' | 'BARCODE' | 'RFID';
}

export interface CheckInResult {
  success: boolean;
  status: 'ALLOWED' | 'DENIED';
  denialReason?: string;
  customer?: {
    id: string;
    customerCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    photo?: string | null;
    homeBranch: {
      id: string;
      name: string;
      code: string;
    };
    status: string;
  };
  membership?: {
    id: string;
    membershipNumber: string;
    planName: string;
    accessType: string;
    startDate: Date;
    endDate: Date;
    status: string;
    remainingAmount: number;
  } | null;
  currentBranch: {
    id: string;
    name: string;
    code: string;
  };
  attendanceId?: string;
  checkinTime: Date;
}

export async function validateAndProcessCheckIn(req: CheckInRequest): Promise<CheckInResult> {
  const query = req.searchQuery.trim();
  const method = req.method || 'CUSTOMER_CODE';
  const now = new Date();

  // 1. Get current branch info
  const currentBranch = await prisma.branch.findUnique({
    where: { id: req.branchId },
  });

  if (!currentBranch) {
    throw new Error('الفرع المحدد غير موجود في النظام');
  }

  // 2. Search for customer
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { customerCode: { equals: query } },
        { phone: { equals: query } },
        { barcode: { equals: query } },
        { qrCode: { equals: query } },
        { id: { equals: query } },
      ],
    },
    include: {
      homeBranch: true,
      memberships: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          plan: true,
          allowedBranches: {
            include: {
              branch: true,
            },
          },
          freezes: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
  });

  if (!customer) {
    return {
      success: false,
      status: 'DENIED',
      denialReason: `لم يتم العثور على عميل مسجل برقم أو كود: ${query}`,
      currentBranch: {
        id: currentBranch.id,
        name: currentBranch.name,
        code: currentBranch.code,
      },
      checkinTime: now,
    };
  }

  const customerData = {
    id: customer.id,
    customerCode: customer.customerCode,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    photo: customer.photo,
    homeBranch: {
      id: customer.homeBranch.id,
      name: customer.homeBranch.name,
      code: customer.homeBranch.code,
    },
    status: customer.status,
  };

  // 3. Customer general status check
  if (customer.status === 'INACTIVE') {
    const attendance = await prisma.attendance.create({
      data: {
        customerId: customer.id,
        branchId: currentBranch.id,
        employeeId: req.employeeId || null,
        method: method,
        status: 'DENIED',
        denialReason: 'حساب العميل موقوف أو غير نشط في النظام',
      },
    });

    return {
      success: false,
      status: 'DENIED',
      denialReason: 'حساب العميل موقوف أو غير نشط في النظام',
      customer: customerData,
      currentBranch: {
        id: currentBranch.id,
        name: currentBranch.name,
        code: currentBranch.code,
      },
      attendanceId: attendance.id,
      checkinTime: now,
    };
  }

  // 4. Check active membership
  const latestMembership = customer.memberships[0];

  if (!latestMembership) {
    const attendance = await prisma.attendance.create({
      data: {
        customerId: customer.id,
        branchId: currentBranch.id,
        employeeId: req.employeeId || null,
        method: method,
        status: 'DENIED',
        denialReason: 'لا يوجد أي اشتراك مسجل لهذا العميل',
      },
    });

    return {
      success: false,
      status: 'DENIED',
      denialReason: 'لا يوجد أي اشتراك مسجل لهذا العميل',
      customer: customerData,
      membership: null,
      currentBranch: {
        id: currentBranch.id,
        name: currentBranch.name,
        code: currentBranch.code,
      },
      attendanceId: attendance.id,
      checkinTime: now,
    };
  }

  const membershipData = {
    id: latestMembership.id,
    membershipNumber: latestMembership.membershipNumber,
    planName: latestMembership.plan.name,
    accessType: latestMembership.plan.accessType,
    startDate: latestMembership.startDate,
    endDate: latestMembership.endDate,
    status: latestMembership.status,
    remainingAmount: latestMembership.remainingAmount,
  };

  // Check Freeze
  if (latestMembership.status === 'FROZEN' || latestMembership.freezes.length > 0) {
    const activeFreeze = latestMembership.freezes[0];
    const freezeUntil = activeFreeze ? activeFreeze.endDate.toLocaleDateString('ar-EG') : '';
    const reason = `الاشتراك مجمد حالياً ${freezeUntil ? 'حتى ' + freezeUntil : ''}`;

    const attendance = await prisma.attendance.create({
      data: {
        customerId: customer.id,
        branchId: currentBranch.id,
        membershipId: latestMembership.id,
        employeeId: req.employeeId || null,
        method: method,
        status: 'DENIED',
        denialReason: reason,
      },
    });

    return {
      success: false,
      status: 'DENIED',
      denialReason: reason,
      customer: customerData,
      membership: membershipData,
      currentBranch: {
        id: currentBranch.id,
        name: currentBranch.name,
        code: currentBranch.code,
      },
      attendanceId: attendance.id,
      checkinTime: now,
    };
  }

  // Check Expiration
  if (latestMembership.status === 'EXPIRED' || latestMembership.endDate < now) {
    const expiryDate = latestMembership.endDate.toLocaleDateString('ar-EG');
    const reason = `الاشتراك منتهي الصلاحية بتاريخ ${expiryDate}`;

    // Auto update status if not updated
    if (latestMembership.status !== 'EXPIRED') {
      await prisma.membership.update({
        where: { id: latestMembership.id },
        data: { status: 'EXPIRED' },
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        customerId: customer.id,
        branchId: currentBranch.id,
        membershipId: latestMembership.id,
        employeeId: req.employeeId || null,
        method: method,
        status: 'DENIED',
        denialReason: reason,
      },
    });

    return {
      success: false,
      status: 'DENIED',
      denialReason: reason,
      customer: customerData,
      membership: membershipData,
      currentBranch: {
        id: currentBranch.id,
        name: currentBranch.name,
        code: currentBranch.code,
      },
      attendanceId: attendance.id,
      checkinTime: now,
    };
  }

  // 5. Multi-Branch Access Rules
  const accessType = latestMembership.plan.accessType;
  let isAccessAllowed = false;
  let branchDenialReason: string | undefined = undefined;

  if (accessType === 'UNLIMITED') {
    isAccessAllowed = true;
  } else if (accessType === 'HOME_BRANCH_ONLY') {
    if (latestMembership.homeBranchId === currentBranch.id) {
      isAccessAllowed = true;
    } else {
      isAccessAllowed = false;
      branchDenialReason = `الاشتراك مخصص لفرع (${customer.homeBranch.name}) فقط، ولا يشمل فرع (${currentBranch.name})`;
    }
  } else if (accessType === 'SELECTED_BRANCHES') {
    const isBranchAllowed = latestMembership.allowedBranches.some(
      (ab) => ab.branchId === currentBranch.id
    );
    if (isBranchAllowed || latestMembership.homeBranchId === currentBranch.id) {
      isAccessAllowed = true;
    } else {
      isAccessAllowed = false;
      const allowedNames = latestMembership.allowedBranches.map((ab) => ab.branch.name).join('، ');
      branchDenialReason = `فرع (${currentBranch.name}) غير مشمول في قائمة الفروع المصرح بها للعميل (${allowedNames})`;
    }
  }

  // 6. Record Attendance
  const attendance = await prisma.attendance.create({
    data: {
      customerId: customer.id,
      branchId: currentBranch.id,
      membershipId: latestMembership.id,
      employeeId: req.employeeId || null,
      method: method,
      status: isAccessAllowed ? 'ALLOWED' : 'DENIED',
      denialReason: branchDenialReason || null,
    },
  });

  return {
    success: isAccessAllowed,
    status: isAccessAllowed ? 'ALLOWED' : 'DENIED',
    denialReason: branchDenialReason,
    customer: customerData,
    membership: membershipData,
    currentBranch: {
      id: currentBranch.id,
      name: currentBranch.name,
      code: currentBranch.code,
    },
    attendanceId: attendance.id,
    checkinTime: now,
  };
}
