import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

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

    const guestVisits = await prisma.guestVisit.findMany({
      where,
      orderBy: { visitDate: 'desc' },
      include: {
        branch: true,
        invitedBy: true,
        createdBy: {
          select: { name: true, username: true },
        },
      },
    });

    return NextResponse.json({ guestVisits });
  } catch (error) {
    return NextResponse.json({ error: 'فشل استرجاع الزيارات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, branchId, invitedByCustomerId, notes } = body;

    if (!name || !phone || !branchId) {
      return NextResponse.json({ error: 'يرجى إدخال اسم الزائر ورقم الهاتف والفرع' }, { status: 400 });
    }

    const visit = await prisma.guestVisit.create({
      data: {
        name,
        phone,
        branchId,
        invitedByCustomerId: invitedByCustomerId || null,
        notes: notes || null,
        createdById: session.userId,
      },
      include: {
        branch: true,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'GUEST_VISIT',
      entityType: 'GUEST_VISIT',
      entityId: visit.id,
      branchId,
      details: { visitorName: name, phone, branch: visit.branch.name },
    });

    return NextResponse.json({ success: true, visit });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل تسجيل الزائر: ' + error.message }, { status: 500 });
  }
}
