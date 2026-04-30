import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const COLMEX_CONFIG = {
  clientId: 'colmex_uat3',
  // Using the new secret from your email directly for this test
  clientSecret: 'GOCSPX-9aBcDeFgHiJkLmNoPqRsTuVwXyZ',
  tokenUrl: 'https://clientapi-uat.cglms.com/traderevolution/v1/oauth/token',
  apiUrl: 'https://clientapi-uat.cglms.com/traderevolution/v1',
  redirectUri: 'https://oauth.pstmn.io/v1/callback'
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, colmex-authorization',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  console.log(`🚀 COLMEX FINAL [Normalized Keys & Dynamic Date]`);

  try {
    const body = await req.json().catch(() => ({}));
    console.log("📦 Incoming Body:", JSON.stringify(body));
    const isReal = body.isReal === true;
    const fromDate = body.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = body.toDate;

    const TOKEN_URL = isReal ? 'https://clientapi.colmexpro.com/traderevolution/v1/oauth/token' : 'https://clientapi-uat.cglms.com/traderevolution/v1/oauth/token';

    const logs: string[] = [];
    let realIsDown = false;

    // Helper for API calls with auto-fallback and retry on 429
    const smartFetch = async (endpoint: string, authHeader: string, retries = 1): Promise<Response> => {
      const realUrl = `https://clientapi.colmexpro.com/traderevolution/v1${endpoint}`;
      const uatUrl = `https://clientapi-uat.cglms.com/traderevolution/v1${endpoint}`;

      const attemptFetch = async (targetUrl: string): Promise<Response> => {
        try {
          const res = await fetch(targetUrl, { 
            headers: { 'Authorization': authHeader, 'Accept': 'application/json' } 
          });
          
          if (res.status === 429 && retries > 0) {
            logs.push(`⏳ Rate limited (429), waiting 1.1s...`);
            await new Promise(r => setTimeout(r, 1100));
            return smartFetch(endpoint, authHeader, retries - 1);
          }
          return res;
        } catch (e) {
          logs.push(`❌ Network error on ${targetUrl}: ${e.message}`);
          throw e;
        }
      };

      // Try Real only if it's not known to be down
      if (!realIsDown) {
        try {
          const res = await attemptFetch(realUrl);
          if (res.status !== 401 && res.status !== 404 && res.status !== 429) return res;
          if (res.status === 404) realIsDown = true; // Likely UAT account on Real endpoint
          logs.push(`⚠️ Real returned ${res.status}, trying UAT...`);
        } catch (e) {
          logs.push(`⚠️ Real is unreachable, switching to UAT mode.`);
          realIsDown = true;
        }
      }

      try {
        return await attemptFetch(uatUrl);
      } catch (e) {
        return new Response(JSON.stringify({ error: "Network failure", debug: logs }), { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    };

    if (path === 'token') {
      try {
        const { code, redirectUri } = body;
        const credsString = `${COLMEX_CONFIG.clientId}:${COLMEX_CONFIG.clientSecret}`;
        const credentials = btoa(credsString);

        const params = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: COLMEX_CONFIG.clientId,
          client_secret: COLMEX_CONFIG.clientSecret,
          redirect_uri: redirectUri || COLMEX_CONFIG.redirectUri
        });

        const response = await fetch(TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
            'Accept': 'application/json'
          },
          body: params.toString()
        });

        const text = await response.text();
        return new Response(text, { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message, debug: logs }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (path === 'accounts' || path === 'trades') {
      let { colmexToken } = body;
      if (!colmexToken) {
        return new Response(JSON.stringify({ error: "Missing token", debug: logs }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      colmexToken = colmexToken.replace('Bearer ', '').trim();
      if (colmexToken.startsWith('ZXlK')) {
        try { colmexToken = atob(colmexToken); } catch (e) { logs.push("Decode fail"); }
      }

      const authHeader = `Bearer ${colmexToken}`;

      if (path === 'accounts') {
        const res = await smartFetch('/accounts', authHeader);
        const data = await res.json().catch(() => ({}));
        return new Response(JSON.stringify({ ...data, debug: logs }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // TRADES FLOW
      const fromTs = !isNaN(Date.parse(fromDate)) ? new Date(fromDate).getTime() : fromDate;
      const toTs = toDate ? (!isNaN(Date.parse(toDate)) ? new Date(toDate).getTime() : toDate) : null;
      const dateParams = `from=${fromTs}${toTs ? `&to=${toTs}` : ''}`;

      const apiRequest = async (endpoint: string) => {
        const res = await smartFetch(endpoint, authHeader);
        const text = await res.text();
        try { return JSON.parse(text); } catch (e) { return {}; }
      };

      const accData = await apiRequest('/accounts');
      const accounts = Array.isArray(accData) ? accData : (accData.accounts || accData.d?.accounts || []);
      const accountId = accounts[0]?.id || accounts[0]?.accountId;

      // Fetch current open positions to cross-reference
      let openPositions = [];
      if (accountId) {
        const posData = await apiRequest(`/accounts/${accountId}/positions`);
        openPositions = Array.isArray(posData) ? posData : (posData.positions || posData.d?.positions || []);
      }

      // Determine the correct mapping for executions/orders
      let mapping = ["id", "tradableinstrumentid", "instrumentname", "symbol", "qty", "side", "type", "status", "filledqty", "avgprice", "price", "stopprice", "validity", "expiredate", "createddate", "lastmodified", "isopen", "positionid"];
      
      const config = await apiRequest('/config');
      const rawMapping = config.ordersHistoryConfig || config.d?.ordersHistoryConfig;
      if (rawMapping && Array.isArray(rawMapping.columns)) {
        mapping = rawMapping.columns.map((col: any) => col.id.toLowerCase());
      }

      const endpoints = accountId
        ? [`/accounts/${accountId}/ordersHistory?${dateParams}`, `/trade/executions?${dateParams}`]
        : [`/trade/executions?${dateParams}`];

      let rawTrades: any[] = [];
      for (const ep of endpoints) {
        const data = await apiRequest(ep);
        const arr = Array.isArray(data) ? data : (data.d?.ordersHistory || data.executions || data.orders || []);
        if (Array.isArray(arr) && arr.length > 0) {
          // IMPORTANT: Merge results from all sources (History + Executions)
          // instead of breaking after the first one. This fixes missing March data.
          rawTrades = [...rawTrades, ...arr];
        }
      }

      const mapped = (Array.isArray(rawTrades) ? rawTrades : []).map((row: any) => {
        if (!Array.isArray(row)) return row;
        const obj: any = {};
        mapping.forEach((name: string, i: number) => {
          const n = name.toLowerCase().replace('/', '').replace(' ', '').trim();
          let val = row[i];
          
          // Robust Date detection: Handle timestamps as strings or numbers
          if (val !== null && val !== undefined) {
            const numVal = Number(val);
            if (!isNaN(numVal) && String(val).length >= 12 && String(val).length <= 14) {
              const d = new Date(numVal);
              if (!isNaN(d.getTime())) val = d.toISOString();
            }
          }
          obj[n] = val;
        });
        return obj;
      });

      return new Response(JSON.stringify({ trades: mapped, openPositions, debug: logs }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, debug: logs }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

