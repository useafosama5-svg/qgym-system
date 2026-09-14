import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (session) {
    await logActivity({
      userId: session.userId,
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: session.userId,
      branchId: session.homeBranchId,
    });
  }

  const response = NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  response.cookies.delete('qgym_token');
  return response;
}
