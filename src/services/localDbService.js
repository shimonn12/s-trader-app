const DB_NAME = 'STraderLocalDB';
const STORE_NAME = 'trade_images';
const DB_VERSION = 1;

/**
 * Local database service using Native IndexedDB for storing large trading screenshots.
 * No external dependencies required.
 */
export const localDbService = {
    /**
     * Initialize the database and returns a promise
     */
    _getDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    /**
     * Save an image locally
     */
    async saveImage(tradeId, imageData) {
        if (!imageData) return;
        try {
            const db = await this._getDb();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(imageData, String(tradeId));

                request.onsuccess = () => {
                    console.log(`💾 Image saved locally: ${tradeId}`);
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ IndexedDB save error:', error);
        }
    },

    /**
     * Retrieve an image locally
     */
    async getImage(tradeId) {
        try {
            const db = await this._getDb();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(String(tradeId));

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ IndexedDB retrieve error:', error);
            return null;
        }
    },

    /**
     * Delete an image locally
     */
    async deleteImage(tradeId) {
        try {
            const db = await this._getDb();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(String(tradeId));

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ IndexedDB delete error:', error);
        }
    },

    /**
     * Load core user data (trades, settings, etc.) from local storage
     */
    async loadUserData(username, journalType) {
        if (!username) return null;
        const uid = username.toLowerCase().trim();
        const localKey = `s_trader:${uid}:${journalType}:data`;

        try {
            const localData = localStorage.getItem(localKey);
            return localData ? JSON.parse(localData) : null;
        } catch (e) {
            console.error(`Error loading local data for ${username}:`, e);
            return null;
        }
    },

    /**
     * Save core user data (trades, settings, etc.) to local storage
     */
    async saveUserData(username, journalType, data) {
        if (!username) return;
        const uid = username.toLowerCase().trim();
        const localKey = `s_trader:${uid}:${journalType}:data`;

        try {
            localStorage.setItem(localKey, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving local data for ${username}:`, e);
        }
    }
};
