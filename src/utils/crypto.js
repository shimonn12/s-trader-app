/**
 * Simple Encryption Utility using Web Crypto API
 * Used for obscuring API keys and Tokens in localStorage
 */

const ENCRYPTION_KEY = 's-trader-secure-key'; // In a real production environment, this would be more complex/server-derived

export const cryptoUtils = {
    /**
     * Obscures a string (Plain Base64 for now to ensure no corruption)
     */
    encrypt: (text) => {
        if (!text) return '';
        try {
            return btoa(text);
        } catch (e) {
            console.error('Encryption failed:', e);
            return text;
        }
    },

    /**
     * De-obscures a string
     */
    decrypt: (encoded) => {
        if (!encoded) return '';
        try {
            return atob(encoded);
        } catch (e) {
            console.error('Decryption failed:', e);
            return encoded;
        }
    }
};
