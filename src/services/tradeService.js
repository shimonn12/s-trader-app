import { supabase } from '../lib/supabaseClient';
import { localDbService } from './localDbService';

/**
 * RELAY MODE TRADE SERVICE
 * Cloud acts ONLY as a relay between devices.
 * Data is stored permanently only on the devices themselves.
 */

// Helper to get or create a unique Device ID
const getDeviceId = () => {
    let id = localStorage.getItem('s_trader_device_id');
    if (!id) {
        id = 'dev-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
        localStorage.setItem('s_trader_device_id', id);
    }
    return id;
};

export const tradeService = {
    /**
     * Get the unique ID for this installation
     */
    getDeviceId,

    /**
     * Register this device to the user's account so others know to sync with it
     */
    async registerDevice(username) {
        if (!username) return;
        const deviceId = getDeviceId();
        const normalizedUser = username.toLowerCase().trim();

        try {
            await supabase
                .from('user_devices')
                .upsert({
                    username: normalizedUser,
                    device_id: deviceId,
                    last_seen: new Date().toISOString()
                }, { onConflict: 'username, device_id' });

            console.log("📱 Device registered for relay:", deviceId);
        } catch (e) {
            console.error("Error registering device:", e);
        }
    },

    /**
     * Get all other devices for this user
     */
    async getTargetDevices(username) {
        const deviceId = getDeviceId();
        const normalizedUser = username.toLowerCase().trim();

        try {
            const { data, error } = await supabase
                .from('user_devices')
                .select('device_id')
                .eq('username', normalizedUser)
                .neq('device_id', deviceId); // Only others

            if (error) throw error;
            return data.map(d => d.device_id);
        } catch (e) {
            console.error("Error fetching target devices:", e);
            return [];
        }
    },

    /**
     * Push a trade update to the sync queue for other devices
     */
    async pushTrade(username, journalType, trade) {
        if (!username) return;
        const targetDevices = await this.getTargetDevices(username);
        if (targetDevices.length === 0) return; // No one to sync with

        // For regular trade sync, we strip the image to keep payload small
        // The image will be synced separately via pushImage chunks
        const tradeData = { ...trade };
        if (tradeData.image && tradeData.image.length > 1000) {
            delete tradeData.image;
        }

        console.log(`📡 Pushing trade ${trade.id} to ${targetDevices.length} devices for ${journalType}`);

        const { error } = await supabase
            .from('sync_queue')
            .insert([{
                username: username.toLowerCase().trim(),
                sender_device_id: getDeviceId(),
                item_type: 'trade',
                journal_type: journalType,
                payload: tradeData,
                target_devices: targetDevices
            }]);

        if (error) console.error("Error pushing trade to queue:", error);
    },

    /**
     * Push goals to the sync queue for other devices
     */
    async pushGoals(username, journalType, goals) {
        if (!username) return;
        const targetDevices = await this.getTargetDevices(username);
        if (targetDevices.length === 0) return;

        console.log(`📡 Pushing goals update to ${targetDevices.length} devices for ${journalType}`);

        const { error } = await supabase
            .from('sync_queue')
            .insert([{
                username: username.toLowerCase().trim(),
                sender_device_id: getDeviceId(),
                item_type: 'goals',
                journal_type: journalType,
                payload: goals,
                target_devices: targetDevices
            }]);

        if (error) console.error("Error pushing goals to queue:", error);
    },

    /**
     * Push an image to the sync queue in chunks
     */
    async pushImage(username, journalType, tradeId, imageBase64) {
        if (!username || !imageBase64) return;

        const targetDevices = await this.getTargetDevices(username);
        if (targetDevices.length === 0) return;

        const CHUNK_SIZE = 100 * 1024; // 100KB per chunk
        const totalChunks = Math.ceil(imageBase64.length / CHUNK_SIZE);
        const imageId = 'img-' + Date.now();

        console.log(`🖼️ Syncing image for trade ${tradeId} in ${totalChunks} chunks...`);

        for (let i = 0; i < totalChunks; i++) {
            const chunk = imageBase64.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

            const { error } = await supabase
                .from('sync_queue')
                .insert([{
                    username: username.toLowerCase().trim(),
                    sender_device_id: getDeviceId(),
                    item_type: 'image_chunk',
                    journal_type: journalType,
                    payload: {
                        tradeId,
                        imageId,
                        chunk,
                        index: i,
                        total: totalChunks
                    },
                    target_devices: targetDevices
                }]);

            if (error) {
                console.error(`❌ Error pushing chunk ${i}/${totalChunks}:`, error);
                break;
            }
        }
    },

    /**
     * Push starting capital to the sync queue for other devices
     */
    async pushCapital(username, journalType, capital) {
        if (!username) return;
        const targetDevices = await this.getTargetDevices(username);
        if (targetDevices.length === 0) return;

        console.log(`📡 Pushing capital update to ${targetDevices.length} devices for ${journalType}`);

        const { error } = await supabase
            .from('sync_queue')
            .insert([{
                username: username.toLowerCase().trim(),
                sender_device_id: getDeviceId(),
                item_type: 'capital',
                journal_type: journalType,
                payload: { startingCapital: capital },
                target_devices: targetDevices
            }]);

        if (error) console.error("Error pushing capital to queue:", error);
    },

    /**
     * Push Colmex connection status to the sync queue for other devices
     */
    async pushColmexStatus(username, status) {
        if (!username) return;
        const targetDevices = await this.getTargetDevices(username);
        if (targetDevices.length === 0) return;

        console.log(`📡 Pushing Colmex status (${status}) update to ${targetDevices.length} devices`);

        const { error } = await supabase
            .from('sync_queue')
            .insert([{
                username: username.toLowerCase().trim(),
                sender_device_id: getDeviceId(),
                item_type: 'colmex_status',
                journal_type: 'futures', // Broadcast to both sync listeners if needed
                payload: { connected: status === 'connected' },
                target_devices: targetDevices
            }]);

        if (error) console.error("Error pushing colmex status to queue:", error);
    },

    /**
     * Push active Colmex tokens to all other devices
     */
    async pushColmexTokens(username, tokens) {
        if (!username || !tokens) return;
        const targetDevices = await this.getTargetDevices(username);
        if (targetDevices.length === 0) return;

        console.log(`📡 Pushing fresh Colmex tokens to ${targetDevices.length} devices`);

        // Insert for BOTH journals (stocks and futures) or just broadcast generic
        // To be safe and ensure all apps get it, we could insert twice or handle specially.
        // Let's insert for both to ensure they both see it in their pullItems loops.
        const entries = [
            {
                username: username.toLowerCase().trim(),
                sender_device_id: getDeviceId(),
                item_type: 'colmex_tokens',
                journal_type: 'futures',
                payload: tokens,
                target_devices: targetDevices
            },
            {
                username: username.toLowerCase().trim(),
                sender_device_id: getDeviceId(),
                item_type: 'colmex_tokens',
                journal_type: 'stocks',
                payload: tokens,
                target_devices: targetDevices
            }
        ];

        const { error } = await supabase
            .from('sync_queue')
            .insert(entries);

        if (error) console.error("Error pushing colmex tokens to queue:", error);
    },

    /**
     * Push a Colmex Reset timestamp to all other devices for a specific journal
     */
    async pushColmexReset(username, timestamp, journalType) {
        if (!username || !timestamp || !journalType) return;
        const targetDevices = await this.getTargetDevices(username);
        if (targetDevices.length === 0) return;

        console.log(`📡 Pushing Colmex Reset timestamp to ${targetDevices.length} devices for ${journalType}`);

        const entries = [
            {
                username: username.toLowerCase().trim(),
                sender_device_id: getDeviceId(),
                item_type: 'colmex_reset',
                journal_type: journalType,
                payload: { ignoreBefore: timestamp, journalType },
                target_devices: targetDevices
            }
        ];

        const { error } = await supabase
            .from('sync_queue')
            .insert(entries);

        if (error) console.error("Error pushing colmex reset to queue:", error);
    },

    /**
     * Pull items from the sync queue that are pending for THIS device
     */
    async pullItems(username, journalType) {
        if (!username) return [];
        const deviceId = getDeviceId();
        const normalizedUser = username.toLowerCase().trim();

        try {
            const { data, error } = await supabase
                .from('sync_queue')
                .select('*')
                .eq('username', normalizedUser)
                .eq('journal_type', journalType)
                .contains('target_devices', [deviceId]);

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error("Error pulling sync items:", e);
            return [];
        }
    },

    /**
     * Acknowledge that an item was received and saved
     * Uses a direct update to filter the array locally before saving
     */
    async acknowledgeItem(queueId, deviceId) {
        try {
            // First, get the current record
            const { data: current } = await supabase
                .from('sync_queue')
                .select('target_devices')
                .eq('id', queueId)
                .single();

            if (!current) return;

            const remaining = current.target_devices.filter(id => id !== deviceId);

            if (remaining.length === 0) {
                // If no more devices need this, delete the record
                await supabase
                    .from('sync_queue')
                    .delete()
                    .eq('id', queueId);
            } else {
                // Otherwise update the record with the remaining devices
                await supabase
                    .from('sync_queue')
                    .update({ target_devices: remaining })
                    .eq('id', queueId);
            }
        } catch (e) {
            console.error("Error acknowledging item:", e);
        }
    },

    async getProfile(username) {
        const normalizedUser = username.toLowerCase().trim();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', normalizedUser)
            .maybeSingle();
        return data || null;
    },

    async updateProfile(username, updates) {
        const normalizedUser = username.toLowerCase().trim();
        await supabase
            .from('profiles')
            .update(updates)
            .ilike('username', normalizedUser);
    }
};
