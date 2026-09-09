import { db } from '../db/store.ts';
import { AuditLog } from '../types/index.ts';
import { supabaseService } from '../db/supabase.ts';

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
    const logEntry = db.addAuditLog({
      adminId,
      adminEmail,
      action,
      entity,
      entityId,
      oldValue: oldValue !== undefined ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : undefined,
      newValue: newValue !== undefined ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : undefined,
      ip,
    });

    // Real-time synchronization with Supabase
    supabaseService.syncAuditLogRealtime(logEntry).catch(console.error);

    return logEntry;
  }

  static getLogs(limit: number = 100): AuditLog[] {
    return db.auditLogs.slice(0, limit);
  }
}
