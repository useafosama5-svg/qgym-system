import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');
    const customerId = url.searchParams.get('customerId');
    const status = url.searchParams.get('status');
    const dateStr = url.searchParams.get('date'); // YYYY-MM-DD
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    const where: any = {};
    if (branchId && branchId !== 'ALL') {
      where.branchId = branchId;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (dateStr) {
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr);
      end.setHours(23, 59, 59, 999);
      where.checkinTime = { gte: start, lte: end };
    }

    const total = await prisma.attendance.count({ where });

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { checkinTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          include: {
            homeBranch: true,
          },
        },
        branch: true,
        membership: {
          include: {
            plan: true,
          },
        },
        employee: {
          select: { name: true, username: true },
        },
      },
    });

    return NextResponse.json({ records, total, page, limit });
  } catch (error: any) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json({ error: 'فشل استرجاع سجلات الحضور' }, { status: 500 });
  }
}
