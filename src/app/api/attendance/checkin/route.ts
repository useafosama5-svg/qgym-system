import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { validateAndProcessCheckIn } from '@/lib/access-control';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const { searchQuery, branchId, method } = body;

    if (!searchQuery || !branchId) {
      return NextResponse.json({ error: 'يرجى إدخال كود العميل أو الهاتف وتحديد الفرع' }, { status: 400 });
    }

    const result = await validateAndProcessCheckIn({
      searchQuery,
      branchId,
      employeeId: session.userId,
      method: method || 'CUSTOMER_CODE',
    });

    if (result.customer) {
      await logActivity({
        userId: session.userId,
        action: result.status === 'ALLOWED' ? 'CHECKIN' : 'CHECKIN_DENIED',
        entityType: 'ATTENDANCE',
        entityId: result.attendanceId,
        branchId: branchId,
        details: {
          customer: `${result.customer.firstName} ${result.customer.lastName}`,
          code: result.customer.customerCode,
          status: result.status,
          denialReason: result.denialReason || null,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء معالجة تسجيل الدخول' }, { status: 500 });
  }
}
