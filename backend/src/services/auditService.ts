import { db } from '../db/store.ts';
import { AuditLog } from '../types/index.ts';

export class AuditService {
  static log(
    adminId: string,
    adminEmail: string,
    action: string,
    entity: string,
    entityId: string,
    oldValue?: any,
    newValue?: any,
    ip: string = 'internal'
  ): AuditLog {
    return db.addAuditLog({
      adminId,
      adminEmail,
      action,
      entity,
      entityId,
      oldValue: oldValue !== undefined ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : undefined,
      newValue: newValue !== undefined ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : undefined,
      ip,
    });
  }

  static getLogs(limit: number = 100): AuditLog[] {
    return db.auditLogs.slice(0, limit);
  }
}
