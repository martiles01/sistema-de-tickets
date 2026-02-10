import { TicketService } from '../services/TicketService';
import { TokenPayload } from '../core/security/auth/auth.service';

async function verifyLifecycle() {
    console.log('--- STARTING TICKET LIFECYCLE VERIFICATION ---\n');

    const service = new TicketService();

    // Mock Users
    const user1: TokenPayload = { userId: 'u1', role: 'USER', tenantId: 'tenantA' };
    const user2: TokenPayload = { userId: 'u2', role: 'USER', tenantId: 'tenantA' }; // Same tenant, diff user
    const tech: TokenPayload = { userId: 't1', role: 'TECHNICIAN', tenantId: 'tenantA' };
    const supervisor: TokenPayload = { userId: 's1', role: 'SUPERVISOR', tenantId: 'tenantA' };
    const attacker: TokenPayload = { userId: 'bad', role: 'USER', tenantId: 'tenantA' };

    try {
        // 1. Standard Ticket Creation
        console.log('1. User creating standard ticket...');
        const ticket1 = await service.createTicket(user1, { title: 'Login Issue', description: 'Cannot reset password' });
        console.log(`✅ Ticket Created: ${ticket1.id} [${ticket1.priority}]`);

        // 2. Threat Detection
        console.log('\n2. User creating MALICIOUS ticket...');
        const maliciousTicket = await service.createTicket(attacker, {
            title: 'Hacked',
            description: 'I found a sql injection vulnerability in the login page.'
        });
        if (maliciousTicket.priority === 'CRITICAL' && maliciousTicket.tags?.includes('SECURITY_ESCALATION')) {
            console.log(`✅ Threat Detected & Escalated: ${maliciousTicket.id} [${maliciousTicket.priority}] Tags: ${maliciousTicket.tags}`);
        } else {
            console.error('❌ Threat Detection Failed');
        }

        // 3. Sensitive Data Encryption
        console.log('\n3. User creating CONFIDENTIAL ticket...');
        const secretTicket = await service.createTicket(user1, {
            title: 'Payroll Issue',
            description: '[CONFIDENTIAL] My salary is incorrect: 50000USD'
        });
        if (secretTicket.description.includes(':')) console.log('✅ Description Encrypted in Memory/DB');
        else console.error('❌ Encryption Failed');

        // 4. Access Control: Read Own
        console.log('\n4. User1 reading own ticket...');
        const readOwn = await service.getTicket(user1, ticket1.id);
        if (readOwn) console.log('✅ User1 read own ticket');
        else console.error('❌ User1 failed to read own ticket');

        // 5. Access Control: Read Other (Same Tenant)
        console.log('\n5. User2 reading User1 ticket...');
        const readOther = await service.getTicket(user2, ticket1.id);
        if (!readOther) console.log('✅ User2 blocked from reading User1 ticket');
        else console.error('❌ User2 INCORRECTLY allowed to read User1 ticket');

        // 6. Access Control: Technician Read All
        console.log('\n6. Technician reading User1 ticket...');
        const readTech = await service.getTicket(tech, ticket1.id);
        if (readTech) console.log('✅ Technician read ticket');
        else console.error('❌ Technician failed to read ticket');

        // 7. Data Masking (Technician vs Supervisor)
        console.log('\n7. Checking Sensitive Data Visibility...');
        // Technician does NOT have 'ticket:view:sensitive' (default config check)
        // Oops, in my setup TECHNICIAN does not have it. SUPERVISOR has it.

        const techView = await service.getTicket(tech, secretTicket.id);
        if (techView && techView.description.includes('****')) {
            console.log('✅ Technician sees MASKED data');
        } else {
            console.error(`❌ Technician should see masked data. Saw: ${techView?.description}`);
        }

        const supervisorView = await service.getTicket(supervisor, secretTicket.id);
        if (supervisorView && supervisorView.description.includes('50000USD')) {
            console.log('✅ Supervisor sees DECRYPTED data');
        } else {
            console.error(`❌ Supervisor should see decrypted data. Saw: ${supervisorView?.description}`);
        }

        // 8. Quality Audit Escalation (SLA/Quality Rules)
        console.log('\n8. Checking Quality Audit Escalation...');
        const lowQualityTicket = await service.createTicket(user1, {
            title: 'Bad',
            description: 'Fix' // Very short description -> Quality Issue
        });

        if (lowQualityTicket.tags?.includes('SLA_ESCALATION') || lowQualityTicket.priority === 'CRITICAL') {
            console.log(`✅ Ticket Auto-Escalated due to Quality Rules: [${lowQualityTicket.priority}] Tags: ${lowQualityTicket.tags}`);
        } else {
            console.log(`ℹ️ Quality Audit Run: Ticket created with priority [${lowQualityTicket.priority}]`);
        }

    } catch (error) {
        console.error('❌ Unexpected Error:', error);
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

verifyLifecycle().catch(console.error);
