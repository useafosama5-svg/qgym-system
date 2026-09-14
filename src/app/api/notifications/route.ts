import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, getEnforcedBranchId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const requestedBranchId = req.nextUrl.searchParams.get('branchId');
    const branchId = getEnforcedBranchId(session, requestedBranchId);
    const branchFilter = branchId ? { homeBranchId: branchId } : {};

    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 1. Expiring Memberships (next 3 days)
    const expiring = await prisma.membership.findMany({
      where: {
        ...branchFilter,
        status: 'ACTIVE',
        endDate: { gte: now, lte: in3Days },
      },
      include: {
        customer: true,
        plan: true,
        homeBranch: true,
      },
      take: 10,
    });

    // 2. Unpaid balances (remainingAmount > 0)
    const unpaid = await prisma.membership.findMany({
      where: {
        ...branchFilter,
        status: 'ACTIVE',
        remainingAmount: { gt: 0 },
      },
      include: {
        customer: true,
        plan: true,
        homeBranch: true,
      },
      take: 10,
    });

    // 3. Cashier Discrepancies (difference != 0 on closed sessions)
    const cashFilter = branchId ? { branchId } : {};
    const discrepancies = await prisma.cashSession.findMany({
      where: {
        ...cashFilter,
        status: 'CLOSED',
        difference: { not: 0 },
      },
      include: {
        branch: true,
        employee: true,
      },
      orderBy: { closedAt: 'desc' },
      take: 5,
    });

    // 4. Inactive members (no check-in > 14 days)
    const cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const inactiveCount = await prisma.customer.count({
      where: {
        ...branchFilter,
        memberships: { some: { status: 'ACTIVE' } },
        attendance: {
          none: {
            checkinTime: { gte: cutoff },
          },
        },
      },
    });

    const notifications: Array<{
      id: string;
      type: 'EXPIRY' | 'UNPAID' | 'DISCREPANCY' | 'INACTIVE';
      title: string;
      message: string;
      time: string;
      link: string;
      severity: 'warning' | 'danger' | 'info';
    }> = [];

    expiring.forEach((m) => {
      const days = Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `exp-${m.id}`,
        type: 'EXPIRY',
        title: 'اشتراك قارب على الانتهاء',
        message: `اشتراك ${m.customer.firstName} ${m.customer.lastName} (${m.plan.name}) ينتهي خلال ${days} يوم في فرع ${m.homeBranch.name}`,
        time: 'قريباً',
        link: `/customers/${m.customer.id}`,
        severity: 'warning',
      });
    });

    unpaid.forEach((m) => {
      notifications.push({
        id: `unpaid-${m.id}`,
        type: 'UNPAID',
        title: 'مستحقات اشتراك معلقة',
        message: `متبقي ${m.remainingAmount.toLocaleString()} ج.م على العميل ${m.customer.firstName} ${m.customer.lastName}`,
        time: 'مستحق',
        link: `/customers/${m.customer.id}`,
        severity: 'danger',
      });
    });

    discrepancies.forEach((s) => {
      const diff = s.difference || 0;
      notifications.push({
        id: `disc-${s.id}`,
        type: 'DISCREPANCY',
        title: diff < 0 ? 'عجز في إغلاق الوردية' : 'زيادة في إغلاق الوردية',
        message: `جلسة ${s.sessionNumber} فرع ${s.branch.name} بفارق ${Math.abs(diff)} ج.م (المسؤول: ${s.employee.name})`,
        time: s.closedAt ? new Date(s.closedAt).toLocaleDateString('ar-EG') : 'حديثاً',
        link: `/finance/cashier`,
        severity: 'danger',
      });
    });

    if (inactiveCount > 0) {
      notifications.push({
        id: 'inactive-summary',
        type: 'INACTIVE',
        title: 'أعضاء غير نشطين',
        message: `يوجد ${inactiveCount} عميل مشترك لم يسجل حضوراً منذ أكثر من 14 يوماً`,
        time: 'تنبيه تنشيط',
        link: '/customers/inactive',
        severity: 'info',
      });
    }

    return NextResponse.json({
      totalCount: notifications.length,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
