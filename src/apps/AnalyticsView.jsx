import React, { useState, useMemo } from 'react';
import { ChevronDown, PieChart } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

import AnalyticsPerformanceSection from './AnalyticsPerformanceSection';

// --- Helper Functions ---
const formatNumber = (num, decimals = 0) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const formatCompactNumber = (number) => {
    if (number === 0 || !number || isNaN(number)) return '0';
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(number);
};

const getDayOfWeek = (dateString) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'sunday'; // Fallback
    return days[date.getDay()];
};

const getHourBucket = (timeString) => {
    if (!timeString) return 0;
    const hour = parseInt(timeString.split(':')[0]);
    return isNaN(hour) ? 0 : hour;
};

const getAnalyticsStartDate = (range) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    switch (range) {
        case '1W':
            start.setDate(start.getDate() - 7);
            break;
        case '1M':
            start.setMonth(start.getMonth() - 1);
            break;
        case '3M':
            start.setMonth(start.getMonth() - 3);
            break;
        case '6M':
            start.setMonth(start.getMonth() - 6);
            break;
        case 'YTD':
            // Year To Date - from January 1st of current year
            return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        case '1Y':
            start.setFullYear(start.getFullYear() - 1);
            break;
        case 'ALL':
            return null;
        default:
            return null;
    }
    return start;
};

