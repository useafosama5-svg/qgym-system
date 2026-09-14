import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-qgym-jwt-key-2026-production-ready';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  username: string;
  role: 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'RECEPTION' | 'TRAINER';
  roleDisplayName: string;
  homeBranchId: string | null;
  homeBranchName?: string | null;
  homeBranchCode?: string | null;
  permissions: string[];
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (err) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSessionFromRequest(req: NextRequest): Promise<UserSession | null> {
  // 1. Try Cookie
  const cookieToken = req.cookies.get('qgym_token')?.value;
  if (cookieToken) {
    const session = verifyToken(cookieToken);
    if (session) return session;
  }

  // 2. Try Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7);
    const session = verifyToken(bearerToken);
    if (session) return session;
  }

  return null;
}

export function canAccessBranch(session: UserSession, targetBranchId: string | null | undefined): boolean {
  if (!targetBranchId) return true;
  if (session.role === 'SUPER_ADMIN') return true;
  return session.homeBranchId === targetBranchId;
}

export function getEnforcedBranchId(session: UserSession, requestedBranchId: string | null | undefined): string | null {
  if (session.role === 'SUPER_ADMIN') {
    return (!requestedBranchId || requestedBranchId === 'ALL') ? null : requestedBranchId;
  }
  return session.homeBranchId;
}
