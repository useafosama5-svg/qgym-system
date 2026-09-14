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
    const action = url.searchParams.get('action');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    const where: any = {};
    if (branchId && branchId !== 'ALL') {
      where.branchId = branchId;
    }
    if (action && action !== 'ALL') {
      where.action = action;
    }

    const total = await prisma.activityLog.count({ where });

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { name: true, username: true },
        },
        branch: {
          select: { name: true, code: true },
        },
      },
    });

    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: 'فشل استرجاع سجل الأنشطة' }, { status: 500 });
  }
}
