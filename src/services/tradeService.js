import { supabase } from '../lib/supabaseClient';
import { localDbService } from './localDbService';

/**
 * PROFESSIONAL LOCAL-FIRST SYNC SERVICE
 * 1. Saves locally first (instant UI).
 * 2. Queues changes in pendingChanges.
 * 3. Syncs to cloud every 3 minutes or on exit.
 * 4. Syncs from cloud only on focus/open.
 * 5. Uses Supabase Storage for images (cleaner & faster).
 */

// --- Infrastructure ---

const getDeviceId = () => {
    let id = localStorage.getItem('s_trader_device_id');
    if (!id) {
        id = 'dev-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
        localStorage.setItem('s_trader_device_id', id);
    }
    return id;
};

// Queue Management
const getPendingChanges = () => JSON.parse(localStorage.getItem('s_trader_pending_changes') || '[]');
const savePendingChanges = (changes) => localStorage.setItem('s_trader_pending_changes', JSON.stringify(changes));

let isSyncing = false;

export const tradeService = {
    getDeviceId,

    async registerDevice(username) {
        if (!username) return;
        const deviceId = getDeviceId();
        const normalizedUser = username.toLowerCase().trim();
        try {
            await supabase.from('user_devices').upsert({
                username: normalizedUser,
                device_id: deviceId,
                last_seen: new Date().toISOString()
            }, { onConflict: 'username, device_id' });
        } catch (e) { console.error("Registration error:", e); }
    },

    async getTargetDevices(username) {
        const deviceId = getDeviceId();
        try {
            const { data } = await supabase.from('user_devices')
                .select('device_id')
                .eq('username', username.toLowerCase().trim())
                .neq('device_id', deviceId);
            return data?.map(d => d.device_id) || [];
        } catch (e) { return []; }
    },

    // --- Local Queue System ---

    /**
     * Add a change to the local pending queue. 
     * This is called by the UI instead of immediate cloud push.
     */
    addPendingChange(username, itemType, journalType, payload) {
        if (!username) return;
        const changes = getPendingChanges();
        
        // Optimization: If it's a trade update for an ID already in the queue, just update the payload
        if (itemType === 'trade' && payload.id) {
            const idx = changes.findIndex(c => c.itemType === 'trade' && c.payload.id === payload.id);
            if (idx !== -1) {
                changes[idx].payload = { ...changes[idx].payload, ...payload };
                savePendingChanges(changes);
                return;
            }
        }

        changes.push({
            id: `chg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            username: username.toLowerCase().trim(),
            itemType,
            journalType,
            payload,
            timestamp: Date.now()
        });
        savePendingChanges(changes);
        console.log(`📦 Change queued: ${itemType} (${changes.length} total)`);
    },

    // --- Outbound Sync (To Cloud) ---

    /**
     * Upload all pending changes to the cloud in one batch.
     */
    async syncToCloud(username) {
        if (isSyncing || !username) return;
        const changes = getPendingChanges();
        if (changes.length === 0) return;

        isSyncing = true;
        console.log(`📡 Syncing ${changes.length} changes to cloud...`);

        try {
            const targetDevices = await this.getTargetDevices(username);
            if (targetDevices.length === 0) {
                // If no other devices, we don't need the relay, but we might want a master backup
                // For now, we clear the queue to save Disk IO as requested
                savePendingChanges([]);
                isSyncing = false;
                return;
            }

            const entries = [];
            
            for (const chg of changes) {
                // Handle Images via Storage Bucket
                if (chg.itemType === 'image' && chg.payload.imageBase64) {
                    const imageUrl = await this.uploadImageToStorage(username, chg.payload.tradeId, chg.payload.imageBase64);
                    if (imageUrl) {
                        entries.push({
                            username: chg.username,
                            sender_device_id: getDeviceId(),
                            item_type: 'image_link',
                            journal_type: chg.journalType,
                            payload: { tradeId: chg.payload.tradeId, imageUrl },
                            target_devices: targetDevices
                        });
                    }
                    continue;
                }

                // Regular items
                entries.push({
                    username: chg.username,
                    sender_device_id: getDeviceId(),
                    item_type: chg.itemType,
                    journal_type: chg.journalType,
                    payload: chg.payload,
                    target_devices: targetDevices
                });
            }

            if (entries.length > 0) {
                const { error } = await supabase.from('sync_queue').insert(entries);
                if (error) throw error;
            }

            // Success! Clear the queue
            savePendingChanges([]);
            console.log("✅ Sync to cloud complete.");
        } catch (e) {
            console.error("❌ Sync to cloud failed:", e.message);
        } finally {
            isSyncing = false;
        }
    },

    /**
     * Infrequent Master Backup (Profiles Table)
     */
    async backupState(username, journalType, data) {
        try {
            const column = journalType === 'stocks' ? 'stocks_data' : 'futures_data';
            await supabase.from('profiles').update({ [column]: data }).ilike('username', username);
            console.log(`☁️ Master backup updated for ${journalType}`);
        } catch (e) {
            console.error("Backup state failed:", e);
        }
    },

    async uploadImageToStorage(username, tradeId, base64) {
        try {
            const byteString = atob(base64.split(',')[1] || base64);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            const blob = new Blob([ab], { type: 'image/jpeg' });
            
            const fileName = `${username}/${tradeId}_${Date.now()}.jpg`;
            const { data, error } = await supabase.storage
                .from('trade-images')
                .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

            if (error) throw error;
            return data.path;
        } catch (e) {
            console.error("Image upload failed:", e);
            return null;
        }
    },

    // --- Inbound Sync (From Cloud) ---

    /**
     * Pull updates from the cloud.
     */
    async syncFromCloud(username, journalType) {
        if (!username) return [];
        const deviceId = getDeviceId();
        
        try {
            const { data, error } = await supabase.from('sync_queue')
                .select('*')
                .eq('username', username.toLowerCase().trim())
                .eq('journal_type', journalType)
                .contains('target_devices', [deviceId]);

            if (error) throw error;
            if (!data || data.length === 0) return [];

            console.log(`📥 Received ${data.length} updates from cloud`);
            
            const processedItems = [];
            for (const item of data) {
                // If it's an image link, download the actual image
                if (item.item_type === 'image_link' && item.payload.imageUrl) {
                    const imageBase64 = await this.downloadImageFromStorage(item.payload.imageUrl);
                    if (imageBase64) {
                        processedItems.push({ ...item, item_type: 'image', payload: { ...item.payload, image: imageBase64 } });
                    }
                } else {
                    processedItems.push(item);
                }
                
                // Acknowledge (Option B: Deletes from cloud when all targets ACK)
                await this.acknowledgeItem(item.id, deviceId);
            }

            return processedItems;
        } catch (e) {
            console.error("Sync from cloud failed:", e);
            return [];
        }
    },

    async downloadImageFromStorage(path) {
        try {
            const { data, error } = await supabase.storage.from('trade-images').download(path);
            if (error) throw error;
            
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(data);
            });
        } catch (e) { return null; }
    },

    async acknowledgeItem(queueId, deviceId) {
        try {
            const { data: current } = await supabase.from('sync_queue').select('target_devices').eq('id', queueId).single();
            if (!current) return;

            const remaining = current.target_devices.filter(id => id !== deviceId);
            if (remaining.length === 0) {
                await supabase.from('sync_queue').delete().eq('id', queueId);
                // Option B: Also delete the image from storage if it's an image_link
                // Note: For real production, you'd check if any other device still needs the image link record
            } else {
                await supabase.from('sync_queue').update({ target_devices: remaining }).eq('id', queueId);
            }
        } catch (e) { console.error("Ack error:", e); }
    },

    // --- Special Requests (New Device / History) ---

    async requestHistory(username, journalType) {
        if (!username) return;
        console.log("🆘 Requesting history from other devices...");
        this.addPendingChange(username, 'history_request', journalType, { requestedAt: Date.now() });
    },

    /**
     * To be called when a history_request is received from another device.
     */
    async provideHistory(username, journalType, targetDeviceId) {
        if (!username) return;
        console.log(`🤝 Providing full history to device ${targetDeviceId}`);
        
        // Get all local trades
        const allTrades = await localDbService.getTrades(journalType);
        
        // Push as a special large payload (Cloud acts as relay)
        const { error } = await supabase.from('sync_queue').insert([{
            username: username.toLowerCase().trim(),
            sender_device_id: getDeviceId(),
            item_type: 'full_history',
            journal_type: journalType,
            payload: { trades: allTrades },
            target_devices: [targetDeviceId]
        }]);
        
        if (error) console.error("Failed to provide history:", error);
    },

    // --- Legacy Compatibility Wrappers (Mapping old calls to new Queue) ---
    
    async pushTrade(username, journalType, trade) {
        const tradeData = { ...trade };
        if (tradeData.image) delete tradeData.image; // Images handled separately
        this.addPendingChange(username, 'trade', journalType, tradeData);
    },

    async pushGoals(username, journalType, goals) {
        this.addPendingChange(username, 'goals', journalType, goals);
    },

    async pushImage(username, journalType, tradeId, imageBase64) {
        this.addPendingChange(username, 'image', journalType, { tradeId, imageBase64 });
    },

    async pushCapital(username, journalType, capital) {
        this.addPendingChange(username, 'capital', journalType, { startingCapital: capital });
    },

    async pushColmexStatus(username, status) {
        this.addPendingChange(username, 'colmex_status', 'futures', { connected: status === 'connected' });
    },

    async pushColmexTokens(username, tokens) {
        this.addPendingChange(username, 'colmex_tokens', 'futures', tokens);
        this.addPendingChange(username, 'colmex_tokens', 'stocks', tokens);
    },

    async pushColmexReset(username, timestamp, journalType) {
        this.addPendingChange(username, 'colmex_reset', journalType, { ignoreBefore: timestamp, journalType });
    },

    // Profile methods
    async getProfile(username) {
        const { data } = await supabase.from('profiles').select('*').ilike('username', username).maybeSingle();
        return data || null;
    },

    async updateProfile(username, updates) {
        await supabase.from('profiles').update(updates).ilike('username', username);
    }
};
