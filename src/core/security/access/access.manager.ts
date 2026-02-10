export type Role = 'USER' | 'TECHNICIAN' | 'SUPERVISOR' | 'ADMIN';

export const PERMISSIONS: Record<Role, string[]> = {
    USER: [
        'ticket:create',
        'ticket:read:own',
        'ticket:comment',
        'attachment:upload',
        'attachment:read:own'
    ],
    TECHNICIAN: [
        'ticket:read:all',
        'ticket:update',
        'ticket:comment',
        'ticket:resolve',
        'attachment:read:all',
        'attachment:upload'
    ],
    SUPERVISOR: [
        'ticket:read:all',
        'ticket:update',
        'ticket:assign',
        'ticket:escalate',
        'ticket:delete',
        'ticket:view:sensitive',
        'reports:read',
        'reports:export',
        'users:read'
    ],
    ADMIN: ['*']
};

export class AccessManager {
    /**
     * Checks if a user with a given role has the required permission.
     * @param userRole The role of the user (e.g., 'USER', 'ADMIN')
     * @param requiredPermission The specific permission string to check (e.g., 'ticket:create')
     * @returns true if access is granted, false otherwise
     */
    canAccess(userRole: Role, requiredPermission: string): boolean {
        const userPermissions = PERMISSIONS[userRole] || [];

        // Admin has all permissions
        if (userPermissions.includes('*')) return true;

        // Check for exact match
        if (userPermissions.includes(requiredPermission)) return true;

        // Check for wildcard scope match (e.g., 'ticket:*' allows 'ticket:create')
        const [scope] = requiredPermission.split(':');
        if (userPermissions.includes(`${scope}:*`)) return true;

        return false;
    }
}
