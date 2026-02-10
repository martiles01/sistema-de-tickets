export interface TicketInteraction {
    id: string;
    ticketId: string;
    authorId: string;
    content: string;
    type: 'NOTE' | 'REPLY' | 'STATUS_CHANGE';
    createdAt: Date;
}

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: string;
    subcategory?: string;
    tenantId: string;
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    slaTargetDate?: Date;
    interactions: TicketInteraction[];
    satisfactionScore?: number; // 1-5
    tags?: string[];
}
