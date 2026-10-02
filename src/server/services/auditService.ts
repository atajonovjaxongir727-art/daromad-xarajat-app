import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAuditLog(params: {
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RECEIVE_PAYMENT' | 'DEACTIVATE' | 'ACTIVATE' | 'LOGIN' | 'TRANSFER';
  entityType: 'INCOME' | 'EXPENSE' | 'RECURRING' | 'DEBT' | 'ACCOUNT' | 'USER';
  entityId?: string;
  description: string;
  oldData?: any;
  newData?: any;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        oldData: params.oldData ? JSON.stringify(params.oldData) : null,
        newData: params.newData ? JSON.stringify(params.newData) : null,
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
