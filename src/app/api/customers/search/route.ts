import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ customers: [], memberships: [] });
    }

    const branchFilter =
      session.role === 'SUPER_ADMIN'
        ? {}
        : { homeBranchId: session.homeBranchId || undefined };

    const customers = await prisma.customer.findMany({
      where: {
        ...branchFilter,
        OR: [
          { customerCode: { contains: q } },
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { phone: { contains: q } },
          { barcode: { contains: q } },
          { qrCode: { contains: q } },
        ],
      },
      include: {
        homeBranch: true,
        memberships: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
      take: 10,
    });

    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
