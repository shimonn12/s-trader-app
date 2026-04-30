import { supabase } from '../lib/supabaseClient';

/**
 * Sync Service handles the multi-device relay synchronization.
 * Phase 1: Device Registration & Infrastructure
 */
export const syncService = {
    /**
     * Get or generate a unique ID for this device/browser instance
     */
    getDeviceId() {
        let deviceId = localStorage.getItem('s_trader_device_id');
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
            localStorage.setItem('s_trader_device_id', deviceId);
        }
        return deviceId;
    },

    /**
     * Register this device in the cloud for the specific user
     */
    async registerDevice(username) {
        if (!username) return null;
        const deviceId = this.getDeviceId();
        const uid = username.toLowerCase().trim();

        try {
            const { error } = await supabase
                .from('user_devices')
                .upsert({
                    username: uid,
                    device_id: deviceId,
                    last_seen: new Date().toISOString()
                }, { onConflict: 'username, device_id' });

            if (error) throw error;
            console.log(`📱 Device registered: ${deviceId} for user: ${uid}`);
            return deviceId;
        } catch (error) {
            console.error('❌ Failed to register device:', error.message);
            return null;
        }
    },

    /**
     * Get all other devices registered for this user (excluding current)
     */
    async getOtherDevices(username) {
        const deviceId = this.getDeviceId();
        const uid = username.toLowerCase().trim();

        try {
            const { data, error } = await supabase
                .from('user_devices')
                .select('device_id')
                .eq('username', uid)
                .neq('device_id', deviceId);

            if (error) throw error;
            return data.map(d => d.device_id);
        } catch (error) {
            console.error('❌ Failed to fetch other devices:', error.message);
            return [];
        }
    }
};
