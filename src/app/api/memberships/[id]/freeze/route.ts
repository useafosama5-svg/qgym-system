import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { freezeDays, reason } = body;

    const days = parseInt(freezeDays, 10);
    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ error: 'يرجى تحديد عدد أيام تجميد صحيح' }, { status: 400 });
    }

    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        customer: true,
        plan: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'الاشتراك غير موجود' }, { status: 404 });
    }

    if (membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'يمكن تجميد الاشتراكات النشطة فقط' }, { status: 400 });
    }

    if (!membership.plan.freezeAllowed) {
      return NextResponse.json({ error: 'هذه الباقة لا تسمح بالتجميد' }, { status: 400 });
    }

    if (days > membership.plan.freezeDaysMax) {
      return NextResponse.json(
        { error: `الحد الأقصى لأيام التجميد لهذه الباقة هو ${membership.plan.freezeDaysMax} يوم` },
        { status: 400 }
      );
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + days * 86400000);
    // Extend original membership endDate by the freeze days
    const currentEnd = new Date(membership.endDate);
    const newEndDate = new Date(currentEnd.getTime() + days * 86400000);

    // 1. Create freeze record
    const freeze = await prisma.membershipFreeze.create({
      data: {
        membershipId: id,
        freezeDays: days,
        startDate,
        endDate,
        reason: reason || 'طلب العميل',
        approvedById: session.userId,
        status: 'ACTIVE',
      },
    });

    // 2. Update Membership status and new end date
    const updatedMembership = await prisma.membership.update({
      where: { id },
      data: {
        status: 'FROZEN',
        endDate: newEndDate,
      },
    });

    // 3. Update customer status
    await prisma.customer.update({
      where: { id: membership.customerId },
      data: { status: 'FROZEN' },
    });

    // 4. Audit log
    await logActivity({
      userId: session.userId,
      action: 'FREEZE',
      entityType: 'MEMBERSHIP',
      entityId: id,
      branchId: membership.homeBranchId,
      details: {
        customer: `${membership.customer.firstName} ${membership.customer.lastName}`,
        freezeDays: days,
        newEndDate: newEndDate.toISOString().slice(0, 10),
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم تجميد الاشتراك بنجاح لمدة ${days} يوم وتمديد تاريخ الانتهاء تلقائياً إلى ${newEndDate.toLocaleDateString('ar-EG')}`,
      freeze,
      membership: updatedMembership,
    });
  } catch (error: any) {
    console.error('Freeze error:', error);
    return NextResponse.json({ error: 'فشل تجميد الاشتراك: ' + error.message }, { status: 500 });
  }
}
