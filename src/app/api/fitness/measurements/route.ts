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

    const measurements = await prisma.measurement.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { recordedAt: 'asc' },
      include: {
        customer: true,
        trainer: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ measurements });
  } catch (error) {
    return NextResponse.json({ error: 'فشل استرجاع القياسات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId,
      trainerId,
      weight,
      height,
      bodyFat,
      chest,
      waist,
      arms,
      thigh,
      notes,
    } = body;

    const numWeight = parseFloat(weight);
    const numHeight = parseFloat(height);

    if (!customerId || isNaN(numWeight) || isNaN(numHeight) || numHeight <= 0) {
      return NextResponse.json({ error: 'يرجى إدخال الوزن والطول بشكل صحيح' }, { status: 400 });
    }

    // BMI calculation: weight (kg) / (height(m) ^ 2)
    const heightInMeters = numHeight / 100;
    const bmi = parseFloat((numWeight / (heightInMeters * heightInMeters)).toFixed(1));

    const measurement = await prisma.measurement.create({
      data: {
        customerId,
        trainerId: trainerId || null,
        weight: numWeight,
        height: numHeight,
        bodyFat: bodyFat ? parseFloat(bodyFat) : null,
        bmi,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        arms: arms ? parseFloat(arms) : null,
        thigh: thigh ? parseFloat(thigh) : null,
        notes: notes || null,
        recordedAt: new Date(),
      },
      include: {
        customer: true,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'MEASUREMENT',
      entityType: 'MEASUREMENT',
      entityId: measurement.id,
      branchId: measurement.customer.homeBranchId,
      details: {
        customer: `${measurement.customer.firstName} ${measurement.customer.lastName}`,
        weight: numWeight,
        bmi,
        bodyFat,
      },
    });

    return NextResponse.json({ success: true, measurement });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل تسجيل القياسات: ' + error.message }, { status: 500 });
  }
}
