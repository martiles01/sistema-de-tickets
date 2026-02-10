import prisma from '../../database/prisma';

export type AuditAction =
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'TICKET_CREATE'
    | 'TICKET_UPDATE'
    | 'TICKET_DELETE'
    | 'TICKET_ACCESS'
    | 'SENSITIVE_DATA_ACCESS'
    | 'PERMISSION_DENIED'
    | 'SECURITY_ALERT';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface AuditEntry {
    timestamp: Date;
    action: AuditAction;
    severity: AuditSeverity;
    userId: string;
    resourceId?: string;
    details?: any;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditLogger {
    // In a real application, this would interface with a database or a dedicated logging service (e.g., ELK, Splunk)
    async log(entry: AuditEntry): Promise<void> {
        const logData = {
            ...entry,
            timestamp: entry.timestamp || new Date(), // Ensure timestamp exists
        };

        // Console output for development/debugging, structured for potential JSON parsing
        if (entry.severity === 'CRITICAL' || entry.severity === 'ERROR') {
            console.error(JSON.stringify(logData));
        } else if (entry.severity === 'WARNING') {
            console.warn(JSON.stringify(logData));
        } else {
            console.log(JSON.stringify(logData));
        }

        // TODO: Implement persistent storage here (e.g., database insert)
        try {
            await prisma.auditLog.create({
                data: {
                    action: entry.action,
                    severity: entry.severity,
                    userId: entry.userId,
                    tenantId: entry.tenantId,
                    resourceId: entry.resourceId ?? undefined,
                    details: entry.details ?? undefined,
                    ipAddress: entry.ipAddress ?? undefined,
                    createdAt: entry.timestamp || new Date()
                }
            });
        } catch (error) {
            console.error('Failed to write audit log to DB:', error);
            // Fallback: File system logging could go here
        }
    }
}
