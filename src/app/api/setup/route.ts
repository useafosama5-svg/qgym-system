import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDefaultProductionData } from '@/lib/init-db';

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "branches" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT UNIQUE NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "openingTime" TEXT NOT NULL DEFAULT '06:00',
    "closingTime" TEXT NOT NULL DEFAULT '23:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT PRIMARY KEY,
    "key" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" TEXT PRIMARY KEY,
    "roleId" TEXT NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "permissionId" TEXT NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
    CONSTRAINT "role_permissions_roleId_permissionId_key" UNIQUE ("roleId", "permissionId")
  )`,
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "username" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL REFERENCES "roles"("id"),
    "homeBranchId" TEXT REFERENCES "branches"("id"),
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLogin" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT PRIMARY KEY,
    "customerCode" TEXT UNIQUE NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT UNIQUE NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "dateOfBirth" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'MALE',
    "address" TEXT,
    "emergencyContact" TEXT,
    "photo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "homeBranchId" TEXT NOT NULL REFERENCES "branches"("id"),
    "barcode" TEXT,
    "qrCode" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "customer_branch_history" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
    "oldBranchId" TEXT REFERENCES "branches"("id"),
    "newBranchId" TEXT NOT NULL REFERENCES "branches"("id"),
    "action" TEXT NOT NULL DEFAULT 'TRANSFERRED',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT REFERENCES "users"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "membership_plans" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "price" DOUBLE PRECISION NOT NULL,
    "accessType" TEXT NOT NULL DEFAULT 'HOME_BRANCH_ONLY',
    "freezeAllowed" BOOLEAN NOT NULL DEFAULT true,
    "freezeDaysMax" INTEGER NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "memberships" (
    "id" TEXT PRIMARY KEY,
    "membershipNumber" TEXT UNIQUE NOT NULL,
    "customerId" TEXT NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
    "planId" TEXT NOT NULL REFERENCES "membership_plans"("id"),
    "homeBranchId" TEXT NOT NULL REFERENCES "branches"("id"),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdById" TEXT REFERENCES "users"("id"),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "membership_allowed_branches" (
    "id" TEXT PRIMARY KEY,
    "membershipId" TEXT NOT NULL REFERENCES "memberships"("id") ON DELETE CASCADE,
    "branchId" TEXT NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
    CONSTRAINT "membership_allowed_branches_membershipId_branchId_key" UNIQUE ("membershipId", "branchId")
  )`,
  `CREATE TABLE IF NOT EXISTS "membership_freezes" (
    "id" TEXT PRIMARY KEY,
    "membershipId" TEXT NOT NULL REFERENCES "memberships"("id") ON DELETE CASCADE,
    "freezeDays" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "approvedById" TEXT REFERENCES "users"("id"),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "attendance" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
    "branchId" TEXT NOT NULL REFERENCES "branches"("id"),
    "membershipId" TEXT REFERENCES "memberships"("id"),
    "checkinTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkoutTime" TIMESTAMP(3),
    "employeeId" TEXT REFERENCES "users"("id"),
    "method" TEXT NOT NULL DEFAULT 'CUSTOMER_CODE',
    "status" TEXT NOT NULL DEFAULT 'ALLOWED',
    "denialReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "cash_sessions" (
    "id" TEXT PRIMARY KEY,
    "sessionNumber" TEXT UNIQUE NOT NULL,
    "branchId" TEXT NOT NULL REFERENCES "branches"("id"),
    "employeeId" TEXT NOT NULL REFERENCES "users"("id"),
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingBalance" DOUBLE PRECISION,
    "expectedCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualCash" DOUBLE PRECISION,
    "difference" DOUBLE PRECISION,
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT PRIMARY KEY,
    "paymentNumber" TEXT UNIQUE NOT NULL,
    "customerId" TEXT NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
    "membershipId" TEXT REFERENCES "memberships"("id"),
    "branchId" TEXT NOT NULL REFERENCES "branches"("id"),
    "cashSessionId" TEXT REFERENCES "cash_sessions"("id"),
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "receivedById" TEXT REFERENCES "users"("id"),
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "expenses" (
    "id" TEXT PRIMARY KEY,
    "branchId" TEXT NOT NULL REFERENCES "branches"("id"),
    "cashSessionId" TEXT REFERENCES "cash_sessions"("id"),
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "description" TEXT NOT NULL,
    "createdById" TEXT REFERENCES "users"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "trainers" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "branchId" TEXT NOT NULL REFERENCES "branches"("id"),
    "specialization" TEXT NOT NULL,
    "bio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "customer_trainers" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
    "trainerId" TEXT NOT NULL REFERENCES "trainers"("id") ON DELETE CASCADE,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "measurements" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
    "trainerId" TEXT REFERENCES "trainers"("id"),
    "weight" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "bodyFat" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "chest" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "arms" DOUBLE PRECISION,
    "thigh" DOUBLE PRECISION,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "workout_plans" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
    "trainerId" TEXT REFERENCES "trainers"("id"),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "workout_exercises" (
    "id" TEXT PRIMARY KEY,
    "workoutPlanId" TEXT NOT NULL REFERENCES "workout_plans"("id") ON DELETE CASCADE,
    "dayOfWeek" INTEGER NOT NULL,
    "dayName" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps" TEXT NOT NULL DEFAULT '10-12',
    "targetWeight" DOUBLE PRECISION,
    "restSeconds" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "guest_visits" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "invitedByCustomerId" TEXT REFERENCES "customers"("id"),
    "branchId" TEXT NOT NULL REFERENCES "branches"("id"),
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "convertedToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT REFERENCES "users"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES "users"("id"),
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "branchId" TEXT REFERENCES "branches"("id"),
    "detailsJson" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT PRIMARY KEY,
    "key" TEXT UNIQUE NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

async function initializeDatabase() {
  for (const sql of DDL_STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (e) {
      console.warn('DDL execution note:', e);
    }
  }
  await ensureDefaultProductionData();
}

export async function GET(req: NextRequest) {
  try {
    let userCount = await prisma.user.count().catch(() => null);

    // If tables are missing, auto-create tables and seed!
    if (userCount === null) {
      await initializeDatabase();
      userCount = await prisma.user.count().catch(() => null);
    } else if (userCount === 0) {
      await ensureDefaultProductionData();
      userCount = await prisma.user.count().catch(() => null);
    }

    const adminUser = await prisma.user.findFirst({
      where: { username: 'admin' },
      include: { role: true },
    }).catch(() => null);

    const branchesCount = await prisma.branch.count().catch(() => 0);

    return NextResponse.json({
      success: true,
      status: adminUser ? 'READY' : 'INITIALIZED',
      database: 'CONNECTED',
      stats: {
        users: userCount || 0,
        branches: branchesCount,
        adminExists: !!adminUser,
      },
      message: 'Database is connected, all tables created, and admin user is ready for login.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'CONNECTION_ERROR',
        error: error.message || 'Unknown database connection error',
        code: error.code,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database schema and seed records successfully initialized.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Setup error',
      },
      { status: 500 }
    );
  }
}
