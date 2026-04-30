import * as XLSX from 'xlsx';

export const excelService = {
    // Export trades to Excel
    exportToExcel: (trades, filename = 'trades.xlsx') => {
        try {
            const worksheet = XLSX.utils.json_to_sheet(trades);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Trades");
            XLSX.writeFile(workbook, filename);
            return true;
        } catch (error) {
            console.error("Export to Excel failed:", error);
            return false;
        }
    },

    // Read and parse Excel file
    parseExcel: (file, platform, journalType) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    const rows = json;

                    if (platform === 'ibkr') {
                        const importedTrades = excelService.mapIBKR(rows, journalType);
                        resolve(importedTrades);
                    } else if (platform === 'tradestation') {
                        const importedTrades = excelService.mapTradeStation(rows, journalType);
                        resolve(importedTrades);
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    },

    // IBKR Mapping Logic
    mapIBKR: (rows, journalType) => {
        console.log(`[IBKR] Starting import for ${journalType}. Total rows: ${rows.length}`);

        let headerIndex = -1;
        const colMap = {};

        const norm = (v) => {
            return (v || "").toString().toLowerCase().replace(/[^a-z0-9]/g, ''); 
        };

        const expected = {
            discriminator: 'datadiscriminator',
            category: 'assetcategory',
            symbol: 'symbol',
            dateTime: 'datetime',
            quantity: 'quantity',
            tPrice: 'tprice',
            cPrice: 'cprice',
            pnl: 'realizedpl',
            comm: 'commfee',
            code: 'code'
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i] || [];
            if (row.length < 5) continue;

            const normalizedRow = row.map(c => norm(c));

            if (normalizedRow.includes(expected.discriminator) && normalizedRow.includes(expected.pnl)) {
                headerIndex = i;
                row.forEach((header, idx) => {
                    const clean = norm(header);
                    for (const [key, value] of Object.entries(expected)) {
                        if (clean === value) {
                            colMap[key] = idx;
                        }
                    }
                });
                console.log(`[IBKR] Found header at row ${i}:`, colMap);
                break;
            }
        }

        if (headerIndex === -1) {
            console.warn("[IBKR] Header row not found.");
            return [];
        }

        const importedTrades = [];

        for (let i = headerIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 5) continue;

            const disc = (row[colMap.discriminator] || '').toString();
            const category = (row[colMap.category] || '').toString();
            
            const discNorm = norm(disc);
            // Support Order, Execution, or Trade
            if (discNorm !== 'order' && discNorm !== 'execution' && discNorm !== 'trade') continue;

            const isStock = category.toLowerCase().includes('stock') || category === 'STK';
            const isFuture = category.toLowerCase().includes('future') || category === 'FUT';

            if (journalType === 'stocks' && !isStock) continue;
            if (journalType === 'futures' && !isFuture) continue;

            const symbol = (row[colMap.symbol] || '').toString().trim();
            const rawDateTime = (row[colMap.dateTime] || '').toString();
            const quantity = parseFloat((row[colMap.quantity] || '0').toString().replace(/[^0-9.-]/g, ''));
            const tPrice = parseFloat((row[colMap.tPrice] || '0').toString().replace(/[^0-9.-]/g, ''));
            const cPrice = parseFloat((row[colMap.cPrice] || '0').toString().replace(/[^0-9.-]/g, ''));

            let pnlRaw = (row[colMap.pnl] || '0').toString().trim();
            let isPnlNeg = pnlRaw.includes('(') || pnlRaw.startsWith('-');
            let pnl = parseFloat(pnlRaw.replace(/[^0-9.]/g, '')) * (isPnlNeg ? -1 : 1);

            const comm = parseFloat((row[colMap.comm] || '0').toString().replace(/[^0-9.-]/g, ''));

            if (!symbol || isNaN(pnl) || pnl === 0) continue;

            let date = new Date().toISOString().split('T')[0];
            let time = "09:30";
            
            if (rawDateTime) {
                // IBKR format is usually "YYYY-MM-DD, HH:mm:ss"
                const parts = rawDateTime.split(',');
                if (parts[0]) date = parts[0].trim();
                if (parts[1]) time = parts[1].trim().substring(0, 5);
                
                // Safety check for excel date numbers
                if (!isNaN(rawDateTime) && rawDateTime.length > 5) {
                   const excelDate = new Date((rawDateTime - 25569) * 86400 * 1000);
                   date = excelDate.toISOString().split('T')[0];
                   time = excelDate.toTimeString().substring(0, 5);
                }
            }

            const tradeId = `${symbol}_${date}_${time}_${quantity}`.replace(/[^a-zA-Z0-9]/g, '');

            importedTrades.push({
                id: tradeId,
                date: date,
                time: time,
                symbol: symbol.toUpperCase(),
                type: quantity > 0 ? 'Long' : 'Short',
                pnl: pnl,
                contracts: Math.abs(quantity),
                entryPrice: tPrice,
                exitPrice: cPrice,
                quantity: Math.abs(quantity), // Added for stocks journal compatibility
                strategy: '-', 
                notes: '-',
                journalType: 'imported'
            });
        }

        return importedTrades;
    },
    // TradeStation Mapping Logic
    mapTradeStation: (rows, journalType) => {
        console.log(`[TradeStation] Starting import for ${journalType}. Total rows: ${rows.length}`);
        
        // TradeStation statements are only for Futures in this context
        if (journalType !== 'futures') return [];

        let headerIndex = -1;
        const colMap = {};

        const norm = (v) => (v || "").toString().toLowerCase().replace(/[^a-z0-9]/g, '');

        const expected = {
            date: 'date',
            buy: 'longbuy',
            sell: 'shrtsell',
            description: 'description',
            price: 'pricelegnd',
            debit: 'debit',
            credit: 'credit'
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i] || [];
            const normalizedRow = row.map(c => norm(c));
            if (normalizedRow.includes(expected.date) && normalizedRow.includes(expected.description) && (normalizedRow.includes(expected.buy) || normalizedRow.includes(expected.sell))) {
                headerIndex = i;
                row.forEach((header, idx) => {
                    const clean = norm(header);
                    for (const [key, value] of Object.entries(expected)) {
                        if (clean === value) colMap[key] = idx;
                    }
                });
                break;
            }
        }

        if (headerIndex === -1) return [];

        const importedTrades = [];
        for (let i = headerIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 5) continue;

            const dateRaw = (row[colMap.date] || '').toString().trim();
            const desc = (row[colMap.description] || '').toString().trim();
            const buyQty = parseFloat((row[colMap.buy] || '0').toString().replace(/[^0-9.-]/g, '')) || 0;
            const sellQty = parseFloat((row[colMap.sell] || '0').toString().replace(/[^0-9.-]/g, '')) || 0;
            const price = parseFloat((row[colMap.price] || '0').toString().replace(/[^0-9.-]/g, '')) || 0;
            const debit = parseFloat((row[colMap.debit] || '0').toString().replace(/[^0-9.-]/g, '')) || 0;
            const credit = parseFloat((row[colMap.credit] || '0').toString().replace(/[^0-9.-]/g, '')) || 0;

            if (!dateRaw || !desc || (buyQty === 0 && sellQty === 0)) continue;

            // Extract Symbol from Description (e.g., "NQ", "ES")
            // Usually starts with Name/Symbol
            let symbol = desc.split(' ')[0].toUpperCase();
            if (desc.includes('NASDAQ')) symbol = 'NQ';
            else if (desc.includes('S&P 500')) symbol = 'ES';
            else if (desc.includes('DOW')) symbol = 'YM';
            else if (desc.includes('RUSSELL')) symbol = 'RTY';
            else if (desc.includes('GOLD')) symbol = 'GC';
            else if (desc.includes('OIL')) symbol = 'CL';

            // Simplified P&L for TS: In a realized statement, the difference between credit and debit rows 
            // often represents the P&L. For TradeStation Futures statements, individual trades 
            // usually don't show P&L directly per row unless it's a "Realized" section.
            // We will treat these as trades. If Credit > 0 it's usually a close or credit event.
            // For now, let's map the basic info and assume the user will verify P&L.
            const pnl = credit - debit;

            importedTrades.push({
                id: `TS_${symbol}_${dateRaw}_${i}`.replace(/[^a-zA-Z0-9]/g, ''),
                date: dateRaw, // Usually MM/DD/YYYY or similar
                time: "09:30",
                symbol: symbol,
                type: buyQty > 0 ? 'Long' : 'Short',
                contracts: Math.abs(buyQty || sellQty),
                entryPrice: price,
                exitPrice: price, // TS rows are single events
                pnl: pnl,
                strategy: '-',
                notes: 'TradeStation Import',
                journalType: 'imported'
            });
        }

        return importedTrades;
    }
};
