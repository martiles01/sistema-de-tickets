import { AuthService } from '../core/security/auth/auth.service';
import { AccessManager } from '../core/security/access/access.manager';
import { VaultService } from '../core/security/vault/vault.service';
import { EscalationSecurityEngine } from '../core/security/escalation/escalation.engine';
import { Ticket } from '../models/Ticket';

async function verifySecurity() {
    console.log('--- STARTING SECURITY VERIFICATION ---\n');

    // 1. Verify Auth
    console.log('1. Testing AuthService...');
    const authService = new AuthService();
    const payload = { userId: 'user123', role: 'TECHNICIAN', tenantId: 'tenant1', extra: 'data' };
    const token = authService.generateToken(payload);
    console.log(`Generated Token: ${token.substring(0, 20)}...`);
    const valid = await authService.validateToken(token);
    if (valid && valid.userId === 'user123') console.log('✅ Auth Token Validated');
    else console.error('❌ Auth Validation Failed');

    // 2. Verify Access Control
    console.log('\n2. Testing AccessManager...');
    const accessManager = new AccessManager();
    const canResolve = accessManager.canAccess('TECHNICIAN', 'ticket:resolve');
    const canDelete = accessManager.canAccess('TECHNICIAN', 'ticket:delete');
    if (canResolve) console.log('✅ TECHNICIAN can resolve ticket');
    else console.error('❌ TECHNICIAN failed to resolve ticket');
    if (!canDelete) console.log('✅ TECHNICIAN cannot delete ticket');
    else console.error('❌ TECHNICIAN incorrectly allowed to delete ticket');

    // 3. Verify Vault
    console.log('\n3. Testing VaultService...');
    const vault = new VaultService();
    const sensitive = 'super-secret-password';
    const encrypted = vault.encrypt(sensitive);
    console.log(`Encrypted: ${encrypted}`);
    const decrypted = vault.decrypt(encrypted);
    if (decrypted === sensitive) console.log('✅ Encryption/Decryption successful');
    else console.error('❌ Decryption failed');
    console.log(`Masked: ${vault.mask(sensitive)}`);

    // 4. Verify Escalation
    console.log('\n4. Testing EscalationEngine...');
    const engine = new EscalationSecurityEngine();
    const safeTicket = { title: 'Printer broken', description: 'Paper jam', interactions: [] } as unknown as Ticket;
    const unsafeTicket = {
        title: 'System Access',
        description: 'I found a SQL Injection vulnerability in login',
        interactions: []
    } as unknown as Ticket;

    const safeResult = engine.analyze(safeTicket);
    const unsafeResult = engine.analyze(unsafeTicket);

    if (!safeResult.isThreat) console.log('✅ Safe ticket passed');
    else console.error('❌ Safe ticket flagged false positive');

    if (unsafeResult.isThreat && unsafeResult.severity === 'CRITICAL') console.log('✅ Threat detected correctly (SQL Injection -> CRITICAL)');
    else console.error(`❌ Threat detection failed or wrong severity: ${JSON.stringify(unsafeResult)}`);

    console.log('\n--- VERIFICATION COMPLETE ---');
}

verifySecurity().catch(console.error);
