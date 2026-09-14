import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, getEnforcedBranchId, canAccessBranch } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { generatePaymentNumber } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const url = new URL(req.url);
    const requestedBranchId = url.searchParams.get('branchId');
    const paymentMethod = url.searchParams.get('paymentMethod');
    const customerId = url.searchParams.get('customerId');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    const where: any = {};
    const enforcedBranchId = getEnforcedBranchId(session, requestedBranchId);
    if (enforcedBranchId) {
      where.branchId = enforcedBranchId;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const total = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: true,
        membership: {
          include: { plan: true },
        },
        branch: true,
        receivedBy: {
          select: { name: true, username: true },
        },
      },
    });

    return NextResponse.json({ payments, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ أثناء استرجاع المدفوعات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, membershipId, branchId, amount, paymentMethod, reference, notes } = body;

    const targetBranchId = session.role === 'SUPER_ADMIN' ? (branchId || session.homeBranchId) : session.homeBranchId;
    const payAmount = parseFloat(amount);

    if (!customerId || !targetBranchId || isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: 'يرجى إكمال البيانات وقيمة الدفع بشكل صحيح' }, { status: 400 });
    }

    // Branch authorization check
    if (!canAccessBranch(session, targetBranchId)) {
      return NextResponse.json({ error: 'غير مصرح لك بتسجيل دفعات لفرع آخر' }, { status: 403 });
    }

    const activeSession = await prisma.cashSession.findFirst({
      where: { branchId: targetBranchId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    const count = await prisma.payment.count();
    const paymentNumber = generatePaymentNumber(count + 1);

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        customerId,
        membershipId: membershipId || null,
        branchId: targetBranchId,
        cashSessionId: activeSession?.id || null,
        amount: payAmount,
        paymentMethod: paymentMethod || 'CASH',
        reference: reference || null,
        notes: notes || null,
        receivedById: session.userId,
      },
      include: {
        customer: true,
        branch: true,
      },
    });

    if (membershipId) {
      const mem = await prisma.membership.findUnique({ where: { id: membershipId } });
      if (mem) {
        const newPaid = mem.paidAmount + payAmount;
        const newRemaining = Math.max(0, mem.price - mem.discount - newPaid);
        await prisma.membership.update({
          where: { id: membershipId },
          data: {
            paidAmount: newPaid,
            remainingAmount: newRemaining,
          },
        });
      }
    }

    await logActivity({
      userId: session.userId,
      action: 'PAYMENT',
      entityType: 'PAYMENT',
      entityId: payment.id,
      branchId: targetBranchId,
      details: {
        paymentNumber,
        amount: payAmount,
        method: paymentMethod,
        customer: `${payment.customer.firstName} ${payment.customer.lastName}`,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل تسجيل الدفعة: ' + error.message }, { status: 500 });
  }
}
