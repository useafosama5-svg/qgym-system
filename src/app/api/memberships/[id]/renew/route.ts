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
    const body = await req.json().catch(() => ({}));
    const {
      planId,
      startDate: customStartDate,
      discount = 0,
      paidAmount = 0,
      paymentMethod = 'CASH',
      allowedBranchIds = [],
    } = body;

    // Fetch existing membership
    const oldMembership = await prisma.membership.findUnique({
      where: { id },
      include: { plan: true, customer: true },
    });

    if (!oldMembership) {
      return NextResponse.json({ error: 'الاشتراك غير موجود' }, { status: 404 });
    }

    // Determine target plan
    const targetPlanId = planId || oldMembership.planId;
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: targetPlanId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'باقة الاشتراك غير موجودة' }, { status: 404 });
    }

    // Calculate dates
    const now = new Date();
    let startDate = customStartDate ? new Date(customStartDate) : now;
    // If the old membership is still active and ends in the future, start from the old end date
    if (new Date(oldMembership.endDate) > now && !customStartDate) {
      startDate = new Date(oldMembership.endDate);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const price = plan.price;
    const finalPrice = Math.max(0, price - (discount || 0));
    const paid = Math.min(finalPrice, paidAmount || 0);
    const remaining = Math.max(0, finalPrice - paid);

    const membershipNumber = `MEM-${Date.now().toString().slice(-6)}`;

    // Transaction to renew
    const newMembership = await prisma.$transaction(async (tx) => {
      // 1. Mark old membership as EXPIRED if it was active
      await tx.membership.update({
        where: { id: oldMembership.id },
        data: { status: 'EXPIRED' },
      });

      // 2. Create new membership
      const created = await tx.membership.create({
        data: {
          membershipNumber,
          customerId: oldMembership.customerId,
          planId: plan.id,
          homeBranchId: oldMembership.homeBranchId,
          startDate,
          endDate,
          price,
          discount: discount || 0,
          paidAmount: paid,
          remainingAmount: remaining,
          status: 'ACTIVE',
          createdById: session.userId,
        },
      });

      // 3. Handle allowed branches
      if (plan.accessType === 'SELECTED_BRANCHES' && allowedBranchIds.length > 0) {
        await tx.membershipAllowedBranch.createMany({
          data: allowedBranchIds.map((branchId: string) => ({
            membershipId: created.id,
            branchId,
          })),
        });
      }

      // 4. Update customer status
      await tx.customer.update({
        where: { id: oldMembership.customerId },
        data: { status: 'ACTIVE' },
      });

      // 5. If payment was made, record payment and check for active cash session
      if (paid > 0) {
        const activeSession = await tx.cashSession.findFirst({
          where: {
            branchId: oldMembership.homeBranchId,
            status: 'OPEN',
          },
        });

        const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;
        await tx.payment.create({
          data: {
            paymentNumber,
            customerId: oldMembership.customerId,
            membershipId: created.id,
            branchId: oldMembership.homeBranchId,
            cashSessionId: activeSession?.id || null,
            amount: paid,
            paymentMethod: paymentMethod || 'CASH',
            receivedById: session.userId,
            notes: `تجديد اشتراك - باقة ${plan.name}`,
          },
        });
      }

      return created;
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'MEMBERSHIP',
      entityId: newMembership.id,
      branchId: oldMembership.homeBranchId,
      details: {
        action: 'RENEWAL',
        oldMembershipId: oldMembership.id,
        plan: plan.name,
        price,
        paid,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تجديد الاشتراك بنجاح',
      membership: newMembership,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل تجديد الاشتراك: ' + error.message }, { status: 500 });
  }
}
