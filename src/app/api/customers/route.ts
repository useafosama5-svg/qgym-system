import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, getEnforcedBranchId } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { generateCustomerCode, generatePaymentNumber } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search')?.trim() || '';
    const requestedBranchId = url.searchParams.get('branchId');
    const statusFilter = url.searchParams.get('status') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    const whereClause: any = {};

    // Strict Branch Isolation
    const enforcedBranchId = getEnforcedBranchId(session, requestedBranchId);
    if (enforcedBranchId) {
      whereClause.homeBranchId = enforcedBranchId;
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { customerCode: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
        { barcode: { contains: search } },
        { qrCode: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Status filter
    const now = new Date();
    if (statusFilter === 'FROZEN') {
      whereClause.status = 'FROZEN';
    } else if (statusFilter === 'INACTIVE') {
      whereClause.status = 'INACTIVE';
    }

    const totalCustomers = await prisma.customer.count({ where: whereClause });

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
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
          },
        },
        attendance: {
          orderBy: { checkinTime: 'desc' },
          take: 1,
          include: {
            branch: true,
          },
        },
      },
    });

    const formatted = customers.map((c) => {
      const latestMem = c.memberships[0];
      let computedStatus = c.status;
      let daysLeft = 0;

      if (latestMem) {
        if (latestMem.status === 'FROZEN') {
          computedStatus = 'FROZEN';
        } else if (new Date(latestMem.endDate) < now) {
          computedStatus = 'EXPIRED';
        } else {
          computedStatus = 'ACTIVE';
          const diffTime = new Date(latestMem.endDate).getTime() - now.getTime();
          daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      } else {
        computedStatus = 'NO_MEMBERSHIP';
      }

      return {
        id: c.id,
        customerCode: c.customerCode,
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: `${c.firstName} ${c.lastName}`,
        phone: c.phone,
        whatsapp: c.whatsapp,
        email: c.email,
        gender: c.gender,
        photo: c.photo,
        status: computedStatus,
        homeBranch: c.homeBranch,
        latestMembership: latestMem
          ? {
              id: latestMem.id,
              planName: latestMem.plan.name,
              accessType: latestMem.plan.accessType,
              startDate: latestMem.startDate,
              endDate: latestMem.endDate,
              status: latestMem.status,
              daysLeft: daysLeft,
              remainingAmount: latestMem.remainingAmount,
            }
          : null,
        lastCheckIn: c.attendance[0]
          ? {
              time: c.attendance[0].checkinTime,
              branchName: c.attendance[0].branch.name,
              status: c.attendance[0].status,
            }
          : null,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({
      customers: formatted,
      total: totalCustomers,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Customers API error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء استرجاع بيانات العملاء' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      whatsapp,
      email,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      homeBranchId,
      planId,
      paidAmount,
      discount,
      paymentMethod,
      allowedBranchIds,
    } = body;

    // Strict Branch Isolation for creation: Non-SuperAdmin can only create in their home branch
    const effectiveBranchId = session.role === 'SUPER_ADMIN' ? (homeBranchId || session.homeBranchId) : session.homeBranchId;

    if (!firstName || !lastName || !phone || !effectiveBranchId) {
      return NextResponse.json({ error: 'يرجى إكمال الحقول الإلزامية (الاسم الأول، العائلة، الهاتف، والفرع)' }, { status: 400 });
    }

    // Check phone uniqueness
    const existingPhone = await prisma.customer.findUnique({
      where: { phone: phone.trim() },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: `رقم الهاتف مسجل مسبقاً للعميل: ${existingPhone.firstName} ${existingPhone.lastName} (${existingPhone.customerCode})` },
        { status: 400 }
      );
    }

    const count = await prisma.customer.count();
    const customerCode = generateCustomerCode(count + 101);

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp?.trim() || phone.trim(),
        email: email?.trim() || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || 'MALE',
        address: address?.trim() || null,
        emergencyContact: emergencyContact?.trim() || null,
        homeBranchId: effectiveBranchId,
        barcode: customerCode.replace('GYM-', ''),
        qrCode: customerCode,
        status: 'ACTIVE',
      },
    });

    await prisma.customerBranchHistory.create({
      data: {
        customerId: customer.id,
        newBranchId: effectiveBranchId,
        action: 'CREATED',
        notes: 'تسجيل العميل لأول مرة في النظام',
        createdById: session.userId,
      },
    });

    if (planId) {
      const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
      if (plan) {
        const memCount = await prisma.membership.count();
        const memNumber = `MEM-${new Date().getFullYear()}-${String(memCount + 1).padStart(4, '0')}`;
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.durationDays * 86400000);
        const finalPrice = plan.price;
        const discountVal = Number(discount) || 0;
        const paidVal = Number(paidAmount) || 0;
        const netPrice = Math.max(0, finalPrice - discountVal);
        const remainingVal = Math.max(0, netPrice - paidVal);

        const membership = await prisma.membership.create({
          data: {
            membershipNumber: memNumber,
            customerId: customer.id,
            planId: plan.id,
            homeBranchId: effectiveBranchId,
            startDate,
            endDate,
            price: finalPrice,
            discount: discountVal,
            paidAmount: paidVal,
            remainingAmount: remainingVal,
            status: 'ACTIVE',
            createdById: session.userId,
          },
        });

        if (plan.accessType === 'SELECTED_BRANCHES' && Array.isArray(allowedBranchIds)) {
          for (const bId of allowedBranchIds) {
            await prisma.membershipAllowedBranch.create({
              data: { membershipId: membership.id, branchId: bId },
            });
          }
        }

        if (paidVal > 0) {
          const activeSession = await prisma.cashSession.findFirst({
            where: { branchId: effectiveBranchId, status: 'OPEN' },
            orderBy: { openedAt: 'desc' },
          });

          const payCount = await prisma.payment.count();
          const payNumber = generatePaymentNumber(payCount + 1);

          await prisma.payment.create({
            data: {
              paymentNumber: payNumber,
              customerId: customer.id,
              membershipId: membership.id,
              branchId: effectiveBranchId,
              cashSessionId: activeSession?.id || null,
              amount: paidVal,
              paymentMethod: paymentMethod || 'CASH',
              reference: `REG-${customerCode}`,
              receivedById: session.userId,
              notes: 'رسوم الاشتراك الأولي عند تسجيل العميل',
            },
          });
        }
      }
    }

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      branchId: effectiveBranchId,
      details: { code: customer.customerCode, name: `${customer.firstName} ${customer.lastName}` },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Customer create error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ بيانات العميل: ' + error.message }, { status: 500 });
  }
}
