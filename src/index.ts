import express from 'express';
import { securityMiddleware } from './middleware/security.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(securityMiddleware);

// Initialize Services
import { AuditorService } from './services/AuditorService';
const auditorService = new AuditorService();
console.log('Auditor Service Initialized');

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

import path from 'path';

// Serve static frontend
const staticPath = path.join(__dirname, '../public');
console.log(`Serving static files from: ${staticPath}`);
app.use(express.static(staticPath));

// JSON API endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Helpdesk Security Agent API is running.',
        endpoints: {
            health: '/health',
            docs: 'See implementation_plan.md'
        },
        security: 'Active'
    });
});

// Fallback for 404
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 Not Found</h1>
        <p>Could not find resource at ${req.originalUrl}</p>
        <p>Static Path: ${staticPath}</p>
        <p>Try <a href="/health">/health</a> or <a href="/api">/api</a></p>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
