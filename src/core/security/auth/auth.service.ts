import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../../database/prisma';
import { User } from '@prisma/client';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-dev';

export interface TokenPayload {
    userId: string;
    role: string;
    tenantId: string;
    [key: string]: any;
}

export class AuthService {
    constructor() {
        if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
            console.error('[SECURITY CRITICAL] JWT_SECRET is not set in production environment.');
        }
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    }

    async createUser(data: any): Promise<User> {
        data.password = await this.hashPassword(data.password);
        return prisma.user.create({ data });
    }

    /**
     * Validates and decodes a JWT token.
     */
    async validateToken(token: string): Promise<TokenPayload | null> {
        try {
            return jwt.verify(token, SECRET_KEY) as TokenPayload;
        } catch (error) {
            // Log token validation failure if needed
            return null;
        }
    }

    /**
     * Generates a new JWT token.
     */
    generateToken(payload: TokenPayload): string {
        return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
    }

    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
