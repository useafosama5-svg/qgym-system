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
    const days = parseInt(searchParams.get('days') || '14', 10);
    const requestedBranchId = searchParams.get('branchId');
    const branchId = getEnforcedBranchId(session, requestedBranchId);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Find active customers who have an active membership but no attendance since cutoffDate
    const branchFilter = branchId ? { homeBranchId: branchId } : {};

    const customers = await prisma.customer.findMany({
      where: {
        ...branchFilter,
        memberships: {
          some: {
            status: 'ACTIVE',
            endDate: { gte: new Date() },
          },
        },
      },
      include: {
        homeBranch: true,
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
        attendance: {
          orderBy: { checkinTime: 'desc' },
          take: 1,
        },
      },
    });

    // Filter customers whose last checkin is older than cutoffDate or who have never checked in
    const inactiveCustomers = customers
      .filter((cust) => {
        const lastCheckin = cust.attendance[0]?.checkinTime;
        if (!lastCheckin) return true; // never checked in
        return new Date(lastCheckin) < cutoffDate;
      })
      .map((cust) => {
        const lastCheckin = cust.attendance[0]?.checkinTime;
        let daysInactive = days;
        if (lastCheckin) {
          const diffMs = Date.now() - new Date(lastCheckin).getTime();
          daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        } else {
          const diffMs = Date.now() - new Date(cust.createdAt).getTime();
          daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        }

        return {
          id: cust.id,
          customerCode: cust.customerCode,
          name: `${cust.firstName} ${cust.lastName}`,
          phone: cust.phone,
          whatsapp: cust.whatsapp || cust.phone,
          homeBranch: cust.homeBranch.name,
          homeBranchId: cust.homeBranchId,
          planName: cust.memberships[0]?.plan?.name || 'بدون باقة',
          membershipEnd: cust.memberships[0]?.endDate,
          lastCheckin: lastCheckin || null,
          daysInactive,
        };
      })
      .sort((a, b) => b.daysInactive - a.daysInactive);

    return NextResponse.json({
      days,
      count: inactiveCustomers.length,
      customers: inactiveCustomers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
