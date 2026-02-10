import { Ticket } from '../../../models/Ticket';

export interface SecurityThreatAnalysis {
    isThreat: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    detectedKeywords: string[];
    actionRequired: 'NONE' | 'FLAG' | 'ESCALATE' | 'BLOCK';
}

const SECURITY_PATTERNS = [
    { pattern: /sql\s*injection/i, severity: 'CRITICAL' },
    { pattern: /xss/i, severity: 'CRITICAL' },
    { pattern: /<script>/i, severity: 'CRITICAL' },
    { pattern: /breach/i, severity: 'HIGH' },
    { pattern: /vulnerability/i, severity: 'HIGH' },
    { pattern: /exploit/i, severity: 'HIGH' },
    { pattern: /ddos/i, severity: 'HIGH' },
    { pattern: /password/i, severity: 'MEDIUM' },
    { pattern: /credential/i, severity: 'MEDIUM' }
];

export class EscalationSecurityEngine {
    /**
     * Analyzes a ticket for potential security threats based on content patterns.
     */
    analyze(ticket: Ticket): SecurityThreatAnalysis {
        const content = `${ticket.title} ${ticket.description} ${ticket.interactions.map(i => i.content).join(' ')}`.toLowerCase();

        const detectedKeywords: string[] = [];
        let maxSeverity: SecurityThreatAnalysis['severity'] = 'LOW';

        for (const rule of SECURITY_PATTERNS) {
            if (rule.pattern.test(content)) {
                detectedKeywords.push(rule.pattern.source);
                if (this.isSeverityHigher(rule.severity as any, maxSeverity)) {
                    maxSeverity = rule.severity as any;
                }
            }
        }

        const isThreat = detectedKeywords.length > 0;
        let actionRequired: SecurityThreatAnalysis['actionRequired'] = 'NONE';

        if (isThreat) {
            if (maxSeverity === 'CRITICAL') actionRequired = 'ESCALATE';
            else if (maxSeverity === 'HIGH') actionRequired = 'ESCALATE';
            else actionRequired = 'FLAG';
        }

        return {
            isThreat,
            severity: isThreat ? maxSeverity : 'LOW',
            detectedKeywords,
            actionRequired
        };
    }

    private isSeverityHigher(current: string, baseline: string): boolean {
        const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        return levels.indexOf(current) > levels.indexOf(baseline);
    }
}
