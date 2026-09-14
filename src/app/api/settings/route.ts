import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });
    return NextResponse.json({ settings: settingsObj, raw: settings });
  } catch (error) {
    return NextResponse.json({ error: 'فشل استرجاع الإعدادات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل إعدادات النظام' }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body; // key-value map

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'بيانات الإعدادات غير صالحة' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          group: 'GENERAL',
        },
      });
    }

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'SETTINGS',
      details: settings,
    });

    return NextResponse.json({ success: true, message: 'تم حفظ الإعدادات بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل حفظ الإعدادات: ' + error.message }, { status: 500 });
  }
}
