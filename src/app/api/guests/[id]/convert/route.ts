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
    const { planId, gender = 'MALE', paidAmount = 0, paymentMethod = 'CASH' } = body;

    const guest = await prisma.guestVisit.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!guest) {
      return NextResponse.json({ error: 'سجل الزائر غير موجود' }, { status: 404 });
    }

    if (guest.convertedToCustomer) {
      return NextResponse.json({ error: 'هذا الزائر تم تحويله لعميل بالفعل' }, { status: 400 });
    }

    // Split name into first and last
    const nameParts = guest.name.trim().split(' ');
    const firstName = nameParts[0] || 'عميل';
    const lastName = nameParts.slice(1).join(' ') || 'جديد';

    // Generate unique customer code
    const count = await prisma.customer.count();
    const customerCode = `GYM-${(count + 101).toString().padStart(6, '0')}`;

    const customer = await prisma.$transaction(async (tx) => {
      // 1. Create customer
      const newCust = await tx.customer.create({
        data: {
          customerCode,
          firstName,
          lastName,
          phone: guest.phone,
          gender,
          homeBranchId: guest.branchId,
          status: 'ACTIVE',
        },
      });

      // 2. Mark guest as converted
      await tx.guestVisit.update({
        where: { id: guest.id },
        data: { convertedToCustomer: true },
      });

      // 3. If plan provided, create membership
      if (planId) {
        const plan = await tx.membershipPlan.findUnique({ where: { id: planId } });
        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + plan.durationDays);

          const paid = Math.min(plan.price, paidAmount || 0);
          const remaining = Math.max(0, plan.price - paid);

          const membership = await tx.membership.create({
            data: {
              membershipNumber: `MEM-${Date.now().toString().slice(-6)}`,
              customerId: newCust.id,
              planId: plan.id,
              homeBranchId: guest.branchId,
              startDate,
              endDate,
              price: plan.price,
              paidAmount: paid,
              remainingAmount: remaining,
              status: 'ACTIVE',
              createdById: session.userId,
            },
          });

          if (paid > 0) {
            const activeSession = await tx.cashSession.findFirst({
              where: { branchId: guest.branchId, status: 'OPEN' },
            });

            await tx.payment.create({
              data: {
                paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
                customerId: newCust.id,
                membershipId: membership.id,
                branchId: guest.branchId,
                cashSessionId: activeSession?.id || null,
                amount: paid,
                paymentMethod,
                receivedById: session.userId,
                notes: `تحويل زائر واشتراك في باقة ${plan.name}`,
              },
            });
          }
        }
      }

      return newCust;
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      branchId: guest.branchId,
      details: { guestId: guest.id, customerCode: customer.customerCode, name: guest.name },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحويل الزائر إلى عميل بنجاح',
      customer,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل تحويل الزائر: ' + error.message }, { status: 500 });
  }
}
