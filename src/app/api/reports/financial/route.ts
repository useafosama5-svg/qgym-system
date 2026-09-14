import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, getEnforcedBranchId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month'; // 'today', 'week', 'month', 'year'
    const requestedBranchId = searchParams.get('branchId');
    const branchId = getEnforcedBranchId(session, requestedBranchId);

    const now = new Date();
    let currentStart = new Date();
    let currentEnd = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    if (period === 'today') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay(); // 0 is Sunday
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0);
      currentEnd = new Date();

      prevStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentStart.getTime() - 1);
    } else if (period === 'year') {
      currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      currentEnd = new Date();

      prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    } else {
      // month (default)
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      currentEnd = new Date();

      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    const branchFilter = branchId ? { branchId } : {};

    // 1. Current Period Payments & Expenses
    const currentPayments = await prisma.payment.findMany({
      where: {
        ...branchFilter,
        paymentDate: { gte: currentStart, lte: currentEnd },
      },
      include: { branch: true, membership: { include: { plan: true } } },
    });

    const currentExpenses = await prisma.expense.findMany({
      where: {
        ...branchFilter,
        createdAt: { gte: currentStart, lte: currentEnd },
      },
    });

    // 2. Previous Period Payments & Expenses
    const prevPayments = await prisma.payment.findMany({
      where: {
        ...branchFilter,
        paymentDate: { gte: prevStart, lte: prevEnd },
      },
    });

    const prevExpenses = await prisma.expense.findMany({
      where: {
        ...branchFilter,
        createdAt: { gte: prevStart, lte: prevEnd },
      },
    });

    const currentRevenue = currentPayments.reduce((s, p) => s + p.amount, 0);
    const currentExpenseTotal = currentExpenses.reduce((s, e) => s + e.amount, 0);
    const currentNetIncome = currentRevenue - currentExpenseTotal;

    const prevRevenue = prevPayments.reduce((s, p) => s + p.amount, 0);
    const prevExpenseTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
    const prevNetIncome = prevRevenue - prevExpenseTotal;

    const revenueGrowth =
      prevRevenue > 0
        ? parseFloat((((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
        : 0;

    // 3. Breakdown by Payment Method
    const methodBreakdown: Record<string, number> = {};
    currentPayments.forEach((p) => {
      methodBreakdown[p.paymentMethod] = (methodBreakdown[p.paymentMethod] || 0) + p.amount;
    });

    // 4. Breakdown by Branch
    const branchBreakdown: Record<string, number> = {};
    currentPayments.forEach((p) => {
      const branchName = p.branch?.name || 'غير محدد';
      branchBreakdown[branchName] = (branchBreakdown[branchName] || 0) + p.amount;
    });

    // 5. Breakdown by Plan
    const planBreakdown: Record<string, number> = {};
    currentPayments.forEach((p) => {
      const planName = p.membership?.plan?.name || 'أخرى / بدون باقة';
      planBreakdown[planName] = (planBreakdown[planName] || 0) + p.amount;
    });

    return NextResponse.json({
      period,
      summary: {
        currentRevenue,
        currentExpenseTotal,
        currentNetIncome,
        prevRevenue,
        prevExpenseTotal,
        prevNetIncome,
        revenueGrowth,
        transactionsCount: currentPayments.length,
      },
      methodBreakdown,
      branchBreakdown,
      planBreakdown,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
