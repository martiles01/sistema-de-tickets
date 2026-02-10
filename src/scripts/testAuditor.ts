import { AuditorService } from '../services/AuditorService';
import { Ticket } from '../models/Ticket';

const auditor = new AuditorService();

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000); // Breach for HIGH
const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

const mockTickets: Ticket[] = [
    {
        id: 'TICKET-001',
        title: 'Laptop screen broken',
        description: 'My laptop screen is cracked and I cannot see anything. Please help.',
        status: 'OPEN',
        priority: 'HIGH', // SLA Limit 4h
        category: 'Hardware',
        createdAt: fiveHoursAgo, // Should breach SLA
        updatedAt: fiveHoursAgo,
        tenantId: 'TENANT-1',
        interactions: []
    },
    {
        id: 'TICKET-002',
        title: 'Wifi slow',
        description: 'Wifi is slow', // Low quality description
        status: 'OPEN',
        priority: 'MEDIUM',
        category: 'Network',
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo,
        tenantId: 'TENANT-1',
        interactions: []
    },
    {
        id: 'TICKET-003',
        title: 'System Server Down',
        description: 'Critical production server is down. Users cannot login.',
        status: 'OPEN',
        priority: 'CRITICAL', // SLA Limit 1h
        category: 'Infrasctructure',
        createdAt: new Date(now.getTime() - 50 * 60 * 1000), // 50 mins ago. Limit 60 mins. Threshold 80% = 48 mins. Should warn/escalate.
        updatedAt: oneHourAgo,
        tenantId: 'TENANT-1',
        interactions: []
    }
];

console.log('--- STARTING AUDIT TEST ---');

mockTickets.forEach(ticket => {
    console.log(`\nAuditing Ticket: ${ticket.id}`);
    const result = auditor.auditTicket(ticket);
    console.log('Result:', JSON.stringify(result, null, 2));
});

console.log('\n--- TEST COMPLETE ---');
