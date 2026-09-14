import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, getEnforcedBranchId, canAccessBranch } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const url = new URL(req.url);
    const requestedBranchId = url.searchParams.get('branchId');
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    const where: any = {};
    const enforcedBranchId = getEnforcedBranchId(session, requestedBranchId);
    if (enforcedBranchId) {
      where.branchId = enforcedBranchId;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    const total = await prisma.expense.count({ where });

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        branch: true,
        createdBy: {
          select: { name: true, username: true },
        },
      },
    });

    return NextResponse.json({ expenses, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ أثناء استرجاع المصروفات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const body = await req.json();
    const { branchId, category, amount, paymentMethod, description } = body;

    const targetBranchId = session.role === 'SUPER_ADMIN' ? (branchId || session.homeBranchId) : session.homeBranchId;
    const expAmount = parseFloat(amount);

    if (!targetBranchId || !category || isNaN(expAmount) || expAmount <= 0 || !description) {
      return NextResponse.json({ error: 'يرجى إكمال جميع بيانات المصروف' }, { status: 400 });
    }

    if (!canAccessBranch(session, targetBranchId)) {
      return NextResponse.json({ error: 'غير مصرح لك بتسجيل مصروفات لفرع آخر' }, { status: 403 });
    }

    const activeSession = await prisma.cashSession.findFirst({
      where: { branchId: targetBranchId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    const expense = await prisma.expense.create({
      data: {
        branchId: targetBranchId,
        cashSessionId: activeSession?.id || null,
        category,
        amount: expAmount,
        paymentMethod: paymentMethod || 'CASH',
        description,
        createdById: session.userId,
      },
      include: {
        branch: true,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'EXPENSE',
      entityType: 'EXPENSE',
      entityId: expense.id,
      branchId: targetBranchId,
      details: { amount: expAmount, category, description, branch: expense.branch.name },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل تسجيل المصروف: ' + error.message }, { status: 500 });
  }
}
