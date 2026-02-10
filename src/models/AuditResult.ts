export interface AuditIssue {
    type: 'SLA_BREACH' | 'POOR_CATEGORIZATION' | 'LOW_QUALITY_RESPONSE' | 'ESCALATION_REQUIRED' | 'RISK_DETECTED';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    recommendation?: string;
}

export interface AuditResult {
    ticketId: string;
    auditedAt: Date;
    slaCompliance: {
        metResponseTime: boolean;
        metResolutionTime: boolean;
        timeToResponse?: number; // hours
        timeToResolution?: number; // hours
    };
    qualityScore: 'HIGH' | 'MEDIUM' | 'LOW';
    correctlyCategorized: boolean;
    issues: AuditIssue[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    requiresEscalation: boolean;
}
