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

    const where: any = {};
    if (branchId && branchId !== 'ALL') {
      where.branchId = branchId;
    }

    const trainers = await prisma.trainer.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        branch: true,
        clients: {
          include: {
            customer: true,
          },
        },
        _count: {
          select: {
            clients: true,
            workoutPlans: true,
            measurements: true,
          },
        },
      },
    });

    return NextResponse.json({ trainers });
  } catch (error) {
    return NextResponse.json({ error: 'فشل استرجاع بيانات المدربين' }, { status: 500 });
  }
}
