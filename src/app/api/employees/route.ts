import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');

    const where: any = {};
    if (branchId && branchId !== 'ALL') {
      where.homeBranchId = branchId;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        role: true,
        homeBranch: true,
      },
    });

    const roles = await prisma.role.findMany();
    const branches = await prisma.branch.findMany({ where: { status: 'ACTIVE' } });

    const sanitizedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      role: u.role,
      homeBranch: u.homeBranch,
      phone: u.phone,
      status: u.status,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: sanitizedUsers, roles, branches });
  } catch (error) {
    return NextResponse.json({ error: 'فشل استرجاع الموظفين' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'BRANCH_MANAGER')) {
      return NextResponse.json({ error: 'غير مصرح لك بإضافة موظف' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, username, password, roleId, homeBranchId, phone } = body;

    if (!name || !email || !username || !password || !roleId) {
      return NextResponse.json({ error: 'يرجى إكمال جميع الحقول الإلزامية' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو اسم المستخدم مستخدم مسبقاً' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        passwordHash,
        roleId,
        homeBranchId: homeBranchId || null,
        phone: phone || null,
        status: 'ACTIVE',
      },
      include: {
        role: true,
        homeBranch: true,
      },
    });

    // If role is trainer, create trainer profile automatically
    if (user.role.name === 'TRAINER') {
      await prisma.trainer.create({
        data: {
          userId: user.id,
          branchId: homeBranchId || (await prisma.branch.findFirst())?.id || '',
          specialization: 'FITNESS',
          status: 'ACTIVE',
        },
      });
    }

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'USER',
      entityId: user.id,
      branchId: user.homeBranchId,
      details: { name: user.name, username: user.username, role: user.role.displayName },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        homeBranch: user.homeBranch,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل إضافة الموظف: ' + error.message }, { status: 500 });
  }
}
