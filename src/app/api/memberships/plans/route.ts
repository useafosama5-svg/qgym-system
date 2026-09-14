import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json({ error: 'فشل استرجاع باقات الاشتراك' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'BRANCH_MANAGER')) {
      return NextResponse.json({ error: 'غير مصرح لك بإضافة باقات' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, durationDays, price, accessType, freezeAllowed, freezeDaysMax } = body;

    if (!name || !price || !durationDays) {
      return NextResponse.json({ error: 'يرجى إكمال بيانات الباقة المطلوبة' }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        description: description || null,
        durationDays: parseInt(durationDays, 10),
        price: parseFloat(price),
        accessType: accessType || 'HOME_BRANCH_ONLY',
        freezeAllowed: freezeAllowed !== undefined ? freezeAllowed : true,
        freezeDaysMax: parseInt(freezeDaysMax || '15', 10),
        status: 'ACTIVE',
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'MEMBERSHIP_PLAN',
      entityId: plan.id,
      details: { name: plan.name, price: plan.price, accessType: plan.accessType },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل إضافة الباقة: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'BRANCH_MANAGER')) {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل باقات الاشتراك' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, durationDays, price, accessType, freezeAllowed, freezeDaysMax, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف الباقة مطلوب' }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(durationDays !== undefined && { durationDays: parseInt(durationDays, 10) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(accessType && { accessType }),
        ...(freezeAllowed !== undefined && { freezeAllowed: Boolean(freezeAllowed) }),
        ...(freezeDaysMax !== undefined && { freezeDaysMax: parseInt(freezeDaysMax, 10) }),
        ...(status && { status }),
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'MEMBERSHIP_PLAN',
      entityId: plan.id,
      details: { name: plan.name, price: plan.price, status: plan.status },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل تعديل الباقة: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'صلاحية حذف أو تعطيل الباقات للمدير العام فقط' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الباقة مطلوب' }, { status: 400 });
    }

    // Soft delete or archive
    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'DELETE',
      entityType: 'MEMBERSHIP_PLAN',
      entityId: plan.id,
      details: { name: plan.name, status: 'ARCHIVED' },
    });

    return NextResponse.json({ success: true, message: 'تم أرشفة الباقة بنجاح', plan });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل حذف الباقة: ' + error.message }, { status: 500 });
  }
}

