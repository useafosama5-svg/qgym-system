import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for QGym Multi-Branch System...');

  // Clean existing tables
  await prisma.activityLog.deleteMany();
  await prisma.guestVisit.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.customerTrainer.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.cashSession.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.membershipFreeze.deleteMany();
  await prisma.membershipAllowedBranch.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.customerBranchHistory.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 1. Create Branches
  const branchNasr = await prisma.branch.create({
    data: {
      name: 'فرع مدينة نصر (Nasr City)',
      code: 'BR-NASR',
      address: 'شارع عباس العقاد، المنطقة الأولى، مدينة نصر، القاهرة',
      phone: '01011112222',
      status: 'ACTIVE',
      openingTime: '06:00',
      closingTime: '00:00',
    },
  });

  const branchMaadi = await prisma.branch.create({
    data: {
      name: 'فرع المعادي (Maadi)',
      code: 'BR-MAADI',
      address: 'شارع اللاسلكي، دجلة، المعادي، القاهرة',
      phone: '01022223333',
      status: 'ACTIVE',
      openingTime: '06:00',
      closingTime: '23:30',
    },
  });

  const branchTagamoa = await prisma.branch.create({
    data: {
      name: 'فرع التجمع الخامس (New Cairo)',
      code: 'BR-TAGAMOA',
      address: 'شارع التسعين الشمالي، التجمع الخامس، القاهرة الجديدة',
      phone: '01033334444',
      status: 'ACTIVE',
      openingTime: '06:00',
      closingTime: '00:00',
    },
  });

  console.log('✅ Created 3 Branches: Nasr City, Maadi, New Cairo');

  // 2. Create Roles
  const roleSuperAdmin = await prisma.role.create({
    data: {
      name: 'SUPER_ADMIN',
      displayName: 'المدير العام (Super Admin)',
      description: 'صلاحيات كاملة وغير محدودة لإدارة كافة الفروع والموظفين والمالية',
    },
  });

  const roleBranchManager = await prisma.role.create({
    data: {
      name: 'BRANCH_MANAGER',
      displayName: 'مدير فرع (Branch Manager)',
      description: 'إدارة كاملة للفرع الخاص به فقط بما يشمل العملاء والاشتراكات والمالية والموظفين',
    },
  });

  const roleReception = await prisma.role.create({
    data: {
      name: 'RECEPTION',
      displayName: 'استقبال (Reception)',
      description: 'تسجيل العملاء وتسجيل الدخول وتجديد الاشتراكات وتحصيل المدفوعات في الفرع',
    },
  });

  const roleTrainer = await prisma.role.create({
    data: {
      name: 'TRAINER',
      displayName: 'مدرب (Trainer)',
      description: 'متابعة المتدربين والقياسات والتمارين والخطط التدريبية',
    },
  });

  console.log('✅ Created 4 Roles');

  // 3. Create Permissions
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
    const createdPerm = await prisma.permission.create({ data: perm });
    // Assign all permissions to Super Admin
    await prisma.rolePermission.create({
      data: { roleId: roleSuperAdmin.id, permissionId: createdPerm.id },
    });

    // Assign branch manager permissions
    if (!perm.key.includes('settings.') && !perm.key.includes('branches.manage')) {
      await prisma.rolePermission.create({
        data: { roleId: roleBranchManager.id, permissionId: createdPerm.id },
      });
    }

    // Assign reception permissions
    if (
      ['customers.view', 'customers.create', 'customers.edit', 'memberships.view', 'memberships.create', 'attendance.checkin', 'attendance.view', 'finance.payments', 'finance.cashier'].includes(perm.key)
    ) {
      await prisma.rolePermission.create({
        data: { roleId: roleReception.id, permissionId: createdPerm.id },
      });
    }

    // Assign trainer permissions
    if (['customers.view', 'fitness.measurements', 'fitness.workouts'].includes(perm.key)) {
      await prisma.rolePermission.create({
        data: { roleId: roleTrainer.id, permissionId: createdPerm.id },
      });
    }
  }

  // 4. Create Users (Default Password: "password123")
  const hashedPassword = await bcrypt.hash('password123', 10);

  const userSuperAdmin = await prisma.user.create({
    data: {
      name: 'أحمد الإداري (Super Admin)',
      email: 'admin@qgym.com',
      username: 'admin',
      passwordHash: hashedPassword,
      roleId: roleSuperAdmin.id,
      phone: '01000000001',
      status: 'ACTIVE',
    },
  });

  const userMgrNasr = await prisma.user.create({
    data: {
      name: 'حسام حسن (مدير فرع نصر)',
      email: 'mgr.nasr@qgym.com',
      username: 'mgr_nasr',
      passwordHash: hashedPassword,
      roleId: roleBranchManager.id,
      homeBranchId: branchNasr.id,
      phone: '01000000002',
      status: 'ACTIVE',
    },
  });

  const userMgrMaadi = await prisma.user.create({
    data: {
      name: 'خالد توفيق (مدير فرع المعادي)',
      email: 'mgr.maadi@qgym.com',
      username: 'mgr_maadi',
      passwordHash: hashedPassword,
      roleId: roleBranchManager.id,
      homeBranchId: branchMaadi.id,
      phone: '01000000003',
      status: 'ACTIVE',
    },
  });

  const userMgrTagamoa = await prisma.user.create({
    data: {
      name: 'سالم الدوسري (مدير فرع التجمع)',
      email: 'mgr.tagamoa@qgym.com',
      username: 'mgr_tagamoa',
      passwordHash: hashedPassword,
      roleId: roleBranchManager.id,
      homeBranchId: branchTagamoa.id,
      phone: '01000000004',
      status: 'ACTIVE',
    },
  });

  const userRecNasr = await prisma.user.create({
    data: {
      name: 'مينا سمير (استقبال نصر)',
      email: 'rec.nasr@qgym.com',
      username: 'rec_nasr',
      passwordHash: hashedPassword,
      roleId: roleReception.id,
      homeBranchId: branchNasr.id,
      phone: '01000000005',
      status: 'ACTIVE',
    },
  });

  const userRecMaadi = await prisma.user.create({
    data: {
      name: 'نور الدين (استقبال المعادي)',
      email: 'rec.maadi@qgym.com',
      username: 'rec_maadi',
      passwordHash: hashedPassword,
      roleId: roleReception.id,
      homeBranchId: branchMaadi.id,
      phone: '01000000006',
      status: 'ACTIVE',
    },
  });

  const userRecTagamoa = await prisma.user.create({
    data: {
      name: 'رنا محمود (استقبال التجمع)',
      email: 'rec.tagamoa@qgym.com',
      username: 'rec_tagamoa',
      passwordHash: hashedPassword,
      roleId: roleReception.id,
      homeBranchId: branchTagamoa.id,
      phone: '01000000007',
      status: 'ACTIVE',
    },
  });

  const userTrainerOmar = await prisma.user.create({
    data: {
      name: 'الكابتن عمر الشناوي (مدرب)',
      email: 'trainer.omar@qgym.com',
      username: 'trainer_omar',
      passwordHash: hashedPassword,
      roleId: roleTrainer.id,
      homeBranchId: branchNasr.id,
      phone: '01000000008',
      status: 'ACTIVE',
    },
  });

  const trainerProfileOmar = await prisma.trainer.create({
    data: {
      userId: userTrainerOmar.id,
      branchId: branchNasr.id,
      specialization: 'BODYBUILDING',
      bio: 'خبير كمال الأجسام واللياقة البدنية حاصل على بطولات جمهورية وشهادات IFBB و ISSA',
      status: 'ACTIVE',
    },
  });

  const userTrainerTarek = await prisma.user.create({
    data: {
      name: 'الكابتن طارق عبد العزيز (مدرب)',
      email: 'trainer.tarek@qgym.com',
      username: 'trainer_tarek',
      passwordHash: hashedPassword,
      roleId: roleTrainer.id,
      homeBranchId: branchMaadi.id,
      phone: '01000000009',
      status: 'ACTIVE',
    },
  });

  const trainerProfileTarek = await prisma.trainer.create({
    data: {
      userId: userTrainerTarek.id,
      branchId: branchMaadi.id,
      specialization: 'CROSSFIT',
      bio: 'مدرب كروس فيت معتمد وتأهيل حركي وتغذية رياضية',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created Users and Trainer Profiles');

  // 5. Create Membership Plans
  const planMonthlySingle = await prisma.membershipPlan.create({
    data: {
      name: 'اشتراك شهري (فرع واحد فقط)',
      description: 'دخول غير محدود لفرع الاشتراك الأساسي فقط لمدة شهر',
      durationDays: 30,
      price: 900,
      accessType: 'HOME_BRANCH_ONLY',
      freezeAllowed: true,
      freezeDaysMax: 7,
      status: 'ACTIVE',
    },
  });

  const planThreeMonthsVIP = await prisma.membershipPlan.create({
    data: {
      name: 'اشتراك 3 شهور VIP (شامل كافة الفروع)',
      description: 'دخول مفتوح لجميع فروع QGym الثلاثة بدون أي قيود + ساونا وجاكوزي',
      durationDays: 90,
      price: 2400,
      accessType: 'UNLIMITED',
      freezeAllowed: true,
      freezeDaysMax: 15,
      status: 'ACTIVE',
    },
  });

  const planSixMonthsSelected = await prisma.membershipPlan.create({
    data: {
      name: 'اشتراك 6 شهور (فرعان محددين)',
      description: 'دخول فرعين يختارهما العميل مع مرونة كاملة في التبديل',
      durationDays: 180,
      price: 4200,
      accessType: 'SELECTED_BRANCHES',
      freezeAllowed: true,
      freezeDaysMax: 30,
      status: 'ACTIVE',
    },
  });

  const planAnnualPlatinum = await prisma.membershipPlan.create({
    data: {
      name: 'اشتراك سنوي بلاتينيوم VIP (كافة الفروع)',
      description: 'اشتراك سنوي شامل كل الفروع + 12 جلسة تدريب خاص مجاناً + دعوات زيارات شهرية',
      durationDays: 365,
      price: 7500,
      accessType: 'UNLIMITED',
      freezeAllowed: true,
      freezeDaysMax: 60,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created Membership Plans');

  // 6. Create Customers
  const customerAhmed = await prisma.customer.create({
    data: {
      customerCode: 'GYM-000101',
      firstName: 'أحمد',
      lastName: 'محمد محمود',
      phone: '01099887766',
      whatsapp: '01099887766',
      email: 'ahmed.mohamed@example.com',
      dateOfBirth: '1995-04-12',
      gender: 'MALE',
      address: 'مدينة نصر، الحي السابع',
      emergencyContact: '01222334455 (والده)',
      status: 'ACTIVE',
      homeBranchId: branchNasr.id,
      barcode: '000101',
      qrCode: 'GYM-000101',
    },
  });

  const customerMahmoud = await prisma.customer.create({
    data: {
      customerCode: 'GYM-000102',
      firstName: 'محمود',
      lastName: 'حسن إبراهيم',
      phone: '01122334455',
      whatsapp: '01122334455',
      email: 'mahmoud.hassan@example.com',
      dateOfBirth: '1998-08-20',
      gender: 'MALE',
      address: 'مساكن الشروق، نصر سيتي',
      emergencyContact: '01099881122 (أخوه)',
      status: 'ACTIVE',
      homeBranchId: branchNasr.id,
      barcode: '000102',
      qrCode: 'GYM-000102',
    },
  });

  const customerSarah = await prisma.customer.create({
    data: {
      customerCode: 'GYM-000103',
      firstName: 'سارة',
      lastName: 'علي المنشاوي',
      phone: '01233445566',
      whatsapp: '01233445566',
      email: 'sarah.ali@example.com',
      dateOfBirth: '2000-01-15',
      gender: 'FEMALE',
      address: 'المعادي، كورنيش النيل',
      emergencyContact: '01155667788 (والدتها)',
      status: 'ACTIVE',
      homeBranchId: branchMaadi.id,
      barcode: '000103',
      qrCode: 'GYM-000103',
    },
  });

  const customerOmar = await prisma.customer.create({
    data: {
      customerCode: 'GYM-000104',
      firstName: 'عمر',
      lastName: 'خالد السعيد',
      phone: '01555667788',
      whatsapp: '01555667788',
      email: 'omar.khaled@example.com',
      dateOfBirth: '1992-11-03',
      gender: 'MALE',
      address: 'التجمع الخامس، البنفسج',
      emergencyContact: '01011223344 (زوجته)',
      status: 'ACTIVE',
      homeBranchId: branchTagamoa.id,
      barcode: '000104',
      qrCode: 'GYM-000104',
    },
  });

  const customerYoussef = await prisma.customer.create({
    data: {
      customerCode: 'GYM-000105',
      firstName: 'يوسف',
      lastName: 'إبراهيم صبري',
      phone: '01066778899',
      whatsapp: '01066778899',
      email: 'youssef.sabry@example.com',
      dateOfBirth: '1996-06-25',
      gender: 'MALE',
      address: 'دجلة المعادي',
      emergencyContact: '01233221100',
      status: 'ACTIVE',
      homeBranchId: branchMaadi.id,
      barcode: '000105',
      qrCode: 'GYM-000105',
    },
  });

  const customerMona = await prisma.customer.create({
    data: {
      customerCode: 'GYM-000106',
      firstName: 'منى',
      lastName: 'عادل عبد الرحمن',
      phone: '01188990011',
      whatsapp: '01188990011',
      email: 'mona.adel@example.com',
      dateOfBirth: '1999-09-10',
      gender: 'FEMALE',
      address: 'مكرم عبيد، مدينة نصر',
      emergencyContact: '01055443322',
      status: 'FROZEN',
      homeBranchId: branchNasr.id,
      barcode: '000106',
      qrCode: 'GYM-000106',
    },
  });

  console.log('✅ Created 6 Customers across branches');

  // 7. Create Customer Branch Transfer History
  await prisma.customerBranchHistory.create({
    data: {
      customerId: customerAhmed.id,
      newBranchId: branchNasr.id,
      action: 'CREATED',
      notes: 'تسجيل العميل لأول مرة في فرع مدينة نصر',
      createdById: userRecNasr.id,
    },
  });

  await prisma.customerBranchHistory.create({
    data: {
      customerId: customerOmar.id,
      oldBranchId: branchNasr.id,
      newBranchId: branchTagamoa.id,
      action: 'TRANSFERRED',
      notes: 'نقل الفرع الأساسي إلى التجمع الخامس بسبب تغيير محل السكن',
      createdById: userSuperAdmin.id,
    },
  });

  // 8. Create Active Cashier Sessions
  const cashSessionNasr = await prisma.cashSession.create({
    data: {
      sessionNumber: 'SES-NASR-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01',
      branchId: branchNasr.id,
      employeeId: userRecNasr.id,
      openingBalance: 1500,
      expectedCash: 3900,
      actualCash: null,
      status: 'OPEN',
      notes: 'خزينة نوبة الصباح - استقبال فرع نصر',
    },
  });

  const cashSessionMaadi = await prisma.cashSession.create({
    data: {
      sessionNumber: 'SES-MAADI-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01',
      branchId: branchMaadi.id,
      employeeId: userRecMaadi.id,
      openingBalance: 2000,
      expectedCash: 6200,
      actualCash: null,
      status: 'OPEN',
      notes: 'خزينة نوبة الصباح - استقبال المعادي',
    },
  });

  const cashSessionTagamoa = await prisma.cashSession.create({
    data: {
      sessionNumber: 'SES-TAG-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01',
      branchId: branchTagamoa.id,
      employeeId: userRecTagamoa.id,
      openingBalance: 1000,
      expectedCash: 8500,
      actualCash: null,
      status: 'OPEN',
      notes: 'خزينة نوبة الصباح - استقبال التجمع',
    },
  });

  console.log('✅ Created Active Cash Sessions for all 3 branches');

  // 9. Create Memberships
  // Ahmed: VIP 3 Months (UNLIMITED access)
  const memAhmed = await prisma.membership.create({
    data: {
      membershipNumber: 'MEM-2026-001',
      customerId: customerAhmed.id,
      planId: planThreeMonthsVIP.id,
      homeBranchId: branchNasr.id,
      startDate: new Date(Date.now() - 15 * 86400000),
      endDate: new Date(Date.now() + 75 * 86400000),
      price: 2400,
      discount: 0,
      paidAmount: 2400,
      remainingAmount: 0,
      status: 'ACTIVE',
      createdById: userRecNasr.id,
    },
  });

  // Mahmoud: 1 Month Single Branch (Nasr only)
  const memMahmoud = await prisma.membership.create({
    data: {
      membershipNumber: 'MEM-2026-002',
      customerId: customerMahmoud.id,
      planId: planMonthlySingle.id,
      homeBranchId: branchNasr.id,
      startDate: new Date(Date.now() - 5 * 86400000),
      endDate: new Date(Date.now() + 25 * 86400000),
      price: 900,
      discount: 0,
      paidAmount: 900,
      remainingAmount: 0,
      status: 'ACTIVE',
      createdById: userRecNasr.id,
    },
  });

  // Sarah: 6 Months Selected (Maadi + Nasr City)
  const memSarah = await prisma.membership.create({
    data: {
      membershipNumber: 'MEM-2026-003',
      customerId: customerSarah.id,
      planId: planSixMonthsSelected.id,
      homeBranchId: branchMaadi.id,
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(Date.now() + 150 * 86400000),
      price: 4200,
      discount: 200,
      paidAmount: 4000,
      remainingAmount: 0,
      status: 'ACTIVE',
      createdById: userRecMaadi.id,
    },
  });

  // Attach allowed branches for Sarah (Maadi & Nasr)
  await prisma.membershipAllowedBranch.createMany({
    data: [
      { membershipId: memSarah.id, branchId: branchMaadi.id },
      { membershipId: memSarah.id, branchId: branchNasr.id },
    ],
  });

  // Omar: Platinum Annual (UNLIMITED access)
  const memOmar = await prisma.membership.create({
    data: {
      membershipNumber: 'MEM-2026-004',
      customerId: customerOmar.id,
      planId: planAnnualPlatinum.id,
      homeBranchId: branchTagamoa.id,
      startDate: new Date(Date.now() - 60 * 86400000),
      endDate: new Date(Date.now() + 305 * 86400000),
      price: 7500,
      discount: 0,
      paidAmount: 7500,
      remainingAmount: 0,
      status: 'ACTIVE',
      createdById: userRecTagamoa.id,
    },
  });

  // Youssef: Expired Membership (Ended 10 days ago)
  const memYoussef = await prisma.membership.create({
    data: {
      membershipNumber: 'MEM-2026-005',
      customerId: customerYoussef.id,
      planId: planMonthlySingle.id,
      homeBranchId: branchMaadi.id,
      startDate: new Date(Date.now() - 40 * 86400000),
      endDate: new Date(Date.now() - 10 * 86400000),
      price: 900,
      discount: 0,
      paidAmount: 900,
      remainingAmount: 0,
      status: 'EXPIRED',
      createdById: userRecMaadi.id,
    },
  });

  // Mona: Frozen Membership
  const memMona = await prisma.membership.create({
    data: {
      membershipNumber: 'MEM-2026-006',
      customerId: customerMona.id,
      planId: planThreeMonthsVIP.id,
      homeBranchId: branchNasr.id,
      startDate: new Date(Date.now() - 20 * 86400000),
      endDate: new Date(Date.now() + 85 * 86400000), // Extended by 15 days
      price: 2400,
      discount: 0,
      paidAmount: 2400,
      remainingAmount: 0,
      status: 'FROZEN',
      createdById: userRecNasr.id,
    },
  });

  await prisma.membershipFreeze.create({
    data: {
      membershipId: memMona.id,
      freezeDays: 15,
      startDate: new Date(Date.now() - 2 * 86400000),
      endDate: new Date(Date.now() + 13 * 86400000),
      reason: 'سفر مفاجئ لظروف العمل',
      approvedById: userMgrNasr.id,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created Memberships, Allowed Branches & Freeze records');

  // 10. Create Payments
  await prisma.payment.createMany({
    data: [
      {
        paymentNumber: 'PAY-2026-0001',
        customerId: customerAhmed.id,
        membershipId: memAhmed.id,
        branchId: branchNasr.id,
        cashSessionId: cashSessionNasr.id,
        amount: 2400,
        paymentMethod: 'CASH',
        reference: 'REC-0012',
        receivedById: userRecNasr.id,
        paymentDate: new Date(Date.now() - 15 * 86400000),
        notes: 'سداد كامل اشتراك 3 شهور VIP كاش',
      },
      {
        paymentNumber: 'PAY-2026-0002',
        customerId: customerMahmoud.id,
        membershipId: memMahmoud.id,
        branchId: branchNasr.id,
        cashSessionId: cashSessionNasr.id,
        amount: 900,
        paymentMethod: 'INSTAPAY',
        reference: 'IP-99882211',
        receivedById: userRecNasr.id,
        paymentDate: new Date(Date.now() - 5 * 86400000),
        notes: 'دفع عبر إنستاباي لفرع نصر',
      },
      {
        paymentNumber: 'PAY-2026-0003',
        customerId: customerSarah.id,
        membershipId: memSarah.id,
        branchId: branchMaadi.id,
        cashSessionId: cashSessionMaadi.id,
        amount: 4000,
        paymentMethod: 'VISA',
        reference: 'POS-TXN-8871',
        receivedById: userRecMaadi.id,
        paymentDate: new Date(Date.now() - 30 * 86400000),
        notes: 'سداد بالفيزا في فرع المعادي',
      },
      {
        paymentNumber: 'PAY-2026-0004',
        customerId: customerOmar.id,
        membershipId: memOmar.id,
        branchId: branchTagamoa.id,
        cashSessionId: cashSessionTagamoa.id,
        amount: 7500,
        paymentMethod: 'CASH',
        reference: 'REC-0099',
        receivedById: userRecTagamoa.id,
        paymentDate: new Date(Date.now() - 60 * 86400000),
        notes: 'اشتراك سنوي كاش - فرع التجمع',
      },
    ],
  });

  // 11. Create Branch Expenses
  await prisma.expense.createMany({
    data: [
      {
        branchId: branchNasr.id,
        cashSessionId: cashSessionNasr.id,
        category: 'SUPPLIES',
        amount: 350,
        paymentMethod: 'CASH',
        description: 'شراء أدوات نظافة ومطهرات ومعطرات للجيم',
        createdById: userRecNasr.id,
      },
      {
        branchId: branchMaadi.id,
        cashSessionId: cashSessionMaadi.id,
        category: 'MAINTENANCE',
        amount: 600,
        paymentMethod: 'CASH',
        description: 'صيانة سير الجري رقم 4 وتبديل رولمان بلي',
        createdById: userMgrMaadi.id,
      },
      {
        branchId: branchTagamoa.id,
        cashSessionId: cashSessionTagamoa.id,
        category: 'UTILITIES',
        amount: 1200,
        paymentMethod: 'CASH',
        description: 'فاتورة مياه وكهرباء إضافية',
        createdById: userMgrTagamoa.id,
      },
    ],
  });

  // 12. Create Attendance Records (Across Branches to demonstrate multi-branch checkin)
  await prisma.attendance.createMany({
    data: [
      // Ahmed (Home: Nasr) checked in at Nasr, Maadi, and Tagamoa successfully
      {
        customerId: customerAhmed.id,
        branchId: branchNasr.id,
        membershipId: memAhmed.id,
        checkinTime: new Date(Date.now() - 2 * 86400000 + 3600000 * 10),
        employeeId: userRecNasr.id,
        method: 'QR_CODE',
        status: 'ALLOWED',
      },
      {
        customerId: customerAhmed.id,
        branchId: branchMaadi.id,
        membershipId: memAhmed.id,
        checkinTime: new Date(Date.now() - 1 * 86400000 + 3600000 * 18),
        employeeId: userRecMaadi.id,
        method: 'CUSTOMER_CODE',
        status: 'ALLOWED',
      },
      {
        customerId: customerAhmed.id,
        branchId: branchTagamoa.id,
        membershipId: memAhmed.id,
        checkinTime: new Date(Date.now() - 3600000 * 2),
        employeeId: userRecTagamoa.id,
        method: 'BARCODE',
        status: 'ALLOWED',
      },
      // Mahmoud (Home: Nasr, Single Branch) checked in at Nasr (ALLOWED), then tried Maadi (DENIED)
      {
        customerId: customerMahmoud.id,
        branchId: branchNasr.id,
        membershipId: memMahmoud.id,
        checkinTime: new Date(Date.now() - 1 * 86400000 + 3600000 * 14),
        employeeId: userRecNasr.id,
        method: 'CUSTOMER_CODE',
        status: 'ALLOWED',
      },
      {
        customerId: customerMahmoud.id,
        branchId: branchMaadi.id,
        membershipId: memMahmoud.id,
        checkinTime: new Date(Date.now() - 3600000 * 4),
        employeeId: userRecMaadi.id,
        method: 'CUSTOMER_CODE',
        status: 'DENIED',
        denialReason: 'الاشتراك مخصص لفرع مدينة نصر فقط ولا يشمل فرع المعادي',
      },
      // Sarah (Home: Maadi, Allowed in Maadi & Nasr)
      {
        customerId: customerSarah.id,
        branchId: branchMaadi.id,
        membershipId: memSarah.id,
        checkinTime: new Date(Date.now() - 1 * 86400000 + 3600000 * 11),
        employeeId: userRecMaadi.id,
        method: 'PHONE',
        status: 'ALLOWED',
      },
      // Youssef (Expired) tried to enter
      {
        customerId: customerYoussef.id,
        branchId: branchMaadi.id,
        membershipId: memYoussef.id,
        checkinTime: new Date(Date.now() - 3600000 * 1),
        employeeId: userRecMaadi.id,
        method: 'CUSTOMER_CODE',
        status: 'DENIED',
        denialReason: 'الاشتراك منتهي الصلاحية منذ 10 أيام - يلزم التجديد',
      },
    ],
  });

  // 13. Trainer Client Assignments, Measurements & Workout Plans
  await prisma.customerTrainer.create({
    data: {
      customerId: customerAhmed.id,
      trainerId: trainerProfileOmar.id,
      status: 'ACTIVE',
      notes: 'برنامج تدريب ضخامة عضلية وتخفيض نسبة الدهون',
    },
  });

  await prisma.measurement.createMany({
    data: [
      {
        customerId: customerAhmed.id,
        trainerId: trainerProfileOmar.id,
        weight: 84.5,
        height: 178,
        bodyFat: 18.2,
        bmi: 26.7,
        chest: 104,
        waist: 88,
        arms: 38,
        thigh: 59,
        notes: 'القياس الأولي قبل بدء دورة التضخيم',
        recordedAt: new Date(Date.now() - 30 * 86400000),
      },
      {
        customerId: customerAhmed.id,
        trainerId: trainerProfileOmar.id,
        weight: 82.0,
        height: 178,
        bodyFat: 15.5,
        bmi: 25.9,
        chest: 106,
        waist: 84,
        arms: 39,
        thigh: 60,
        notes: 'تحسن ملحوظ في نسبة الدهون وزيادة الكتلة العضلية في الصدر والذراعين',
        recordedAt: new Date(Date.now() - 5 * 86400000),
      },
    ],
  });

  const workoutPlanAhmed = await prisma.workoutPlan.create({
    data: {
      customerId: customerAhmed.id,
      trainerId: trainerProfileOmar.id,
      title: 'خطة التضخيم والنحت العضلي 4 أيام (Upper / Lower)',
      description: 'جدول متقدم لزيادة القوة والحجم العضلي مع التركيز على التقنية والتغذية',
      startDate: new Date(Date.now() - 15 * 86400000),
      status: 'ACTIVE',
    },
  });

  await prisma.workoutExercise.createMany({
    data: [
      {
        workoutPlanId: workoutPlanAhmed.id,
        dayOfWeek: 1,
        dayName: 'اليوم الأول: الصدر والترايسبس',
        exerciseName: 'Barbell Bench Press (بنش برس بالبار)',
        sets: 4,
        reps: '8-10',
        targetWeight: 80,
        restSeconds: 90,
        orderIndex: 1,
        notes: 'التركيز على النزول البطيء والتحكم',
      },
      {
        workoutPlanId: workoutPlanAhmed.id,
        dayOfWeek: 1,
        dayName: 'اليوم الأول: الصدر والترايسبس',
        exerciseName: 'Incline Dumbbell Press (تجميع عالي بالدمبل)',
        sets: 3,
        reps: '10-12',
        targetWeight: 28,
        restSeconds: 60,
        orderIndex: 2,
      },
      {
        workoutPlanId: workoutPlanAhmed.id,
        dayOfWeek: 1,
        dayName: 'اليوم الأول: الصدر والترايسبس',
        exerciseName: 'Cable Flyes (تفتيح كابل)',
        sets: 3,
        reps: '12-15',
        targetWeight: 15,
        restSeconds: 45,
        orderIndex: 3,
      },
      {
        workoutPlanId: workoutPlanAhmed.id,
        dayOfWeek: 1,
        dayName: 'اليوم الأول: الصدر والترايسبس',
        exerciseName: 'Triceps Rope Pushdown (ترايسبس حبل)',
        sets: 4,
        reps: '12-15',
        targetWeight: 25,
        restSeconds: 45,
        orderIndex: 4,
      },
      {
        workoutPlanId: workoutPlanAhmed.id,
        dayOfWeek: 2,
        dayName: 'اليوم الثاني: الظهر والبايسبس',
        exerciseName: 'Lat Pulldown (سحب عالي واسع)',
        sets: 4,
        reps: '10-12',
        targetWeight: 65,
        restSeconds: 60,
        orderIndex: 1,
      },
      {
        workoutPlanId: workoutPlanAhmed.id,
        dayOfWeek: 2,
        dayName: 'اليوم الثاني: الظهر والبايسبس',
        exerciseName: 'Seated Cable Row (سحب أرضي ضيق)',
        sets: 4,
        reps: '10-12',
        targetWeight: 60,
        restSeconds: 60,
        orderIndex: 2,
      },
    ],
  });

  // 14. Guest Visits
  await prisma.guestVisit.create({
    data: {
      name: 'كريم وائل',
      phone: '01099112233',
      invitedByCustomerId: customerAhmed.id,
      branchId: branchNasr.id,
      notes: 'زيارة تجريبية بدعوة من العميل أحمد محمد - مهتم باشتراك 6 شهور',
      convertedToCustomer: false,
      createdById: userRecNasr.id,
    },
  });

  // 15. Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: userSuperAdmin.id,
        action: 'CREATE',
        entityType: 'BRANCH',
        entityId: branchNasr.id,
        branchId: branchNasr.id,
        detailsJson: JSON.stringify({ message: 'تهيئة وإطلاق فرع مدينة نصر المركزي' }),
      },
      {
        userId: userRecNasr.id,
        action: 'CREATE',
        entityType: 'CUSTOMER',
        entityId: customerAhmed.id,
        branchId: branchNasr.id,
        detailsJson: JSON.stringify({ code: 'GYM-000101', name: 'أحمد محمد' }),
      },
      {
        userId: userRecNasr.id,
        action: 'PAYMENT',
        entityType: 'PAYMENT',
        entityId: 'PAY-2026-0001',
        branchId: branchNasr.id,
        detailsJson: JSON.stringify({ amount: 2400, method: 'CASH' }),
      },
      {
        userId: userMgrNasr.id,
        action: 'FREEZE',
        entityType: 'MEMBERSHIP',
        entityId: memMona.id,
        branchId: branchNasr.id,
        detailsJson: JSON.stringify({ customer: 'منى عادل', freezeDays: 15 }),
      },
    ],
  });

  // 16. System Settings
  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'gym_name',
        value: 'QGYM Fitness & Wellness Club',
        group: 'GENERAL',
        description: 'اسم المنشأة الرياضية',
      },
      {
        key: 'currency',
        value: 'EGP',
        group: 'FINANCE',
        description: 'العملة الأساسية للنظام (جنيه مصري)',
      },
      {
        key: 'tax_percentage',
        value: '0',
        group: 'FINANCE',
        description: 'نسبة الضريبة المضافة إن وجدت',
      },
      {
        key: 'checkin_grace_minutes',
        value: '15',
        group: 'ATTENDANCE',
        description: 'دقائق السماح عند الدخول',
      },
      {
        key: 'notifications_expiry_days',
        value: '7,3,1',
        group: 'NOTIFICATIONS',
        description: 'أيام التنبيه قبل انتهاء الاشتراك',
      },
    ],
  });

  console.log('🎉 Seeding successfully completed! Full Multi-Branch environment is ready.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
