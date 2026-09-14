import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { generatePaymentNumber } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search')?.trim();

    const where: any = {};
    if (branchId && branchId !== 'ALL') {
      where.homeBranchId = branchId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.customer = {
        OR: [
          { customerCode: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    const memberships = await prisma.membership.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        plan: true,
        homeBranch: true,
        allowedBranches: {
          include: { branch: true },
        },
        freezes: {
          orderBy: { createdAt: 'desc' },
        },
        createdBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ memberships });
  } catch (error) {
    return NextResponse.json({ error: 'فشل استرجاع الاشتراكات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId,
      planId,
      homeBranchId,
      startDate,
      discount,
      paidAmount,
      paymentMethod,
      allowedBranchIds,
      notes,
    } = body;

    if (!customerId || !planId || !homeBranchId) {
      return NextResponse.json({ error: 'يرجى إكمال الحقول الإلزامية' }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'الباقة المحددة غير صالحة' }, { status: 400 });
    }

    const sDate = startDate ? new Date(startDate) : new Date();
    const eDate = new Date(sDate.getTime() + plan.durationDays * 86400000);
    const count = await prisma.membership.count();
    const memNumber = `MEM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const price = plan.price;
    const disc = Number(discount) || 0;
    const paid = Number(paidAmount) || 0;
    const net = Math.max(0, price - disc);
    const remaining = Math.max(0, net - paid);

    const membership = await prisma.membership.create({
      data: {
        membershipNumber: memNumber,
        customerId,
        planId: plan.id,
        homeBranchId,
        startDate: sDate,
        endDate: eDate,
        price,
        discount: disc,
        paidAmount: paid,
        remainingAmount: remaining,
        status: 'ACTIVE',
        notes: notes || null,
        createdById: session.userId,
      },
      include: {
        customer: true,
        plan: true,
        homeBranch: true,
      },
    });

    // Update customer status to ACTIVE
    await prisma.customer.update({
      where: { id: customerId },
      data: { status: 'ACTIVE' },
    });

    // Allowed branches
    if (plan.accessType === 'SELECTED_BRANCHES' && Array.isArray(allowedBranchIds)) {
      for (const bId of allowedBranchIds) {
        await prisma.membershipAllowedBranch.create({
          data: { membershipId: membership.id, branchId: bId },
        });
      }
    }

    // Payment
    if (paid > 0) {
      const activeSession = await prisma.cashSession.findFirst({
        where: { branchId: homeBranchId, status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
      });

      const payCount = await prisma.payment.count();
      const payNumber = generatePaymentNumber(payCount + 1);

      await prisma.payment.create({
        data: {
          paymentNumber: payNumber,
          customerId,
          membershipId: membership.id,
          branchId: homeBranchId,
          cashSessionId: activeSession?.id || null,
          amount: paid,
          paymentMethod: paymentMethod || 'CASH',
          reference: `MEM-${memNumber}`,
          receivedById: session.userId,
          notes: `سداد اشتراك ${plan.name}`,
        },
      });
    }

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'MEMBERSHIP',
      entityId: membership.id,
      branchId: homeBranchId,
      details: {
        membershipNumber: memNumber,
        customer: `${membership.customer.firstName} ${membership.customer.lastName}`,
        plan: plan.name,
        price: net,
      },
    });

    return NextResponse.json({ success: true, membership });
  } catch (error: any) {
    console.error('Membership create error:', error);
    return NextResponse.json({ error: 'فشل إنشاء الاشتراك: ' + error.message }, { status: 500 });
  }
}
