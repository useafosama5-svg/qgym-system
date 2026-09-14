import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }, { status: 400 });
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: username.trim() },
        ],
      },
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

    // Auto-recovery: If user is not found, check if database is unseeded and auto-seed initial admin
    if (!user) {
      const userCount = await prisma.user.count().catch(() => null);
      if (userCount === 0) {
        const { ensureDefaultProductionData } = await import('@/lib/init-db');
        await ensureDefaultProductionData();
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: username.trim() },
              { email: username.trim() },
            ],
          },
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
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'هذا الحساب موقوف، يرجى التواصل مع الإدارة' }, { status: 403 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const permissions = user.role.rolePermissions.map((rp) => rp.permission.key);

    const sessionPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role.name as 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'RECEPTION' | 'TRAINER',
      roleDisplayName: user.role.displayName,
      homeBranchId: user.homeBranchId,
      homeBranchName: user.homeBranch?.name || null,
      permissions,
    };

    const token = signToken(sessionPayload);

    // Audit log
    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      branchId: user.homeBranchId,
      details: { username: user.username, role: user.role.name },
    });

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      token,
    });

    // Set cookie
    response.cookies.set('qgym_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' }, { status: 500 });
  }
}
