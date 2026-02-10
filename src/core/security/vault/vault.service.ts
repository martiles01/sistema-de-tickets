import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.VAULT_SECRET; // Must be 64 hex characters (32 bytes)
const VISIBLE_CHARS = 4;

export class VaultService {
    private key: Buffer;

    constructor() {
        if (SECRET_KEY && SECRET_KEY.length === 64) {
            this.key = Buffer.from(SECRET_KEY, 'hex');
        } else {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('CRITICAL: VAULT_SECRET must be set and be 64 hex characters in production.');
            }
            console.warn('[SECURITY WARNING] VAULT_SECRET not set or invalid. Using ephemeral random key for development.');
            this.key = crypto.randomBytes(32);
        }
    }

    /**
     * Encrypts a string using AES-256-GCM.
     * Returns format: iv:encrypted:authTag
     */
    encrypt(text: string): string {
        if (!text) return '';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${encrypted}:${authTag}`;
    }

    /**
     * Decrypts a string. Throws error if integrity check fails.
     */
    decrypt(text: string): string {
        if (!text) return '';
        const [ivHex, encryptedHex, authTagHex] = text.split(':');
        if (!ivHex || !encryptedHex || !authTagHex) {
            throw new Error('Security Error: Invalid encrypted data format');
        }

        try {
            const decipher = crypto.createDecipheriv(ALGORITHM, this.key, Buffer.from(ivHex, 'hex'));
            decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            throw new Error('Security Error: Decryption failed (integrity check)');
        }
    }

    /**
     * Mask sensitive data, showing only the first few characters.
     */
    mask(text: string): string {
        if (!text) return '';
        if (text.length <= VISIBLE_CHARS) return '*'.repeat(text.length);
        return text.substring(0, VISIBLE_CHARS) + '*'.repeat(text.length - VISIBLE_CHARS);
    }
}
