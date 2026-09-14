import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function ensureDefaultProductionData() {
  try {
    const userCount = await prisma.user.count().catch(() => null);
    if (userCount !== null && userCount > 0) {
      return;
    }

    console.log('🌱 Initializing default QGYM production database records...');

    // 1. Branches
    const branchNasr = await prisma.branch.upsert({
      where: { code: 'BR-NASR' },
      update: {},
      create: {
        name: 'فرع مدينة نصر (Nasr City)',
        code: 'BR-NASR',
        address: 'شارع عباس العقاد، المنطقة الأولى، مدينة نصر، القاهرة',
        phone: '01011112222',
        status: 'ACTIVE',
        openingTime: '06:00',
        closingTime: '00:00',
      },
    });

    const branchMaadi = await prisma.branch.upsert({
      where: { code: 'BR-MAADI' },
      update: {},
      create: {
        name: 'فرع المعادي (Maadi)',
        code: 'BR-MAADI',
        address: 'شارع اللاسلكي، دجلة، المعادي، القاهرة',
        phone: '01022223333',
        status: 'ACTIVE',
        openingTime: '06:00',
        closingTime: '23:30',
      },
    });

    const branchTagamoa = await prisma.branch.upsert({
      where: { code: 'BR-TAGAMOA' },
      update: {},
      create: {
        name: 'فرع التجمع الخامس (New Cairo)',
        code: 'BR-TAGAMOA',
        address: 'شارع التسعين الشمالي، التجمع الخامس، القاهرة الجديدة',
        phone: '01033334444',
        status: 'ACTIVE',
        openingTime: '06:00',
        closingTime: '00:00',
      },
    });

    // 2. Roles
    const roleSuperAdmin = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'SUPER_ADMIN',
        displayName: 'المدير العام (Super Admin)',
        description: 'صلاحيات كاملة وغير محدودة لإدارة كافة الفروع والموظفين والمالية',
      },
    });

    const roleBranchManager = await prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: {},
      create: {
        name: 'BRANCH_MANAGER',
        displayName: 'مدير فرع (Branch Manager)',
        description: 'إدارة كاملة للفرع الخاص به فقط',
      },
    });

    const roleReception = await prisma.role.upsert({
      where: { name: 'RECEPTION' },
      update: {},
      create: {
        name: 'RECEPTION',
        displayName: 'استقبال (Reception)',
        description: 'تسجيل العملاء وتسجيل الدخول وتجديد الاشتراكات وتحصيل المدفوعات',
      },
    });

    const roleTrainer = await prisma.role.upsert({
      where: { name: 'TRAINER' },
      update: {},
      create: {
        name: 'TRAINER',
        displayName: 'مدرب (Trainer)',
        description: 'متابعة المتدربين والقياسات والتمارين والخطط التدريبية',
      },
    });

    // 3. Permissions
    const permissionsList = [
      { key: 'branches.view', name: 'عرض الفروع', group: 'الفروع' },
      { key: 'branches.manage', name: 'إدارة وتعديل الفروع', group: 'الفروع' },
      { key: 'users.view', name: 'عرض الموظفين', group: 'الموظفون' },
      { key: 'users.manage', name: 'إدارة الموظفين والصلاحيات', group: 'الموظفون' },
      { key: 'customers.view', name: 'عرض العملاء', group: 'العملاء' },
      { key: 'customers.create', name: 'إضافة عميل', group: 'العملاء' },
      { key: 'customers.edit', name: 'تعديل بيانات العميل', group: 'العملاء' },
      { key: 'customers.transfer', name: 'نقل الفرع الأساسي للعميل', group: 'العملاء' },
      { key: 'memberships.view', name: 'عرض الاشتراكات', group: 'الاشتراكات' },
      { key: 'memberships.create', name: 'إنشاء وتجديد اشتراك', group: 'الاشتراكات' },
      { key: 'memberships.freeze', name: 'تجميد الاشتراك', group: 'الاشتراكات' },
      { key: 'attendance.checkin', name: 'تسجيل دخول وخروج العملاء', group: 'الحضور' },
      { key: 'attendance.view', name: 'سجلات وتقارير الحضور', group: 'الحضور' },
      { key: 'finance.payments', name: 'تحصيل وعرض المدفوعات', group: 'المالية' },
      { key: 'finance.expenses', name: 'تسجيل ومتابعة المصروفات', group: 'المالية' },
      { key: 'finance.cashier', name: 'فتح وإغلاق الخزينة اليومية', group: 'المالية' },
      { key: 'fitness.measurements', name: 'تسجيل القياسات والإنبادي', group: 'اللياقة' },
      { key: 'fitness.workouts', name: 'إعداد ومتابعة جداول التمارين', group: 'اللياقة' },
      { key: 'reports.view', name: 'عرض التقارير والتحليلات', group: 'التقارير' },
      { key: 'activity.view', name: 'عرض سجل التدقيق والأنشطة', group: 'السجلات' },
      { key: 'settings.manage', name: 'إدارة إعدادات النظام', group: 'الإعدادات' },
    ];

    for (const perm of permissionsList) {
      const createdPerm = await prisma.permission.upsert({
        where: { key: perm.key },
        update: {},
        create: perm,
      });

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleSuperAdmin.id, permissionId: createdPerm.id } },
        update: {},
        create: { roleId: roleSuperAdmin.id, permissionId: createdPerm.id },
      });
    }

    // 4. Default Users
    const passwordHash = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
      where: { username: 'admin' },
      update: { passwordHash },
      create: {
        name: 'المدير العام للمجموعة',
        email: 'admin@qgym.com',
        username: 'admin',
        passwordHash,
        roleId: roleSuperAdmin.id,
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { username: 'mgr_nasr' },
      update: { passwordHash },
      create: {
        name: 'أحمد فؤاد',
        email: 'mgr.nasr@qgym.com',
        username: 'mgr_nasr',
        passwordHash,
        roleId: roleBranchManager.id,
        homeBranchId: branchNasr.id,
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { username: 'rec_maadi' },
      update: { passwordHash },
      create: {
        name: 'نورهان سعيد',
        email: 'rec.maadi@qgym.com',
        username: 'rec_maadi',
        passwordHash,
        roleId: roleReception.id,
        homeBranchId: branchMaadi.id,
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { username: 'trainer_omar' },
      update: { passwordHash },
      create: {
        name: 'كابتن عمر الشناوي',
        email: 'trainer.omar@qgym.com',
        username: 'trainer_omar',
        passwordHash,
        roleId: roleTrainer.id,
        homeBranchId: branchNasr.id,
        status: 'ACTIVE',
      },
    });

    // 5. Default Membership Plans
    await prisma.membershipPlan.upsert({
      where: { id: 'plan-monthly-single' },
      update: {},
      create: {
        id: 'plan-monthly-single',
        name: 'اشتراك شهري - فرع واحد (Monthly Standard)',
        description: 'دخول غير محدود للفرع الأساسي المسجل به العضو لمدة شهر كامل',
        durationDays: 30,
        price: 900,
        accessType: 'HOME_BRANCH_ONLY',
        freezeAllowed: false,
        freezeDaysMax: 0,
        status: 'ACTIVE',
      },
    });

    await prisma.membershipPlan.upsert({
      where: { id: 'plan-3months-vip' },
      update: {},
      create: {
        id: 'plan-3months-vip',
        name: 'باقة 3 شهور VIP شاملة لكافة الفروع (3-Months Multi-Branch VIP)',
        description: 'دخول غير محدود لجميع فروع QGYM الحالية والمستقبلية + تجميد مجاني 15 يوماً',
        durationDays: 90,
        price: 2400,
        accessType: 'UNLIMITED',
        freezeAllowed: true,
        freezeDaysMax: 15,
        status: 'ACTIVE',
      },
    });

    console.log('✅ Default QGYM production database records successfully initialized.');
  } catch (err) {
    console.error('Error in ensureDefaultProductionData:', err);
  }
}
