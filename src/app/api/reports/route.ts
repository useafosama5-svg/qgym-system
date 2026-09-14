import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, getEnforcedBranchId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const url = new URL(req.url);
    const requestedBranchId = url.searchParams.get('branchId') || 'ALL';
    const period = url.searchParams.get('period') || '30'; // days

    const enforcedBranchId = getEnforcedBranchId(
      session,
      requestedBranchId === 'ALL' ? undefined : requestedBranchId
    );

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const in7Days = new Date(now.getTime() + 7 * 86400000);
    const periodStartDate = new Date(now.getTime() - parseInt(period, 10) * 86400000);

    const isAll = !enforcedBranchId;
    const branchFilter = isAll ? {} : { homeBranchId: enforcedBranchId };
    const paymentBranchFilter = isAll ? {} : { branchId: enforcedBranchId };
    const attendanceBranchFilter = isAll ? {} : { branchId: enforcedBranchId };

    // Parallel optimized queries for high-speed response
    const [
      totalMembers,
      activeMembers,
      expiredMembers,
      expiringSoon,
      todayCheckins,
      todayNewMembers,
      todayRevenueAgg,
      todayExpensesAgg,
      allBranches,
      paymentMethodGroups,
      recentAttendances,
      expiringSoonList,
    ] = await Promise.all([
      // 1. Total Members
      prisma.customer.count({ where: branchFilter }),

      // 2. Active Members
      prisma.membership.count({
        where: {
          ...branchFilter,
          status: 'ACTIVE',
          endDate: { gte: now },
        },
      }),

      // 3. Expired Members
      prisma.membership.count({
        where: {
          ...branchFilter,
          OR: [{ status: 'EXPIRED' }, { endDate: { lt: now } }],
        },
      }),

      // 4. Expiring in 7 days
      prisma.membership.count({
        where: {
          ...branchFilter,
          status: 'ACTIVE',
          endDate: { gte: now, lte: in7Days },
        },
      }),

      // 5. Today Check-ins
      prisma.attendance.count({
        where: {
          ...attendanceBranchFilter,
          status: 'ALLOWED',
          checkinTime: { gte: startOfToday },
        },
      }),

      // 6. Today New Members
      prisma.customer.count({
        where: {
          ...branchFilter,
          createdAt: { gte: startOfToday },
        },
      }),

      // 7. Today Revenue (Aggregation)
      prisma.payment.aggregate({
        where: {
          ...paymentBranchFilter,
          paymentDate: { gte: startOfToday },
        },
        _sum: { amount: true },
      }),

      // 8. Today Expenses (Aggregation)
      prisma.expense.aggregate({
        where: {
          ...paymentBranchFilter,
          createdAt: { gte: startOfToday },
        },
        _sum: { amount: true },
      }),

      // 9. All Branches
      prisma.branch.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { createdAt: 'asc' },
      }),

      // 10. Payment Methods Grouped Aggregation
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          ...paymentBranchFilter,
          paymentDate: { gte: periodStartDate },
        },
        _sum: { amount: true },
      }),

      // 11. Recent Attendance Timestamps for Peak Hours
      prisma.attendance.findMany({
        where: {
          ...attendanceBranchFilter,
          checkinTime: { gte: periodStartDate },
        },
        select: { checkinTime: true },
      }),

      // 12. Expiring soon members list
      prisma.membership.findMany({
        where: {
          ...branchFilter,
          status: 'ACTIVE',
          endDate: { gte: now, lte: in7Days },
        },
        select: {
          id: true,
          endDate: true,
          customer: {
            select: { id: true, firstName: true, lastName: true, customerCode: true },
          },
          plan: { select: { name: true } },
          homeBranch: { select: { name: true } },
        },
        take: 8,
      }),
    ]);

    const todayRevenue = todayRevenueAgg._sum.amount || 0;
    const todayExpenses = todayExpensesAgg._sum.amount || 0;

    // Fast Parallel Branch Comparison calculations
    const branchComparison = await Promise.all(
      allBranches.map(async (b) => {
        const [members, active, checkins, revAgg, expAgg] = await Promise.all([
          prisma.customer.count({ where: { homeBranchId: b.id } }),
          prisma.membership.count({
            where: { homeBranchId: b.id, status: 'ACTIVE', endDate: { gte: now } },
          }),
          prisma.attendance.count({
            where: { branchId: b.id, status: 'ALLOWED' },
          }),
          prisma.payment.aggregate({
            where: { branchId: b.id },
            _sum: { amount: true },
          }),
          prisma.expense.aggregate({
            where: { branchId: b.id },
            _sum: { amount: true },
          }),
        ]);

        const rev = revAgg._sum.amount || 0;
        const exp = expAgg._sum.amount || 0;

        return {
          id: b.id,
          name: b.name,
          code: b.code,
          membersCount: members,
          activeMembersCount: active,
          checkinsCount: checkins,
          revenue: rev,
          expenses: exp,
          netProfit: rev - exp,
        };
      })
    );

    // Format payment methods
    const methodStats: Record<string, number> = {
      CASH: 0,
      VISA: 0,
      MASTERCARD: 0,
      INSTAPAY: 0,
      VODAFONE_CASH: 0,
      OTHER: 0,
    };

    paymentMethodGroups.forEach((group) => {
      const methodKey = group.paymentMethod.toUpperCase();
      methodStats[methodKey] = group._sum.amount || 0;
    });

    // Checkin Peak Hours (0-23)
    const hourlyCounts: Record<number, number> = {};
    for (let i = 6; i <= 23; i++) hourlyCounts[i] = 0;

    recentAttendances.forEach((a) => {
      const hour = new Date(a.checkinTime).getHours();
      if (hourlyCounts[hour] !== undefined) {
        hourlyCounts[hour]++;
      }
    });

    const peakHoursData = Object.entries(hourlyCounts).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count,
    }));

    return NextResponse.json({
      kpi: {
        totalMembers,
        activeMembers,
        expiredMembers,
        expiringSoon,
        todayCheckins,
        todayNewMembers,
        todayRevenue,
        todayExpenses,
        todayNet: todayRevenue - todayExpenses,
      },
      branchComparison,
      paymentMethods: Object.entries(methodStats).map(([name, value]) => ({ name, value })),
      peakHoursData,
      expiringSoonList,
    });
  } catch (error: any) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'فشل استرجاع التقارير' }, { status: 500 });
  }
}
