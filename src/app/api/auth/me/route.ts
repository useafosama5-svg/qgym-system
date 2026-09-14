import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        homeBranch: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'المستخدم غير متاح' }, { status: 401 });
    }

    const permissions = user.role.rolePermissions.map((rp) => rp.permission.key);

    return NextResponse.json({
      user: {
        userId: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role.name,
        roleDisplayName: user.role.displayName,
        homeBranchId: user.homeBranchId,
        homeBranchName: user.homeBranch?.name || null,
        homeBranchCode: user.homeBranch?.code || null,
        permissions,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'فشل استرجاع بيانات المستخدم' }, { status: 500 });
  }
}
