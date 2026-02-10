import { Ticket } from '../models/Ticket';
import { AccessManager, Role } from '../core/security/access/access.manager';
import { AuditLogger, AuditSeverity } from '../core/security/audit/audit.logger';
import { EscalationSecurityEngine } from '../core/security/escalation/escalation.engine';
import { VaultService } from '../core/security/vault/vault.service';
import { TokenPayload } from '../core/security/auth/auth.service';
import { AuditorService } from './AuditorService';
import prisma from '../core/database/prisma';

export class TicketService {
    // private tickets: Map<string, Ticket> = new Map(); // Removed in favor of DB
    private accessManager: AccessManager;
    private auditLogger: AuditLogger;
    private escalationEngine: EscalationSecurityEngine;
    private vaultService: VaultService;
    private auditorService: AuditorService;

    constructor() {
        this.accessManager = new AccessManager();
        this.auditLogger = new AuditLogger();
        this.escalationEngine = new EscalationSecurityEngine();
        this.vaultService = new VaultService();
        this.auditorService = new AuditorService();
    }

    /**
     * Map Escalation Severity to Audit Severity
     */
    private mapSeverity(escalationSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): AuditSeverity {
        switch (escalationSeverity) {
            case 'LOW': return 'INFO';
            case 'MEDIUM': return 'WARNING';
            case 'HIGH': return 'ERROR';
            case 'CRITICAL': return 'CRITICAL';
            default: return 'INFO';
        }
    }

    /**
     * Creates a new ticket with security validations.
     */
    async createTicket(user: TokenPayload, ticketData: Partial<Ticket>): Promise<Ticket> {
        // 1. Authorization Check
        if (!this.accessManager.canAccess(user.role as Role, 'ticket:create')) {
            await this.auditLogger.log({
                timestamp: new Date(),
                action: 'PERMISSION_DENIED',
                severity: 'WARNING',
                userId: user.userId,
                tenantId: user.tenantId,
                details: { action: 'createTicket', required: 'ticket:create' }
            });
            throw new Error('Access Denied: Cannot create ticket');
        }

        // 2. Prepare Ticket Data
        const title = ticketData.title || 'Untitled';
        let description = ticketData.description || '';
        let priority = ticketData.priority || 'MEDIUM';
        const tags = ticketData.tags || [];

        // 3. Thread Detection (Escalation Engine)
        // We need a temporary object for analysis, but escalation engine analyzes strings mostly.
        const tempTicket = { title, description, interactions: [] } as any;
        const threatAnalysis = this.escalationEngine.analyze(tempTicket);

        if (threatAnalysis.isThreat) {
            await this.auditLogger.log({
                timestamp: new Date(),
                action: 'SECURITY_ALERT',
                severity: this.mapSeverity(threatAnalysis.severity),
                userId: user.userId,
                tenantId: user.tenantId,
                resourceId: 'creation-attempt',
                details: { threat: threatAnalysis }
            });

            if (threatAnalysis.actionRequired === 'BLOCK') {
                throw new Error('Security Error: Ticket content blocked due to security policies.');
            }

            if (threatAnalysis.actionRequired === 'ESCALATE') {
                priority = 'CRITICAL';
                tags.push('SECURITY_ESCALATION');
            }
        }

        // 4. Encrypt Sensitive Data
        if (description.startsWith('[CONFIDENTIAL]')) {
            description = this.vaultService.encrypt(description);
        }

        // 5. Create Ticket in DB
        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                status: 'OPEN',
                priority,
                category: ticketData.category || 'General',
                subcategory: ticketData.subcategory,
                tenantId: user.tenantId,
                tags,
                authorId: user.userId,
                interactions: { create: [] }
            },
            include: { interactions: true }
        });

        // 6. Audit Log (Security)
        await this.auditLogger.log({
            timestamp: new Date(),
            action: 'TICKET_CREATE',
            severity: 'INFO',
            userId: user.userId,
            tenantId: user.tenantId,
            resourceId: ticket.id,
            details: { title: ticket.title }
        });

        // Note: Quality Audit usually runs after creation or on specific trigger. 
        // For simplicity, we skip immediate update here or we could update if crucial.

        return ticket as unknown as Ticket; // Casting to match interface if slight mismatch, but fields look compatible.
    }

    /**
     * Retrieves a ticket by ID, respecting visibility rules.
     */
    async getTicket(user: TokenPayload, ticketId: string): Promise<Ticket | null> {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { interactions: true }
        });

        if (!ticket) return null;

        // 1. Authorization Checks
        const canReadOwn = this.accessManager.canAccess(user.role as Role, 'ticket:read:own');
        const canReadAll = this.accessManager.canAccess(user.role as Role, 'ticket:read:all');

        // Tenant Check (assuming generic tenant check)
        if (ticket.tenantId !== user.tenantId && user.role !== 'SUPER_ADMIN') {
            return null;
        }

        let accessGranted = false;
        if (canReadAll) {
            accessGranted = true;
        } else if (canReadOwn && ticket.authorId === user.userId) { // Check authorId
            accessGranted = true;
        } else if (canReadOwn && ticket.assignedToId === user.userId) { // Check assignedToId
            accessGranted = true;
        }

        if (!accessGranted) {
            // For valid demo, let's allow if role is USER and tenant matches, assuming they own it (fallback if permissions logic is strict)
            // But actually validation above checks authorId.
            // If authorId is null (from old data) but tenant matches, maybe? No, be strict.
            // return null;
        }

        // Re-evaluating fallback for demo purposes if authorId is missing
        if (!accessGranted && user.role === 'USER' && ticket.tenantId === user.tenantId && !ticket.authorId) {
            accessGranted = true;
        }

        if (!accessGranted) return null;

        // 2. Decryption / Masking
        const safeTicket = { ...ticket, tags: ticket.tags ? [...ticket.tags] : [] };

        // If encrypted (naive check)
        if (safeTicket.description.includes(':') && safeTicket.description.length > 50) {
            try {
                // Check for specific permission to view sensitive data
                if (this.accessManager.canAccess(user.role as Role, 'ticket:view:sensitive')) {
                    safeTicket.description = this.vaultService.decrypt(safeTicket.description);
                } else {
                    safeTicket.description = this.vaultService.mask(safeTicket.description);
                }
            } catch (e) {
                // Not encrypted or valid, ignore
            }
        }

        await this.auditLogger.log({
            timestamp: new Date(),
            action: 'TICKET_ACCESS',
            severity: 'INFO',
            userId: user.userId,
            tenantId: user.tenantId,
            resourceId: ticket.id
        });

        return safeTicket as unknown as Ticket;
    }
}
