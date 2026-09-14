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
    const customerId = url.searchParams.get('customerId');

    const workoutPlans = await prisma.workoutPlan.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        trainer: {
          include: {
            user: { select: { name: true } },
          },
        },
        exercises: {
          orderBy: [{ dayOfWeek: 'asc' }, { orderIndex: 'asc' }],
        },
      },
    });

    return NextResponse.json({ workoutPlans });
  } catch (error) {
    return NextResponse.json({ error: 'فشل استرجاع الخطط التدريبية' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, trainerId, title, description, exercises } = body;

    if (!customerId || !title || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json({ error: 'يرجى إدخال عنوان الخطة والتمارين' }, { status: 400 });
    }

    const plan = await prisma.workoutPlan.create({
      data: {
        customerId,
        trainerId: trainerId || null,
        title,
        description: description || null,
        status: 'ACTIVE',
        exercises: {
          create: exercises.map((ex: any, idx: number) => ({
            dayOfWeek: parseInt(ex.dayOfWeek || '1', 10),
            dayName: ex.dayName || `اليوم ${ex.dayOfWeek}`,
            exerciseName: ex.exerciseName,
            sets: parseInt(ex.sets || '3', 10),
            reps: ex.reps || '10-12',
            targetWeight: ex.targetWeight ? parseFloat(ex.targetWeight) : null,
            restSeconds: parseInt(ex.restSeconds || '60', 10),
            notes: ex.notes || null,
            orderIndex: idx + 1,
          })),
        },
      },
      include: {
        customer: true,
        exercises: true,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'WORKOUT_PLAN',
      entityType: 'WORKOUT_PLAN',
      entityId: plan.id,
      details: {
        title: plan.title,
        customer: `${plan.customer.firstName} ${plan.customer.lastName}`,
        exercisesCount: plan.exercises.length,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل إنشاء جدول التمارين: ' + error.message }, { status: 500 });
  }
}
