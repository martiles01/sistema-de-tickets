import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../core/security/auth/auth.service';
import { AccessManager, Role } from '../core/security/access/access.manager';
import { AuditLogger } from '../core/security/audit/audit.logger';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

const authService = new AuthService();
const accessManager = new AccessManager();
const auditLogger = new AuditLogger();

/**
 * Global security middleware to log requests and perform basic checks.
 */
export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Basic audit of incoming request
    auditLogger.log({
        timestamp: new Date(),
        action: 'TICKET_ACCESS', // Generic access, specific actions logged by controllers/services
        severity: 'INFO',
        userId: 'anonymous', // Will be updated if auth succeeds
        tenantId: 'unknown',
        details: { method: req.method, path: req.path, ip: req.ip },
        ipAddress: req.ip || 'unknown'
    });
    next();
};

/**
 * Middleware to authenticate users via JWT.
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Malformed token' });
    }

    const payload = await authService.validateToken(token);

    if (!payload) {
        return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    }

    req.user = payload;

    // Update audit context if possible (in a real app, use AsyncLocalStorage or similar)
    // For now, we just proceed.
    next();
};

/**
 * Middleware factory to authorize users based on role and permission.
 */
export const authorize = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
        }

        const hasAccess = accessManager.canAccess(req.user.role as Role, permission);

        if (!hasAccess) {
            auditLogger.log({
                timestamp: new Date(),
                action: 'PERMISSION_DENIED',
                severity: 'WARNING',
                userId: req.user.userId,
                tenantId: req.user.tenantId,
                details: { permission, role: req.user.role, path: req.path }
            });
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};
