import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, getEnforcedBranchId, canAccessBranch } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { generateSessionNumber } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const url = new URL(req.url);
    const requestedBranchId = url.searchParams.get('branchId');
    const branchId = getEnforcedBranchId(session, requestedBranchId);

    if (!branchId) {
      // Super Admin Central Overview of sessions
      const sessions = await prisma.cashSession.findMany({
        orderBy: { openedAt: 'desc' },
        take: 20,
        include: {
          branch: true,
          employee: {
            select: { name: true, username: true },
          },
          _count: {
            select: { payments: true, expenses: true },
          },
        },
      });

      return NextResponse.json({ sessions });
    }

    // Find active session for this branch
    const activeSession = await prisma.cashSession.findFirst({
      where: { branchId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
      include: {
        branch: true,
        employee: {
          select: { name: true, username: true },
        },
        payments: {
          include: {
            customer: true,
            receivedBy: { select: { name: true } },
          },
        },
        expenses: {
          include: {
            createdBy: { select: { name: true } },
          },
        },
      },
    });

    let summary = null;
    if (activeSession) {
      let cashPayments = 0;
      let visaPayments = 0;
      let mastercardPayments = 0;
      let instapayPayments = 0;
      let vodafoneCashPayments = 0;
      let otherPayments = 0;
      let totalSales = 0;

      for (const p of activeSession.payments) {
        totalSales += p.amount;
        if (p.paymentMethod === 'CASH') cashPayments += p.amount;
        else if (p.paymentMethod === 'VISA') visaPayments += p.amount;
        else if (p.paymentMethod === 'MASTERCARD') mastercardPayments += p.amount;
        else if (p.paymentMethod === 'INSTAPAY') instapayPayments += p.amount;
        else if (p.paymentMethod === 'VODAFONE_CASH') vodafoneCashPayments += p.amount;
        else otherPayments += p.amount;
      }

      let cashExpenses = 0;
      let otherExpenses = 0;
      let totalExpenses = 0;

      for (const e of activeSession.expenses) {
        totalExpenses += e.amount;
        if (e.paymentMethod === 'CASH') cashExpenses += e.amount;
        else otherExpenses += e.amount;
      }

      const expectedCash = activeSession.openingBalance + cashPayments - cashExpenses;

      summary = {
        openingBalance: activeSession.openingBalance,
        cashPayments,
        visaPayments,
        mastercardPayments,
        instapayPayments,
        vodafoneCashPayments,
        otherPayments,
        digitalTotal: visaPayments + mastercardPayments + instapayPayments + vodafoneCashPayments + otherPayments,
        totalSales,
        cashExpenses,
        otherExpenses,
        totalExpenses,
        expectedCash,
      };
    }

    const pastSessions = await prisma.cashSession.findMany({
      where: { branchId },
      orderBy: { openedAt: 'desc' },
      take: 15,
      include: {
        branch: true,
        employee: {
          select: { name: true, username: true },
        },
      },
    });

    return NextResponse.json({
      activeSession,
      summary,
      pastSessions,
    });
  } catch (error: any) {
    console.error('Cashier error:', error);
    return NextResponse.json({ error: 'فشل استرجاع بيانات الخزينة' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const body = await req.json();
    const { action, branchId, openingBalance, actualCash, notes, sessionId } = body;

    const targetBranchId = session.role === 'SUPER_ADMIN' ? (branchId || session.homeBranchId) : session.homeBranchId;

    if (!canAccessBranch(session, targetBranchId)) {
      return NextResponse.json({ error: 'غير مصرح لك بإدارة خزينة فرع آخر' }, { status: 403 });
    }

    if (action === 'OPEN') {
      if (!targetBranchId) {
        return NextResponse.json({ error: 'يرجى تحديد الفرع لفتح الخزينة' }, { status: 400 });
      }

      const existingOpen = await prisma.cashSession.findFirst({
        where: { branchId: targetBranchId, status: 'OPEN' },
      });

      if (existingOpen) {
        return NextResponse.json({ error: 'توجد نوبة خزينة مفتوحة بالفعل لهذا الفرع' }, { status: 400 });
      }

      const branch = await prisma.branch.findUnique({ where: { id: targetBranchId } });
      const sessionNumber = generateSessionNumber(branch?.code || 'BR');

      const newSession = await prisma.cashSession.create({
        data: {
          sessionNumber,
          branchId: targetBranchId,
          employeeId: session.userId,
          openingBalance: parseFloat(openingBalance || '0'),
          expectedCash: parseFloat(openingBalance || '0'),
          status: 'OPEN',
          notes: notes || null,
        },
        include: { branch: true },
      });

      await logActivity({
        userId: session.userId,
        action: 'CASH_OPEN',
        entityType: 'CASH_SESSION',
        entityId: newSession.id,
        branchId: targetBranchId,
        details: { sessionNumber, openingBalance: newSession.openingBalance, branch: newSession.branch.name },
      });

      return NextResponse.json({ success: true, session: newSession });
    }

    if (action === 'CLOSE') {
      if (!sessionId) {
        return NextResponse.json({ error: 'رقم الخزينة مطلوب للإغلاق' }, { status: 400 });
      }

      const activeSession = await prisma.cashSession.findUnique({
        where: { id: sessionId },
        include: {
          payments: true,
          expenses: true,
          branch: true,
        },
      });

      if (!activeSession || activeSession.status !== 'OPEN') {
        return NextResponse.json({ error: 'الخزينة غير مفتوحة أو تم إغلاقها مسبقاً' }, { status: 400 });
      }

      if (!canAccessBranch(session, activeSession.branchId)) {
        return NextResponse.json({ error: 'غير مصرح لك بإغلاق خزينة فرع آخر' }, { status: 403 });
      }

      let cashPayments = 0;
      for (const p of activeSession.payments) {
        if (p.paymentMethod === 'CASH') cashPayments += p.amount;
      }

      let cashExpenses = 0;
      for (const e of activeSession.expenses) {
        if (e.paymentMethod === 'CASH') cashExpenses += e.amount;
      }

      const expectedCash = activeSession.openingBalance + cashPayments - cashExpenses;
      const actual = parseFloat(actualCash || '0');
      const difference = actual - expectedCash;

      const closedSession = await prisma.cashSession.update({
        where: { id: sessionId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closingBalance: actual,
          expectedCash,
          actualCash: actual,
          difference,
          notes: notes || activeSession.notes,
        },
      });

      await logActivity({
        userId: session.userId,
        action: 'CASH_CLOSING',
        entityType: 'CASH_SESSION',
        entityId: sessionId,
        branchId: activeSession.branchId,
        details: {
          sessionNumber: activeSession.sessionNumber,
          expectedCash,
          actualCash: actual,
          difference,
          branch: activeSession.branch.name,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم إغلاق الخزينة والتقفيل اليومي بنجاح',
        session: closedSession,
        summary: {
          expectedCash,
          actualCash: actual,
          difference,
        },
      });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error: any) {
    console.error('Cashier action error:', error);
    return NextResponse.json({ error: 'فشل تنفيذ عملية الخزينة: ' + error.message }, { status: 500 });
  }
}
