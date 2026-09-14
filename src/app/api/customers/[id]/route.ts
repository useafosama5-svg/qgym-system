import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, canAccessBranch } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        homeBranch: true,
        memberships: {
          orderBy: { createdAt: 'desc' },
          include: {
            plan: true,
            allowedBranches: {
              include: {
                branch: true,
              },
            },
            freezes: {
              orderBy: { createdAt: 'desc' },
              include: {
                approvedBy: {
                  select: { name: true, username: true },
                },
              },
            },
            createdBy: {
              select: { name: true, username: true },
            },
          },
        },
        attendance: {
          orderBy: { checkinTime: 'desc' },
          take: 30,
          include: {
            branch: true,
            employee: {
              select: { name: true, username: true },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            branch: true,
            receivedBy: {
              select: { name: true, username: true },
            },
          },
        },
        measurements: {
          orderBy: { recordedAt: 'desc' },
          include: {
            trainer: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
        workoutPlans: {
          orderBy: { createdAt: 'desc' },
          include: {
            trainer: {
              include: {
                user: { select: { name: true } },
              },
            },
            exercises: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        branchHistories: {
          orderBy: { createdAt: 'desc' },
          include: {
            oldBranch: true,
            newBranch: true,
            createdBy: { select: { name: true } },
          },
        },
        trainerAssignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            trainer: {
              include: {
                user: { select: { name: true } },
                branch: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'العميل غير موجود في النظام' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error('Customer profile error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء استرجاع ملف العميل' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
    }

    // Strict Branch Isolation Check: Only Super Admin or Home Branch staff can edit customer profile
    if (!canAccessBranch(session, existingCustomer.homeBranchId)) {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل بيانات عميل تابع لفرع آخر' }, { status: 403 });
    }

    const {
      firstName,
      lastName,
      phone,
      whatsapp,
      email,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      status,
      photo,
    } = body;

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        whatsapp,
        email,
        dateOfBirth,
        gender,
        address,
        emergencyContact,
        status,
        photo,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: id,
      branchId: updated.homeBranchId,
      details: { name: `${updated.firstName} ${updated.lastName}`, code: updated.customerCode },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل تعديل بيانات العميل: ' + error.message }, { status: 500 });
  }
}
