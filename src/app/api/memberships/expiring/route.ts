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
    const range = searchParams.get('range') || '7'; // '0' (today), '3', '7', '14', '30'
    const days = parseInt(range, 10);
    const requestedBranchId = searchParams.get('branchId');
    const branchId = getEnforcedBranchId(session, requestedBranchId);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 23, 59, 59);

    const branchFilter = branchId ? { homeBranchId: branchId } : {};

    const memberships = await prisma.membership.findMany({
      where: {
        ...branchFilter,
        status: { in: ['ACTIVE', 'EXPIRED'] },
        endDate: {
          gte: days === 0 ? startDate : new Date(now.getTime() - 24 * 60 * 60 * 1000 * 3), // include up to 3 days recently expired
          lte: endDate,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            firstName: true,
            lastName: true,
            phone: true,
            whatsapp: true,
          },
        },
        plan: true,
        homeBranch: true,
      },
      orderBy: { endDate: 'asc' },
    });

    const formatted = memberships.map((m) => {
      const diffMs = new Date(m.endDate).getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: m.id,
        membershipNumber: m.membershipNumber,
        customerId: m.customer.id,
        customerCode: m.customer.customerCode,
        customerName: `${m.customer.firstName} ${m.customer.lastName}`,
        phone: m.customer.phone,
        whatsapp: m.customer.whatsapp || m.customer.phone,
        planId: m.planId,
        planName: m.plan.name,
        planPrice: m.plan.price,
        planDuration: m.plan.durationDays,
        homeBranch: m.homeBranch.name,
        homeBranchId: m.homeBranchId,
        startDate: m.startDate,
        endDate: m.endDate,
        status: m.status,
        remainingAmount: m.remainingAmount,
        daysLeft,
      };
    });

    return NextResponse.json({
      range: days,
      count: formatted.length,
      memberships: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
