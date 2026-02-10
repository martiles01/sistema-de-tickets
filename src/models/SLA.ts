export interface SLAConfig {
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category?: string; // Optional: SLA specific to a category
    responseTimeThreshold: number; // in hours
    resolutionTimeThreshold: number; // in hours
    escalationThreshold: number; // percentage of time passed before escalation (e.g. 0.8 for 80%)    
}

export const DefaultSLAs: SLAConfig[] = [
    { priority: 'CRITICAL', responseTimeThreshold: 1, resolutionTimeThreshold: 4, escalationThreshold: 0.8 },
    { priority: 'HIGH', responseTimeThreshold: 4, resolutionTimeThreshold: 24, escalationThreshold: 0.8 },
    { priority: 'MEDIUM', responseTimeThreshold: 8, resolutionTimeThreshold: 48, escalationThreshold: 0.9 },
    { priority: 'LOW', responseTimeThreshold: 24, resolutionTimeThreshold: 72, escalationThreshold: 0.9 }
];