// --- Dropdown Component ---
const DropdownComponent = ({ currency, showPercentage, setShowPercentage }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-blue-500/20 border border-blue-500/40 rounded px-3.5 py-0.5 text-[10px] font-bold text-blue-400 backdrop-blur-sm hover:bg-blue-500/30 transition-all flex items-center justify-center gap-1"
            >
                {showPercentage ? '%' : currency}
                <ChevronDown size={10} />
            </button>
            {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded shadow-xl z-[100]">
                    <button
                        onClick={() => { setShowPercentage(false); setDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-[10px] font-bold text-blue-400 hover:bg-slate-700"
                    >
                        {currency}
                    </button>
                    <button
                        onClick={() => { setShowPercentage(true); setDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-[10px] font-bold text-blue-400 hover:bg-slate-700"
                    >
                        %
                    </button>
                </div>
            )}
        </div>
    );
};

const AnalyticsView = ({ trades = [], startingCapital = 25000, currency = '$', styles, t, lang, isRTL }) => {
    const [analyticsRange, setAnalyticsRange] = useState('ALL');
    const [showPercentage, setShowPercentage] = useState(false);

    // 1. Filter trades by range
    const analyticsTrades = useMemo(() => {
        const startDate = getAnalyticsStartDate(analyticsRange);
        if (!startDate) {
            return trades;
        }

        const filtered = trades.filter(t => {
            if (!t.date) return false;
            const d = new Date(t.date + 'T00:00:00');
            return !isNaN(d.getTime()) && d >= startDate;
        });

        return filtered;
    }, [trades, analyticsRange]);

    // 2. Main Stats Memo
    const analyticsStats = useMemo(() => {
        const totalTrades = analyticsTrades.length;
        const wins = analyticsTrades.filter(tr => (tr.pnl || 0) > 0);
        const losses = analyticsTrades.filter(tr => (tr.pnl || 0) <= 0);
        const totalPnl = analyticsTrades.reduce((acc, tr) => acc + (tr.pnl || 0), 0);
        const grossProfit = wins.reduce((acc, tr) => acc + (tr.pnl || 0), 0);
        const grossLoss = losses.reduce((acc, tr) => acc + (tr.pnl || 0), 0);
        const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
        const avgR = totalTrades > 0 ? analyticsTrades.reduce((acc, tr) => acc + parseFloat(tr.rMultiple || 0), 0) / totalTrades : 0;

        const startDate = getAnalyticsStartDate(analyticsRange);
        let startingBalanceForPeriod = 0; // Start from 0 for filtered periods

        // Only use starting capital for "ALL" mode
        if (!startDate || analyticsRange === 'ALL') {
            startingBalanceForPeriod = Number(startingCapital) || 0;

            // For ALL mode, add all trades before current period
            if (startDate) {
                const tradesBefore = trades.filter(t => {
                    if (!t.date) return false;
                    const d = new Date(t.date + 'T00:00:00');
                    return !isNaN(d.getTime()) && d < startDate;
                });
                const pnlBefore = tradesBefore.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);
                startingBalanceForPeriod += pnlBefore;
            }
        }

        const isAllRange = analyticsRange === 'ALL';
        let runningBalance = isAllRange ? startingBalanceForPeriod : 0;
        const sortedForChart = [...analyticsTrades].sort((a, b) => {
            const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
            const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
            return dateA - dateB;
        });

        // Build equity data
        const equityData = [];

        // Add a starting point for the chart
        equityData.push({
            trade: 0,
            date: startDate ? startDate.toISOString().split('T')[0] : 'Start',
            equity: runningBalance,
            pnl: 0,
            percent: 0
        });

        // Calculate percentage based on starting capital, not period balance
        const baseCapital = Number(startingCapital) || 1; // Avoid division by zero

        sortedForChart.forEach((t, index) => {
            const pnl = parseFloat(t.pnl) || 0;
            runningBalance += pnl;

            // percent is always calculated relative to startingCapital for ROI
            const currentAbsoluteEquity = isAllRange ? runningBalance : runningBalance + Number(startingCapital);
            const percent = startingCapital > 0 ? ((currentAbsoluteEquity - startingCapital) / startingCapital) * 100 : 0;

            equityData.push({
                trade: index + 1,
                date: t.date,
                equity: runningBalance,
                pnl: pnl,
                percent: percent
            });
        });

        const groupPerformance = (keyFn) => {
            const groups = {};
            analyticsTrades.forEach(tr => {
                const key = keyFn(tr);
                if (!groups[key]) groups[key] = { name: key, pnl: 0, count: 0, wins: 0, totalR: 0 };
                groups[key].pnl += (tr.pnl || 0);
                groups[key].count += 1;
                if (tr.pnl > 0) groups[key].wins += 1;
                groups[key].totalR += parseFloat(tr.rMultiple || 0);
            });
            return Object.values(groups).map(g => ({
                ...g,
                winRate: g.count > 0 ? (g.wins / g.count) * 100 : 0,
                avgR: g.count > 0 ? g.totalR / g.count : 0
            }));
        };

        const strategyData = groupPerformance(tr => tr.strategy || t('unknown')).sort((a, b) => b.pnl - a.pnl);

        const daySorter = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
        const dayData = groupPerformance(tr => getDayOfWeek(tr.date))
            .sort((a, b) => daySorter[a.name] - daySorter[b.name])
            .map(d => ({
                ...d,
                displayName: d.name ? (t(d.name.toLowerCase()) || d.name) : t('unknown')
            }));

        const hourDataRaw = groupPerformance(tr => getHourBucket(tr.time));
        const hourData = hourDataRaw.sort((a, b) => a.name - b.name);
        const formattedHourData = hourData.map(h => ({
            ...h,
            displayName: `${h.name.toString().padStart(2, '0')}:00 - ${(h.name + 1).toString().padStart(2, '0')}:00`
        }));

        return {
            totalTrades, wins, losses, totalPnl, grossProfit, grossLoss, winRate, avgR,
            equityData,
            strategyData,
            dayData,
            hourData: formattedHourData
        };
    }, [analyticsTrades, startingCapital, t, analyticsRange, trades]);

    // 3. Filter Chart Data point for Start display
    const filteredEquityData = useMemo(() => {
        if (!analyticsStats?.equityData || analyticsStats.equityData.length === 0) return [];
        return analyticsStats.equityData;
    }, [analyticsStats?.equityData]);

    return (
        <div className="grid grid-cols-1 gap-6 pb-12">
            <div className={`${styles.bgCard} p-6 rounded-xl shadow-lg border ${styles.border}`}>
                <div className="mb-6 flex justify-between items-center">
                    <h3 className={`text-sm font-bold ${styles.textSecondary} uppercase`}>
                        {analyticsRange === 'ALL' ? (lang === 'he' ? 'גרף שווי התיק' : 'Portfolio Value Chart') : t('equityCurve')}
                    </h3>
                </div>

                <div className="flex justify-start items-center gap-2 mb-6 bg-slate-900/30 p-1.5 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                        {['1W', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'].map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setAnalyticsRange(r)}
                                className={`px-1.5 py-1 md:px-3 md:py-1.5 rounded-lg text-[9px] md:text-[11px] font-bold transition-all border whitespace-nowrap
                                    ${analyticsRange === r
                                        ? 'bg-blue-600 text-white border-blue-500 shadow'
                                        : `${styles.inputBg} ${styles.textSecondary} border-slate-700 hover:bg-slate-700/40`
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    <div className={`h-80 w-full border ${styles.border} rounded-lg bg-gradient-to-br ${styles.theme === 'light' ? 'from-gray-50 to-white' : 'from-slate-900/50 to-slate-800/30'} relative`} style={{ minWidth: '600px' }} dir="ltr">
                        <div className="absolute top-2 left-6 z-50">
                            <DropdownComponent
                                currency={currency}
                                showPercentage={showPercentage}
                                setShowPercentage={setShowPercentage}
                            />
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart key={analyticsRange} data={filteredEquityData} margin={{ top: 35, right: 30, left: 10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorValueChart" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={styles.theme === 'light' ? '#e5e7eb' : '#334155'} opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    padding={{ left: 10, right: 10 }}
                                    stroke={styles.theme === 'light' ? '#6b7280' : '#64748b'}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => {
                                        if (v === 'Start' || v === t('chartStart')) return '';
                                        const date = new Date(v);
                                        if (isNaN(date.getTime())) return '';
                                        return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }}
                                />
                                <YAxis
                                    stroke={styles.theme === 'light' ? '#6b7280' : '#64748b'}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['auto', 'auto']}
                                    tickFormatter={(val) => showPercentage ? `${val.toFixed(1)}%` : formatCompactNumber(val)}
                                />
                                <Tooltip
                                    cursor={false}
                                    contentStyle={{ backgroundColor: styles.theme === 'light' ? '#fff' : '#1e293b', borderRadius: '8px', border: '1px solid #475569' }}
                                    formatter={(val) => showPercentage ? [`${val.toFixed(2)}%`, t('equityCurvePercent')] : [`${currency}${formatNumber(val)}`, analyticsRange === 'ALL' ? t('equity') : t('pnl')]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={showPercentage ? "percent" : "equity"}
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValueChart)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <AnalyticsPerformanceSection
                analyticsStats={analyticsStats}
                filteredTrades={analyticsTrades}
                minTrades={1}
                currencySymbol={currency}
                t={t}
                styles={styles}
                lang={lang}
                isRTL={isRTL}
            />
        </div>
    );
};

export default AnalyticsView;
