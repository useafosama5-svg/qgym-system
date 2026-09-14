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
    const requestedBranchId = searchParams.get('branchId');
    const branchId = getEnforcedBranchId(session, requestedBranchId);

    const branchFilter = branchId ? { homeBranchId: branchId } : {};

    const employees = await prisma.user.findMany({
      where: {
        ...branchFilter,
        status: 'ACTIVE',
      },
      include: {
        role: true,
        homeBranch: true,
        createdMemberships: true,
        receivedPayments: true,
        processedAttendance: true,
      },
    });

    const stats = employees.map((emp) => {
      const membershipsCount = emp.createdMemberships.length;
      const revenueCollected = emp.receivedPayments.reduce((s, p) => s + p.amount, 0);
      const checkinsHandled = emp.processedAttendance.length;

      return {
        id: emp.id,
        name: emp.name,
        username: emp.username,
        role: emp.role.displayName,
        branch: emp.homeBranch?.name || 'كل الفروع',
        membershipsCount,
        revenueCollected,
        checkinsHandled,
        score: membershipsCount * 10 + Math.floor(revenueCollected / 100) + checkinsHandled,
      };
    });

    stats.sort((a, b) => b.score - a.score);

    return NextResponse.json({ employees: stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
