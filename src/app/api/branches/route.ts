import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');

    const branches = await prisma.branch.findMany({
      where: branchId ? { id: branchId } : undefined,
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            customers: true,
            users: true,
            attendance: true,
            memberships: true,
          },
        },
      },
    });

    // Also get active members count per branch
    const branchesWithStats = await Promise.all(
      branches.map(async (b) => {
        const activeMemberships = await prisma.membership.count({
          where: {
            homeBranchId: b.id,
            status: 'ACTIVE',
            endDate: { gte: new Date() },
          },
        });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayCheckins = await prisma.attendance.count({
          where: {
            branchId: b.id,
            status: 'ALLOWED',
            checkinTime: { gte: startOfDay },
          },
        });

        return {
          ...b,
          activeMembersCount: activeMemberships,
          todayCheckinsCount: todayCheckins,
        };
      })
    );

    return NextResponse.json({ branches: branchesWithStats });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'فشل استرجاع بيانات الفروع' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح لك بإضافة فرع جديد' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, address, phone, openingTime, closingTime } = body;

    if (!name || !code || !address || !phone) {
      return NextResponse.json({ error: 'يرجى إكمال الحقول الإلزامية' }, { status: 400 });
    }

    const existing = await prisma.branch.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'كود الفرع مستخدم مسبقاً' }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        code: code.toUpperCase(),
        address,
        phone,
        openingTime: openingTime || '06:00',
        closingTime: closingTime || '23:00',
        status: 'ACTIVE',
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'BRANCH',
      entityId: branch.id,
      branchId: branch.id,
      details: { name: branch.name, code: branch.code },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل إضافة الفرع: ' + error.message }, { status: 500 });
  }
}
