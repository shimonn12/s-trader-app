import { supabase } from '../lib/supabaseClient';
import { cryptoUtils } from '../utils/crypto';
import { tradeService } from './tradeService';

const COLMEX_CONFIG = {
    clientId: 'colmex_uat3',
    redirectUri: 'https://oauth.pstmn.io/v1/callback',
    authUrl: 'https://clientapi-uat.cglms.com/traderevolution/v1/oauth/authorize',
    edgeFunctionUrl: 'https://dvejurtzpchvsutfeciw.supabase.co/functions/v1/colmex-integration',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZWp1cnR6cGNodnN1dGZlY2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjQ3NDAsImV4cCI6MjA4ODc0MDc0MH0.0_zmFqJJ6yVg45VnPlZoB07zCRgO-wwNsWMD_Cf0kTk'
};

export const colmexService = {
    // --- Step 2: Activity Logging System ---
    addLog: (message, type = 'info') => {
        const logs = JSON.parse(localStorage.getItem('colmex_activity_logs') || '[]');
        const newLog = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            message,
            type // info, success, error
        };
        const updatedLogs = [newLog, ...logs].slice(0, 50); // Keep last 50 logs
        localStorage.setItem('colmex_activity_logs', JSON.stringify(updatedLogs));
        window.dispatchEvent(new Event('colmex_logs_updated'));
    },

    getLogs: () => {
        return JSON.parse(localStorage.getItem('colmex_activity_logs') || '[]');
    },

    // --- Step 1 & 3: Token Management with Encryption & Refresh ---
    getToken: () => {
        const encrypted = localStorage.getItem('colmex_access_token');
        return encrypted ? cryptoUtils.decrypt(encrypted) : null;
    },

    getRefreshToken: () => {
        const encrypted = localStorage.getItem('colmex_refresh_token');
        return encrypted ? cryptoUtils.decrypt(encrypted) : null;
    },

    saveTokens: async function (data, username = null) {
        if (data.access_token) {
            localStorage.setItem('colmex_access_token', cryptoUtils.encrypt(data.access_token));
        }
        if (data.refresh_token) {
            localStorage.setItem('colmex_refresh_token', cryptoUtils.encrypt(data.refresh_token));
        }

        // If username is provided, sync to Cloud (Supabase)
        if (username) {
            try {
                const colmexData = {
                    access_token: data.access_token ? cryptoUtils.encrypt(data.access_token) : localStorage.getItem('colmex_access_token'),
                    refresh_token: data.refresh_token ? cryptoUtils.encrypt(data.refresh_token) : localStorage.getItem('colmex_refresh_token'),
                    connected: true,
                    lastSync: new Date().toISOString()
                };

                // We use profile metadata for global app state
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('metadata')
                    .ilike('username', username.trim().toLowerCase())
                    .maybeSingle();

                const updatedMetadata = {
                    ...(profile?.metadata || {}),
                    colmex_connection: colmexData
                };

                await supabase
                    .from('profiles')
                    .update({ metadata: updatedMetadata })
                    .eq('username', username);

                // Notify other devices via relay
                tradeService.pushColmexTokens(username, colmexData);

                this.addLog('פרטי החיבור נשמרו בענן.', 'info');
            } catch (e) {
                console.error('Failed to sync Colmex tokens to cloud:', e);
            }
        }

        window.dispatchEvent(new Event('storage'));
    },

    syncWithCloud: async function (username) {
        if (!username) return false;
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('metadata')
                .ilike('username', username.trim().toLowerCase())
                .maybeSingle();

            const colmexData = profile?.metadata?.colmex_connection;
            if (colmexData && colmexData.access_token) {
                // Only load if local is empty or older
                localStorage.setItem('colmex_access_token', colmexData.access_token);
                if (colmexData.refresh_token) {
                    localStorage.setItem('colmex_refresh_token', colmexData.refresh_token);
                }
                this.addLog('חיבור קולמקס שוחזר מהענן.', 'success');
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new CustomEvent('colmex_connection_changed', { detail: { connected: true } }));
                return true;
            }
        } catch (e) {
            console.error('Failed to pull Colmex tokens from cloud:', e);
        }
        return false;
    },

    refreshToken: async function (username = null) {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) throw new Error('No refresh token available');

            this.addLog('מנסה לחדש חיבור פג תוקף...', 'info');
            const { data: { session } } = await supabase.auth.getSession();
            const supabaseToken = session?.access_token;

            const response = await fetch(`${COLMEX_CONFIG.edgeFunctionUrl}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': COLMEX_CONFIG.supabaseKey,
                    'Authorization': supabaseToken ? `Bearer ${supabaseToken}` : ''
                },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) throw new Error('Refresh failed');

            const data = await response.json();
            await this.saveTokens(data, username);
            this.addLog('החיבור חודש בהצלחה!', 'success');
            return data.access_token;
        } catch (error) {
            this.addLog('כשל בחידוש החיבור. נדרשת התחברות מחדש.', 'error');
            this.logout(username);
            return null;
        }
    },

    initiateLogin: () => {
        const state = Math.random().toString(36).substring(7);
        localStorage.setItem('colmex_auth_state', state);

        const authUrl = `${COLMEX_CONFIG.authUrl}?client_id=${COLMEX_CONFIG.clientId}&redirect_uri=${encodeURIComponent(COLMEX_CONFIG.redirectUri)}&response_type=code&state=${state}`;
        colmexService.addLog('מתחיל תהליך התחברות (OAuth)...', 'info');

        const width = 800, height = 900;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        window.open(authUrl, 'ColmexAuth', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
    },

    exchangeCodeForToken: async function (code, redirectUri = null, username = null) {
        try {
            const targetRedirectUri = redirectUri || COLMEX_CONFIG.redirectUri;
            const { data: { session } } = await supabase.auth.getSession();
            const supabaseToken = session?.access_token;

            this.addLog('מייצר מפתחות גישה מאובטחים...', 'info');
            const response = await fetch(`${COLMEX_CONFIG.edgeFunctionUrl}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': COLMEX_CONFIG.supabaseKey,
                    'Authorization': supabaseToken ? `Bearer ${supabaseToken}` : ''
                },
                body: JSON.stringify({ code: code, redirectUri: targetRedirectUri })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error_description || errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            this.saveTokens(data, username);
            window.dispatchEvent(new CustomEvent('colmex_connection_changed', { detail: { connected: true } }));
            this.addLog('חשבון Colmex Pro חובר בהצלחה!', 'success');
            return { success: true, data };
        } catch (error) {
            this.addLog(`שגיאת התחברות: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    },

    syncTrades: async function (accessToken, username = null, options = {}) {
        try {
            const token = accessToken || this.getToken();
            if (!token) throw new Error("Colmex token not found.");

            const { data: { session } } = await supabase.auth.getSession();
            const supabaseToken = session?.access_token;

            // Determine dates
            const defaultFromDate = new Date();
            defaultFromDate.setDate(defaultFromDate.getDate() - 7);
            const fromDate = options.fromDate || defaultFromDate.toISOString();
            const toDate = options.toDate || new Date().toISOString();

            // Determine if Real or UAT (can be passed in options)
            const isReal = options.isReal || false;

            this.addLog(`מתחיל סנכרון: מ-${new Date(fromDate).toLocaleDateString('he-IL')} עד ${new Date(toDate).toLocaleDateString('he-IL')}`, 'info');

            const response = await fetch(`${COLMEX_CONFIG.edgeFunctionUrl}/trades`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': COLMEX_CONFIG.supabaseKey,
                    'Authorization': supabaseToken ? `Bearer ${supabaseToken}` : ''
                },
                body: JSON.stringify({
                    colmexToken: token,
                    fromDate,
                    toDate,
                    isReal
                })
            });

            if (response.status === 401 && !accessToken) {
                this.addLog('טוקן פג תוקף, מנסה לחדש...', 'info');
                const newToken = await this.refreshToken(username);
                if (newToken) return this.syncTrades(newToken, username, options);
                throw new Error("Unauthorized");
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Sync failed (${response.status})`);
            }

            const responseData = await response.json();
            let rawExecutions = responseData.trades || (Array.isArray(responseData) ? responseData : []);
            const openPositions = responseData.openPositions || [];

            // STRICT DATE FILTERING ("Iron Wall"): 
            // We now receive exact local midnight/end-of-day timestamps from the UI.
            const filterTimeFrom = new Date(fromDate).getTime();
            const filterTimeTo = toDate ? new Date(toDate).getTime() : Infinity;

            rawExecutions = rawExecutions.filter(ex => {
                const exTime = new Date(ex.lastmodified || ex.createddate || ex.time || Date.now()).getTime();
                return exTime >= filterTimeFrom && exTime <= filterTimeTo;
            });

            console.log(`📊 Received ${rawExecutions.length} executions (strictly filtered fromDate: ${fromDate}) and ${openPositions.length} open positions.`);


            // Helper to identify futures
            const isFutureSymbol = (symbol) => {
                if (!symbol) return false;
                const s = symbol.toUpperCase();
                return s.startsWith('/') || s.startsWith('MES') || s.startsWith('MNQ') || s.startsWith('ES') || s.startsWith('NQ');
            };

            // 1. Normalize executions
            const executions = rawExecutions.map(ex => {
                const sym = (ex.symbol || ex.instrumentname || ex.tradableinstrumentid || 'N/A').toUpperCase();
                const rawSide = (ex.side || ex.action || '').toUpperCase();
                const isBuy = rawSide.includes('BUY') || rawSide.includes('LONG');

                return {
                    id: ex.id || ex.executionid || ex.orderid || Math.random().toString(36).substr(2, 9),
                    symbol: sym,
                    qty: parseFloat(ex.filledqty || ex.quantity || ex.qty || 0),
                    price: parseFloat(ex.avgprice || ex.price || ex.executionprice || 0),
                    side: isBuy ? 'BUY' : 'SELL',
                    timestamp: new Date(ex.lastmodified || ex.createddate || ex.time || Date.now()).getTime(),
                    fees: parseFloat(ex.commission || ex.totalcomm || ex.fees || 0),
                    pnl: parseFloat(ex.realizedpnl || ex.pnl || 0),
                    market: isFutureSymbol(sym) ? 'futures' : 'stocks'
                };
            }).filter(ex => ex.symbol !== 'N/A' && ex.qty > 0)
              .sort((a, b) => a.timestamp - b.timestamp);

            // Normalize Open Positions for quick lookup
            const brokerPositions = {};
            openPositions.forEach(p => {
                const sym = (p.symbol || p.instrumentName || p.tradableInstrumentId || '').toUpperCase();
                if (sym) {
                    brokerPositions[sym] = Math.abs(parseFloat(p.quantity || p.qty || 0));
                }
            });

            const consolidatedTrades = [];
            const inventory = {}; 
            const activeSessions = {}; 

            executions.forEach(exec => {
                const sym = exec.symbol;
                if (!inventory[sym]) inventory[sym] = [];
                if (!activeSessions[sym]) {
                    activeSessions[sym] = { 
                        symbol: sym,
                        entries: [], 
                        exits: [], 
                        totalPnl: 0, 
                        totalFees: 0,
                        startTime: exec.timestamp,
                        side: exec.side
                    };
                }

                const existingSide = inventory[sym].length > 0 ? inventory[sym][0].side : null;

                if (!existingSide || existingSide === exec.side) {
                    inventory[sym].push({ ...exec });
                    activeSessions[sym].entries.push(exec);
                    activeSessions[sym].totalFees += exec.fees;
                } else {
                    let remainingToClose = exec.qty;
                    activeSessions[sym].totalFees += exec.fees;
                    activeSessions[sym].exits.push(exec);
                    
                    while (remainingToClose > 0 && inventory[sym].length > 0) {
                        const openExec = inventory[sym][0];
                        const closeQty = Math.min(remainingToClose, openExec.qty);
                        
                        const entryPrice = openExec.price;
                        const exitPrice = exec.price;
                        const isLong = openExec.side === 'BUY';
                        
                        const realizedPnl = isLong 
                            ? (exitPrice - entryPrice) * closeQty 
                            : (entryPrice - exitPrice) * closeQty;

                        activeSessions[sym].totalPnl += (openExec.pnl ? (openExec.pnl * (closeQty/openExec.qty)) : realizedPnl);

                        openExec.qty -= closeQty;
                        remainingToClose -= closeQty;
                        if (openExec.qty <= 0) inventory[sym].shift();
                    }

                    if (inventory[sym].length === 0) {
                        const brokerQty = brokerPositions[sym] || 0;
                        
                        if (brokerQty === 0) {
                            const sess = activeSessions[sym];
                            const market = isFutureSymbol(sym) ? 'futures' : 'stocks';
                            
                            const totalEntryQty = sess.entries.reduce((acc, e) => acc + e.qty, 0);
                            const avgEntry = sess.entries.reduce((acc, e) => acc + (e.price * e.qty), 0) / totalEntryQty;
                            
                            const totalExitQty = sess.exits.reduce((acc, e) => acc + e.qty, 0);
                            const avgExit = sess.exits.reduce((acc, e) => acc + (e.price * e.qty), 0) / totalExitQty;

                            const firstEntry = sess.entries[0];
                            const lastExit = sess.exits[sess.exits.length - 1];

                            // Prepare Multi-Layer (Scale-in/out) parts for the Journal
                            const entryParts = sess.entries.map(e => ({
                                price: e.price.toString(),
                                quantity: e.qty.toString()
                            }));
                            const exitParts = sess.exits.map(e => ({
                                price: e.price.toString(),
                                quantity: e.qty.toString()
                            }));

                            consolidatedTrades.push({
                                id: `clm-sess-${sym}-${firstEntry.timestamp}`,
                                symbol: sym,
                                date: new Date(lastExit.timestamp).toISOString().split('T')[0],
                                time: new Date(lastExit.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
                                type: sess.side === 'BUY' ? 'Long' : 'Short',
                                entryPrice: avgEntry,
                                exitPrice: avgExit,
                                quantity: totalEntryQty,
                                contracts: totalEntryQty,
                                entryParts: entryParts,
                                exitParts: exitParts,
                                fees: sess.totalFees,
                                pnl: sess.totalPnl,
                                strategy: 'Colmex Sync',
                                notes: `Consolidated ${sess.entries.length} in / ${sess.exits.length} out (${market})`,
                                market: market
                            });

                            delete activeSessions[sym];
                        } else {
                            console.log(`⏳ Session for ${sym} seems closed in executions, but broker says ${brokerQty} shares still open. Waiting...`);
                        }

                        if (remainingToClose > 0) {
                            exec.qty = remainingToClose;
                            inventory[sym] = [{ ...exec }];
                            activeSessions[sym] = {
                                symbol: sym,
                                entries: [{ ...exec }],
                                exits: [],
                                totalPnl: 0,
                                totalFees: 0,
                                startTime: exec.timestamp,
                                side: exec.side
                            };
                        }
                    }
                }
            });

            // 3. Final Logs and Stats
            const totalFound = consolidatedTrades.length;
            if (totalFound > 0) {
                this.addLog(`נסרקו ${totalFound} עסקאות סגורות מההיסטוריה. המערכת בודקת מה חדש...`, 'info');
                
                const stats = JSON.parse(localStorage.getItem('colmex_stats') || '{"totalSynced":0}');
                stats.totalSynced += totalFound;
                stats.lastSyncTime = new Date().toISOString();
                localStorage.setItem('colmex_stats', JSON.stringify(stats));
                window.dispatchEvent(new Event('colmex_stats_updated'));
            } else {
                this.addLog('לא נמצאו עסקאות סגורות חדשות (ייתכן שיש פוזיציות פתוחות או שאין פעילות בטווח התאריכים).', 'info');
            }

            return consolidatedTrades;
        } catch (error) {
            this.addLog(`שגיאת סנכרון: ${error.message}`, 'error');
            throw error;
        }
    },

    // --- Step 5: Multi-Account Support ---
    getAccounts: async function () {
        try {
            const token = this.getToken();
            if (!token) return [];

            const { data: { session } } = await supabase.auth.getSession();
            const supabaseToken = session?.access_token;

            const response = await fetch(`${COLMEX_CONFIG.edgeFunctionUrl}/accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': COLMEX_CONFIG.supabaseKey,
                    'Authorization': supabaseToken ? `Bearer ${supabaseToken}` : ''
                },
                body: JSON.stringify({ colmexToken: token })
            });

            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
    },

    logout: async function (username = null) {
        localStorage.removeItem('colmex_access_token');
        localStorage.removeItem('colmex_refresh_token');
        localStorage.removeItem('colmex_auth_state');
        localStorage.removeItem('colmex_activity_logs');

        if (username) {
            try {
                // Notify other devices via relay
                tradeService.pushColmexStatus(username, 'disconnected');

                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('metadata')
                        .ilike('username', username.trim().toLowerCase())
                        .maybeSingle();

                    if (profile) {
                        const updatedMetadata = { ...(profile.metadata || {}) };
                        delete updatedMetadata.colmex_connection;
                        await supabase
                            .from('profiles')
                            .update({ metadata: updatedMetadata })
                            .eq('username', username);
                    }
                }
            } catch (e) {
                console.error('Failed to clear Colmex from cloud:', e);
            }
        }

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('colmex_connection_changed', { detail: { connected: false } }));
        this.addLog('החשבון נותק בהצלחה.', 'info');
    },

    maskId: function (id) {
        if (!id) return '';
        const s = String(id);
        if (s.length <= 4) return s;
        return `CLM-***${s.slice(-3)}`;
    },

    checkCallback: () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const savedState = localStorage.getItem('colmex_auth_state');

        if (code) {
            localStorage.removeItem('colmex_auth_state');
            if (state && savedState && state !== savedState) {
                return { error: 'Security verification failed' };
            }
            return { code };
        }
        return null;
    },

    extractCodeFromUrl: (url) => {
        try {
            const urlObj = new URL(url);
            return urlObj.searchParams.get('code');
        } catch (e) {
            const match = url.match(/[?&]code=([^&]+)/);
            return match ? match[1] : null;
        }
    },

    handleCallback: async function (fullUrl) {
        const url = new URL(fullUrl);
        const code = url.searchParams.get('code');
        if (!code) throw new Error('No code found in URL');
        return await this.exchangeCodeForToken(code);
    }
};
