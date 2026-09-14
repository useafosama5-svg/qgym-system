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
    const { newBranchId, reason } = body;

    if (!newBranchId) {
      return NextResponse.json({ error: 'يرجى تحديد الفرع الجديد' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { homeBranch: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
    }

    if (customer.homeBranchId === newBranchId) {
      return NextResponse.json({ error: 'العميل مسجل بالفعل في هذا الفرع' }, { status: 400 });
    }

    const oldBranchId = customer.homeBranchId;
    const oldBranchName = customer.homeBranch.name;

    const newBranch = await prisma.branch.findUnique({
      where: { id: newBranchId },
    });

    if (!newBranch) {
      return NextResponse.json({ error: 'الفرع الجديد غير موجود' }, { status: 404 });
    }

    // 1. Update Customer's Home Branch
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { homeBranchId: newBranchId },
    });

    // 2. Add history record
    const history = await prisma.customerBranchHistory.create({
      data: {
        customerId: id,
        oldBranchId: oldBranchId,
        newBranchId: newBranchId,
        action: 'TRANSFERRED',
        notes: reason || `نقل الفرع الأساسي من ${oldBranchName} إلى ${newBranch.name}`,
        createdById: session.userId,
      },
    });

    // 3. Log activity
    await logActivity({
      userId: session.userId,
      action: 'BRANCH_TRANSFER',
      entityType: 'CUSTOMER',
      entityId: id,
      branchId: newBranchId,
      details: {
        customerCode: customer.customerCode,
        fromBranch: oldBranchName,
        toBranch: newBranch.name,
        reason: reason || 'طلب العميل',
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم نقل الفرع الأساسي بنجاح إلى ${newBranch.name}`,
      customer: updatedCustomer,
      history,
    });
  } catch (error: any) {
    console.error('Branch transfer error:', error);
    return NextResponse.json({ error: 'فشل نقل العميل: ' + error.message }, { status: 500 });
  }
}
