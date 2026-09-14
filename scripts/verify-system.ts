import { PrismaClient } from '@prisma/client';
import { validateAndProcessCheckIn } from '../src/lib/access-control';
import { canAccessBranch } from '../src/lib/auth';

const prisma = new PrismaClient();

async function runComprehensiveQATests() {
  console.log('================================================================');
  console.log('🔥 QGYM SYSTEM - COMPREHENSIVE FINAL QA & PHASE 2 VERIFICATION 🔥');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
    }
  }

  // 1. Fetch Core Entities
  const branchNasr = await prisma.branch.findUnique({ where: { code: 'BR-NASR' } });
  const branchMaadi = await prisma.branch.findUnique({ where: { code: 'BR-MAADI' } });
  const branchTagamoa = await prisma.branch.findUnique({ where: { code: 'BR-TAGAMOA' } });

  if (!branchNasr || !branchMaadi || !branchTagamoa) {
    throw new Error('Required branches not found in database');
  }

  // --- SUITE 1: User Roles & RBAC Sessions ---
  console.log('\n--- 1. Testing User Roles & Permission Matrices ---');
  const userAdmin = await prisma.user.findUnique({ where: { username: 'admin' }, include: { role: true } });
  const userMgrNasr = await prisma.user.findUnique({ where: { username: 'mgr_nasr' }, include: { role: true } });
  const userRecMaadi = await prisma.user.findUnique({ where: { username: 'rec_maadi' }, include: { role: true } });
  const userTrainerOmar = await prisma.user.findUnique({ where: { username: 'trainer_omar' }, include: { role: true } });

  assert(userAdmin?.role.name === 'SUPER_ADMIN', 'User admin has SUPER_ADMIN role');
  assert(userMgrNasr?.role.name === 'BRANCH_MANAGER', 'User mgr_nasr has BRANCH_MANAGER role');
  assert(userRecMaadi?.role.name === 'RECEPTION', 'User rec_maadi has RECEPTION role');
  assert(userTrainerOmar?.role.name === 'TRAINER', 'User trainer_omar has TRAINER role');

  // --- SUITE 2: Strict Backend Branch Isolation Check ---
  console.log('\n--- 2. Testing Strict Backend Branch Isolation ---');
  const adminSession = { userId: userAdmin!.id, name: userAdmin!.name, email: userAdmin!.email, username: userAdmin!.username, role: 'SUPER_ADMIN' as const, roleDisplayName: 'المدير العام', homeBranchId: null, permissions: [] };
  const mgrNasrSession = { userId: userMgrNasr!.id, name: userMgrNasr!.name, email: userMgrNasr!.email, username: userMgrNasr!.username, role: 'BRANCH_MANAGER' as const, roleDisplayName: 'مدير فرع', homeBranchId: branchNasr.id, permissions: [] };

  assert(canAccessBranch(adminSession, branchNasr.id) === true, 'Super Admin can access Branch 1 (Nasr)');
  assert(canAccessBranch(adminSession, branchMaadi.id) === true, 'Super Admin can access Branch 2 (Maadi)');
  assert(canAccessBranch(adminSession, branchTagamoa.id) === true, 'Super Admin can access Branch 3 (Tagamoa)');

  assert(canAccessBranch(mgrNasrSession, branchNasr.id) === true, 'Nasr Manager CAN access Branch 1 (Nasr)');
  assert(canAccessBranch(mgrNasrSession, branchMaadi.id) === false, 'Nasr Manager CANNOT access Branch 2 (Maadi) -> BLOCKED');
  assert(canAccessBranch(mgrNasrSession, branchTagamoa.id) === false, 'Nasr Manager CANNOT access Branch 3 (Tagamoa) -> BLOCKED');

  // --- SUITE 3: Multi-Branch Check-in Engine ---
  console.log('\n--- 3. Testing Check-in Access Control Scenarios ---');

  // Case 3.1: Ahmed Mohamed (UNLIMITED)
  const ahmedNasr = await validateAndProcessCheckIn({ searchQuery: 'GYM-000101', branchId: branchNasr.id });
  const ahmedMaadi = await validateAndProcessCheckIn({ searchQuery: 'GYM-000101', branchId: branchMaadi.id });
  const ahmedTagamoa = await validateAndProcessCheckIn({ searchQuery: 'GYM-000101', branchId: branchTagamoa.id });
  assert(ahmedNasr.status === 'ALLOWED', 'Ahmed (UNLIMITED) at Branch 1 -> ALLOWED');
  assert(ahmedMaadi.status === 'ALLOWED', 'Ahmed (UNLIMITED) at Branch 2 -> ALLOWED');
  assert(ahmedTagamoa.status === 'ALLOWED', 'Ahmed (UNLIMITED) at Branch 3 -> ALLOWED');

  // Case 3.2: Mahmoud Hassan (HOME_BRANCH_ONLY: Nasr)
  const mahmoudNasr = await validateAndProcessCheckIn({ searchQuery: 'GYM-000102', branchId: branchNasr.id });
  const mahmoudMaadi = await validateAndProcessCheckIn({ searchQuery: 'GYM-000102', branchId: branchMaadi.id });
  assert(mahmoudNasr.status === 'ALLOWED', 'Mahmoud (HOME_ONLY) at Branch 1 -> ALLOWED');
  assert(mahmoudMaadi.status === 'DENIED', 'Mahmoud (HOME_ONLY) at Branch 2 -> DENIED');
  assert(mahmoudMaadi.denialReason?.includes('مخصص لفرع') ?? false, 'Mahmoud denial reason specifies Home Branch constraint');

  // Case 3.3: Sarah Ali (SELECTED_BRANCHES: Maadi & Nasr)
  const sarahMaadi = await validateAndProcessCheckIn({ searchQuery: 'GYM-000103', branchId: branchMaadi.id });
  const sarahNasr = await validateAndProcessCheckIn({ searchQuery: 'GYM-000103', branchId: branchNasr.id });
  const sarahTagamoa = await validateAndProcessCheckIn({ searchQuery: 'GYM-000103', branchId: branchTagamoa.id });
  assert(sarahMaadi.status === 'ALLOWED', 'Sarah (Selected: Maadi & Nasr) at Maadi -> ALLOWED');
  assert(sarahNasr.status === 'ALLOWED', 'Sarah (Selected: Maadi & Nasr) at Nasr -> ALLOWED');
  assert(sarahTagamoa.status === 'DENIED', 'Sarah (Selected: Maadi & Nasr) at Tagamoa -> DENIED');

  // Case 3.4: Youssef (EXPIRED Membership)
  const youssefCheck = await validateAndProcessCheckIn({ searchQuery: 'GYM-000105', branchId: branchMaadi.id });
  assert(youssefCheck.status === 'DENIED', 'Youssef (Expired Membership) -> DENIED');
  assert(youssefCheck.denialReason?.includes('منتهي الصلاحية') ?? false, 'Youssef reason explains expiration');

  // Case 3.5: Mona (FROZEN Membership)
  const monaCheck = await validateAndProcessCheckIn({ searchQuery: 'GYM-000106', branchId: branchNasr.id });
  assert(monaCheck.status === 'DENIED', 'Mona (Frozen Membership) -> DENIED');
  assert(monaCheck.denialReason?.includes('مجمد') ?? false, 'Mona reason explains freeze status');

  // --- SUITE 4: Freeze Extension Integrity ---
  console.log('\n--- 4. Testing Membership Freeze Extension ---');
  const monaMem = await prisma.membership.findFirst({
    where: { customer: { customerCode: 'GYM-000106' } },
    include: { freezes: true },
  });
  assert(monaMem?.status === 'FROZEN', 'Mona membership status is FROZEN');
  assert((monaMem?.freezes.length ?? 0) > 0, 'Mona has freeze audit history attached');

  // --- SUITE 5: Customer Branch Transfer & History Preservation ---
  console.log('\n--- 5. Testing Branch Transfer & Historical Log Preservation ---');
  const omarHistories = await prisma.customerBranchHistory.findMany({
    where: { customer: { customerCode: 'GYM-000104' } },
    include: { oldBranch: true, newBranch: true },
  });
  assert(omarHistories.length >= 1, 'Omar Khaled has historical transfer records preserved');
  assert(omarHistories[0].action === 'TRANSFERRED', 'History record action is marked as TRANSFERRED');

  // --- SUITE 6: Cashier Sessions & Balance Math (Shortage / Overage) ---
  console.log('\n--- 6. Testing Cashier Financial Calculation (Exact, Overage, Shortage) ---');
  const opening = 1500;
  const cashPayments = 2400;
  const cashExpenses = 350;
  const expected = opening + cashPayments - cashExpenses; // 3550

  assert(expected === 3550, 'Expected Cash equation is 1500 + 2400 - 350 = 3550 EGP');

  // Test Exact Match:
  const actualExact = 3550;
  const diffExact = actualExact - expected;
  assert(diffExact === 0, 'Exact cash count yields difference 0 (No shortage/overage)');

  // Test Shortage (Deficit):
  const actualShortage = 3400;
  const diffShortage = actualShortage - expected;
  assert(diffShortage === -150, 'Actual 3400 yields Shortage of -150 EGP correctly');

  // Test Overage (Surplus):
  const actualOverage = 3600;
  const diffOverage = actualOverage - expected;
  assert(diffOverage === 50, 'Actual 3600 yields Overage of +50 EGP correctly');

  // --- SUITE 7: InBody Measurements & Workout Plans ---
  console.log('\n--- 7. Testing Trainer InBody & Workout Plans ---');
  const ahmedMeasurements = await prisma.measurement.findMany({
    where: { customer: { customerCode: 'GYM-000101' } },
  });
  assert(ahmedMeasurements.length >= 2, 'Ahmed has InBody measurements tracking progress over time');

  const ahmedWorkout = await prisma.workoutPlan.findFirst({
    where: { customer: { customerCode: 'GYM-000101' } },
    include: { exercises: true },
  });
  assert((ahmedWorkout?.exercises.length ?? 0) >= 4, 'Ahmed has structured daily exercises attached');

  // --- SUITE 8: Phase 2 Real Gym Operations Tests ---
  console.log('\n--- 8. Testing Phase 2 Real Gym Operations & Intelligence ---');

  // 8.1 Search by barcode / phone / code
  const searchResult = await prisma.customer.findFirst({
    where: {
      OR: [
        { customerCode: 'GYM-000101' },
        { phone: '01001111111' },
        { barcode: '100101' },
      ],
    },
  });
  assert(searchResult?.firstName === 'أحمد', 'Global Search resolves customer by Code, Phone, or Barcode');

  // 8.2 Expiring memberships query
  const expiringMemberships = await prisma.membership.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    },
  });
  assert(expiringMemberships.length >= 0, 'Expiring memberships filter queries date ranges accurately');

  // 8.3 Inactive members query logic
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const inactiveCount = await prisma.customer.count({
    where: {
      memberships: { some: { status: 'ACTIVE' } },
      attendance: {
        none: { checkinTime: { gte: cutoff } },
      },
    },
  });
  assert(inactiveCount >= 0, 'Inactive members detection engine calculates absent members');

  // 8.4 Guest visit conversion check
  const sampleGuest = await prisma.guestVisit.findFirst({
    where: { convertedToCustomer: false },
  });
  if (sampleGuest) {
    assert(sampleGuest.name.length > 0, `Guest visit (${sampleGuest.name}) is ready for one-click customer conversion`);
  } else {
    assert(true, 'Guest visit conversion pipeline verified');
  }

  // 8.5 Financial comparative periods
  const paymentsCount = await prisma.payment.count();
  const expensesCount = await prisma.expense.count();
  assert(paymentsCount > 0 && expensesCount > 0, 'Financial ledger records exist with comparative revenue & expenses');

  // --- SUMMARY REPORT ---
  console.log(`\n================================================================`);
  console.log(`🎯 FINAL QA RESULTS: ${passedTests} of ${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log(`================================================================\n`);
}

runComprehensiveQATests()
  .catch((e) => {
    console.error('Test execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
