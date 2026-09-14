import { prisma } from './prisma';

export interface AuditLogParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  branchId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
}

export async function logActivity(params: AuditLogParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        branchId: params.branchId || null,
        detailsJson: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
