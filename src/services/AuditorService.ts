import { Ticket } from '../models/Ticket';
import { RulesEngine } from '../engines/RulesEngine';
import { AuditResult } from '../models/AuditResult';

export class AuditorService {
    private rulesEngine: RulesEngine;

    constructor() {
        this.rulesEngine = new RulesEngine();
    }

    public auditTicket(ticket: Ticket): AuditResult {
        const result = this.rulesEngine.evaluate(ticket);

        if (result.riskLevel === 'HIGH' || result.issues.length > 0) {
            console.log(`[AUDIT ALERT] Ticket ${ticket.id} Issues:`, JSON.stringify(result.issues, null, 2));
            if (result.requiresEscalation) {
                console.log(`[ESCALATION] Ticket ${ticket.id} requires immediate attention.`);
                // TODO: Integration with Escalation Agent
            }
        }

        return result;
    }
}
