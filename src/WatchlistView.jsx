import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Plus, Trash2, Star } from 'lucide-react';

const WatchlistView = ({ t, styles, isRTL }) => {
    const [watchlist, setWatchlist] = useState([]);
    const [newSymbol, setNewSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Load watchlist from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('smartJournal_watchlist');
        if (saved) {
            setWatchlist(JSON.parse(saved));
        }
    }, []);

    // Save watchlist to localStorage
    useEffect(() => {
        if (watchlist.length > 0) {
            localStorage.setItem('smartJournal_watchlist', JSON.stringify(watchlist));
        }
    }, [watchlist]);

    // Auto-refresh every 15 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (watchlist.length > 0) {
                fetchPrices();
            }
        }, 15 * 60 * 1000); // 15 minutes

        return () => clearInterval(interval);
    }, [watchlist]);

    // Fetch prices from Finnhub API (free, no CORS issues)
    const fetchPrices = async () => {
        if (watchlist.length === 0) return;

        setLoading(true);
        const updatedList = [];

        // Free Finnhub API key (demo - you can get your own at finnhub.io)
        const API_KEY = 'ct7bra9r01qnhpbhvvd0ct7bra9r01qnhpbhvvdg';

        for (const item of watchlist) {
            try {
                const response = await fetch(
                    `https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${API_KEY}`
                );

                const data = await response.json();

                if (data.c && data.c > 0) {
                    const currentPrice = data.c; // Current price
                    const previousClose = data.pc; // Previous close
                    const change = data.d; // Change
                    const changePercent = data.dp; // Change percent

                    updatedList.push({
                        ...item,
                        price: currentPrice.toFixed(2),
                        change: change.toFixed(2),
                        changePercent: changePercent.toFixed(2),
                        lastUpdated: new Date().toLocaleTimeString()
                    });
                } else {
                    // Keep old data if fetch fails
                    updatedList.push(item);
                }
            } catch (error) {
                console.error(`Error fetching ${item.symbol}:`, error);
                // Keep old data if fetch fails
                updatedList.push(item);
            }
        }

        setWatchlist(updatedList);
        setLastUpdate(new Date());
        setLoading(false);
    };

    const addSymbol = () => {
        if (!newSymbol.trim()) return;

        const symbol = newSymbol.toUpperCase().trim();

        // Check if already exists
        if (watchlist.find(item => item.symbol === symbol)) {
            alert(isRTL ? 'הסימול כבר קיים ברשימה' : 'Symbol already in watchlist');
            return;
        }

        setWatchlist([...watchlist, {
            symbol,
            price: '--',
            change: '0.00',
            changePercent: '0.00',
            lastUpdated: '--'
        }]);

        setNewSymbol('');

        // Fetch price for new symbol
        setTimeout(() => fetchPrices(), 500);
    };

    const removeSymbol = (symbol) => {
        setWatchlist(watchlist.filter(item => item.symbol !== symbol));
    };

    return (
        <div className={`${styles.bgCard} p-6 rounded-xl shadow-lg border ${styles.border}`}>
            <div className={`flex justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className={`text-2xl font-bold ${styles.textPrimary} flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Star className="text-yellow-500" size={24} />
                    {t('watchlist') || 'Watchlist'}
                </h2>
                <button
                    onClick={fetchPrices}
                    disabled={loading || watchlist.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    {isRTL ? 'רענן' : 'Refresh'}
                </button>
            </div>

            {/* Add Symbol Form */}
            <div className={`flex gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
                    placeholder={isRTL ? 'הוסף סימול (לדוגמה: AAPL)' : 'Add symbol (e.g., AAPL)'}
                    className={`flex-1 p-3 ${styles.inputBg} border ${styles.border} rounded-lg ${styles.textPrimary} focus:border-blue-500 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                />
                <button
                    onClick={addSymbol}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg flex items-center gap-2"
                >
                    <Plus size={18} />
                    {isRTL ? 'הוסף' : 'Add'}
                </button>
            </div>

            {/* Last Update Time */}
            {lastUpdate && (
                <p className={`text-sm ${styles.textSecondary} mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'עדכון אחרון:' : 'Last updated:'} {lastUpdate.toLocaleTimeString()}
                </p>
            )}

            {/* Watchlist Table */}
            {watchlist.length === 0 ? (
                <div className={`text-center py-12 ${styles.textSecondary}`}>
                    <Star size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{isRTL ? 'רשימת המעקב ריקה. הוסף סימולים כדי להתחיל.' : 'Watchlist is empty. Add symbols to start tracking.'}</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${styles.border}`}>
                                <th className={`p-4 text-${isRTL ? 'right' : 'left'} ${styles.textSecondary} font-bold`}>{isRTL ? 'סימול' : 'Symbol'}</th>
                                <th className={`p-4 text-${isRTL ? 'right' : 'left'} ${styles.textSecondary} font-bold`}>{isRTL ? 'מחיר' : 'Price'}</th>
                                <th className={`p-4 text-${isRTL ? 'right' : 'left'} ${styles.textSecondary} font-bold`}>{isRTL ? 'שינוי' : 'Change'}</th>
                                <th className={`p-4 text-${isRTL ? 'right' : 'left'} ${styles.textSecondary} font-bold`}>{isRTL ? 'שינוי %' : 'Change %'}</th>
                                <th className={`p-4 text-${isRTL ? 'right' : 'left'} ${styles.textSecondary} font-bold`}>{isRTL ? 'עדכון אחרון' : 'Last Update'}</th>
                                <th className={`p-4 text-center ${styles.textSecondary} font-bold`}>{isRTL ? 'פעולות' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlist.map((item) => {
                                const isPositive = parseFloat(item.change) >= 0;
                                return (
                                    <tr key={item.symbol} className={`border-b ${styles.border} hover:${styles.hoverBg} transition-colors`}>
                                        <td className={`p-4 ${styles.textPrimary} font-bold text-${isRTL ? 'right' : 'left'}`}>{item.symbol}</td>
                                        <td className={`p-4 ${styles.textPrimary} font-mono text-${isRTL ? 'right' : 'left'}`}>${item.price}</td>
                                        <td className={`p-4 font-mono text-${isRTL ? 'right' : 'left'} ${isPositive ? 'text-emerald-500' : 'text-red-500'} flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            {item.change}
                                        </td>
                                        <td className={`p-4 font-mono text-${isRTL ? 'right' : 'left'} ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {isPositive ? '+' : ''}{item.changePercent}%
                                        </td>
                                        <td className={`p-4 ${styles.textSecondary} text-sm text-${isRTL ? 'right' : 'left'}`}>{item.lastUpdated}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => removeSymbol(item.symbol)}
                                                className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                                title={isRTL ? 'הסר' : 'Remove'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Info Note */}
            <div className={`mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className={`text-sm ${styles.textSecondary}`}>
                    {isRTL ? '💡 המחירים מתעדכנים אוטומטית כל 15 דקות. לחץ על "רענן" לעדכון ידני.' : '💡 Prices auto-refresh every 15 minutes. Click "Refresh" for manual update.'}
                </p>
            </div>
        </div>
    );
};

export default WatchlistView;
