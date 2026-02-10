import { Ticket } from '../models/Ticket';
import { AuditResult, AuditIssue } from '../models/AuditResult';
import { DefaultSLAs, SLAConfig } from '../models/SLA';

export class RulesEngine {
    private slas: SLAConfig[] = DefaultSLAs;

    public evaluate(ticket: Ticket): AuditResult {
        const issues: AuditIssue[] = [];
        const slaCompliance = this.checkSLA(ticket, issues);
        const qualityScore = this.evaluateQuality(ticket, issues);
        const correctlyCategorized = this.checkCategorization(ticket, issues);
        const requiresEscalation = this.checkEscalation(ticket, slaCompliance, issues);

        // Determine Risk Level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (issues.some(i => i.severity === 'CRITICAL')) riskLevel = 'HIGH';
        else if (issues.some(i => i.severity === 'HIGH')) riskLevel = 'MEDIUM';

        return {
            ticketId: ticket.id,
            auditedAt: new Date(),
            slaCompliance: slaCompliance,
            qualityScore,
            correctlyCategorized,
            issues,
            riskLevel,
            requiresEscalation
        };
    }

    private getSLA(priority: string): SLAConfig | undefined {
        return this.slas.find(s => s.priority === priority);
    }

    private checkSLA(ticket: Ticket, issues: AuditIssue[]) {
        const sla = this.getSLA(ticket.priority);
        if (!sla) return { metResponseTime: true, metResolutionTime: true };

        const now = new Date();
        const created = new Date(ticket.createdAt);
        const hoursAge = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

        // Check Resolution Time
        let metResolutionTime = true;
        if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
            if (hoursAge > sla.resolutionTimeThreshold) {
                metResolutionTime = false;
                issues.push({
                    type: 'SLA_BREACH',
                    severity: 'HIGH',
                    description: `Ticket open for ${hoursAge.toFixed(1)}h (Limit: ${sla.resolutionTimeThreshold}h)`,
                    recommendation: 'Immediate resolution required.'
                });
            }
        }

        // Response time check would need first interaction time, for now assuming if not closed it's pending
        // This is a simplification. Real implementation needs interaction logs.

        return {
            metResponseTime: true, // Placeholder
            metResolutionTime,
            timeToResolution: hoursAge
        };
    }

    private evaluateQuality(ticket: Ticket, issues: AuditIssue[]): 'HIGH' | 'MEDIUM' | 'LOW' {
        let score = 100;

        if (ticket.description.length < 20) {
            score -= 30;
            issues.push({
                type: 'LOW_QUALITY_RESPONSE',
                severity: 'LOW',
                description: 'Description is too short.',
                recommendation: 'Request more details from user.'
            });
        }

        if (!ticket.interactions || ticket.interactions.length === 0) {
            // If ticket is old and no interaction
            const hoursAge = (new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursAge > 2) {
                score -= 20;
                issues.push({
                    type: 'LOW_QUALITY_RESPONSE',
                    severity: 'MEDIUM',
                    description: 'No interactions on ticket for > 2 hours.',
                    recommendation: 'Engage with the user.'
                });
            }
        }

        if (score > 80) return 'HIGH';
        if (score > 50) return 'MEDIUM';
        return 'LOW';
    }

    private checkCategorization(ticket: Ticket, issues: AuditIssue[]): boolean {
        // Mock Logic: Check if category matches content keywords
        const content = (ticket.title + " " + ticket.description).toLowerCase();

        // Example rule: 'network' category should have 'wifi', 'internet', 'connection'
        if (ticket.category.toLowerCase() === 'hardware' && !content.includes('laptop') && !content.includes('mouse') && !content.includes('screen')) {
            issues.push({
                type: 'POOR_CATEGORIZATION',
                severity: 'LOW',
                description: 'Ticket might be miscategorized. Content does not match hardware keywords.',
                recommendation: 'Review category.'
            });
            return false;
        }
        return true;
    }

    private checkEscalation(ticket: Ticket, slaCompliance: any, issues: AuditIssue[]): boolean {
        const sla = this.getSLA(ticket.priority);
        if (!sla) return false;

        const hoursAge = (new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);

        // 80% SLA Rule
        if (hoursAge > sla.resolutionTimeThreshold * sla.escalationThreshold && ticket.priority === 'CRITICAL' && ticket.status !== 'RESOLVED') {
            issues.push({
                type: 'ESCALATION_REQUIRED',
                severity: 'CRITICAL',
                description: `Critical ticket at ${(hoursAge / sla.resolutionTimeThreshold * 100).toFixed(0)}% of SLA.`,
                recommendation: 'Escalate to manager immediately.'
            });
            return true;
        }

        return false;
    }
}
