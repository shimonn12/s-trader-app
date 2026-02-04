import React, { useState, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Save,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Helper: Format Numbers ---
const formatCurrency = (val, currency = '$') => {
    const n = Number(val);
    if (isNaN(n)) return `${currency}0.00`;
    return `${currency}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// --- Helper: Get Date Ranges ---
const getRangeDates = (date, period) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    if (period === 'weekly') {
        const day = start.getDay(); // 0 is Sunday, 1 is Monday...
        const diff = start.getDate() - day; // Start on Sunday
        start.setDate(diff);
        end.setTime(start.getTime());
        end.setDate(start.getDate() + 6);
    } else if (period === 'monthly') {
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
    } else if (period === 'yearly') {
        start.setMonth(0, 1);
        end.setMonth(11, 31);
    }

    return { start, end };
};

// --- Circular Progress Component (The Ring) ---
const GoalRing = ({ percentage, t }) => {
    const pct = Math.max(0, Math.min(100, percentage));
    const done = pct >= 100;

    const size = 220;
    const stroke = 30;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = (pct / 100) * c;

    // Calculate angles for radial lines - perfectly aligned at 12 o'clock
    const angleGreenStart = -90;
    const angleGreenEnd = angleGreenStart + (pct * 3.6);

    // Helper function to get point on circle at angle
    const getPoint = (angle, radius) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: size / 2 + radius * Math.cos(rad),
            y: size / 2 + radius * Math.sin(rad)
        };
    };

    return (
        <div className="flex justify-center mb-8">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size}>
                    {/* Background circle (gray) - always full */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        strokeWidth={stroke}
                        strokeLinecap="butt"
                        className="text-slate-700"
                        stroke="currentColor"
                        fill="transparent"
                    />

                    {/* Progress circle (green) - what's achieved */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        strokeWidth={stroke}
                        strokeLinecap="butt"
                        className="text-emerald-500"
                        stroke="currentColor"
                        fill="transparent"
                        strokeDasharray={`${dash} ${c - dash}`}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        style={{ transition: "stroke-dasharray 300ms ease" }}
                    />

                    {/* Thin white outlines - framing the entire donut */}
                    {/* Outer circle outline - complete circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r + stroke / 2 - 1}
                        fill="none"
                        stroke="white"
                        strokeWidth={1.2}
                        opacity={0.6}
                    />

                    {/* Inner circle outline - complete circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r - stroke / 2 + 1}
                        fill="none"
                        stroke="white"
                        strokeWidth={1.2}
                        opacity={0.6}
                    />

                    {/* White separator lines at edges of green arc */}
                    {pct > 0 && pct < 100 && (
                        <>
                            {/* End line (dynamic, follows progress) */}
                            <line
                                x1={getPoint(angleGreenEnd, r - stroke / 2).x}
                                y1={getPoint(angleGreenEnd, r - stroke / 2).y}
                                x2={getPoint(angleGreenEnd, r + stroke / 2).x}
                                y2={getPoint(angleGreenEnd, r + stroke / 2).y}
                                stroke="white"
                                strokeWidth={1.5}
                                style={{ transition: "all 300ms ease" }}
                            />
                        </>
                    )}

                    {/* Start line at 12 o'clock - always visible */}
                    <line
                        x1={getPoint(angleGreenStart, r - stroke / 2).x}
                        y1={getPoint(angleGreenStart, r - stroke / 2).y}
                        x2={getPoint(angleGreenStart, r + stroke / 2).x}
                        y2={getPoint(angleGreenStart, r + stroke / 2).y}
                        stroke="white"
                        strokeWidth={1.2}
                        opacity={0.6}
                    />

                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-5xl font-black tracking-tight leading-none ${done ? 'text-emerald-500' : 'text-white'}`}>
                        {Math.round(pct)}%
                    </div>
                    <div className="text-sm font-medium text-slate-400 mt-2 tracking-wide">
                        {done ? t("completed") : t("completion")}
                    </div>
                </div>
            </div>
        </div>
    );
};

const GoalsView = ({ trades, goals, setGoals, currency = '$', t = (s) => s, lang = 'he', isRTL = true }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedPeriod, setSelectedPeriod] = useState('weekly'); // weekly, monthly, yearly
    const [tempGoalInput, setTempGoalInput] = useState('');

    // 1. Calculate Date Range Labels
    const { start, end } = useMemo(() => getRangeDates(currentDate, selectedPeriod), [currentDate, selectedPeriod]);

    const dateLabel = useMemo(() => {
        const monthNamesHe = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
        const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const getMonthName = (date) => {
            return lang === 'he' ? monthNamesHe[date.getMonth()] : monthNamesEn[date.getMonth()];
        };

        if (selectedPeriod === 'yearly') return start.getFullYear().toString();

        if (lang === 'he') {
            // Hebrew: "ינואר 4 - ינואר 11, 2026"
            const startStr = `${getMonthName(start)} ${start.getDate()}`;
            const endStr = `${getMonthName(end)} ${end.getDate()}, ${end.getFullYear()}`;
            return `${startStr} - ${endStr}`;
        } else {
            // English: "Jan 5 - Jan 11, 2026"
            const startStr = `${getMonthName(start)} ${start.getDate()}`;
            const endStr = `${getMonthName(end)} ${end.getDate()}, ${end.getFullYear()}`;
            return `${startStr} - ${endStr}`;
        }
    }, [start, end, selectedPeriod, lang, t]);

    // 2. Filter Trades & Calculate Stats
    const periodStats = useMemo(() => {
        let profit = 0;
        let losses = 0;
        let winCount = 0;
        let lossCount = 0;

        trades.forEach(trade => {
            const tDate = new Date(trade.date);
            // Check if trade date is within range (ignoring time)
            const tTime = tDate.getTime();
            if (tTime >= start.getTime() && tTime <= end.getTime()) {
                const val = parseFloat(trade.pnl);
                if (val > 0) {
                    profit += val;
                    winCount++;
                } else {
                    losses += Math.abs(val); // Keep positive for display in "Total Losses"
                    lossCount++;
                }
            }
        });

        const netProfit = profit - losses;
        return { netProfit, grossProfit: profit, losses, winCount, lossCount };
    }, [trades, start, end]);

    // 3. Goal Calculations
    const currentGoal = goals[selectedPeriod] || 0;
    const progress = currentGoal > 0 ? Math.min(100, Math.max(0, (periodStats.netProfit / currentGoal) * 100)) : 0;
    const remaining = Math.max(0, currentGoal - periodStats.netProfit);

    // Handlers
    const handleNav = (dir) => {
        const newDate = new Date(currentDate);
        if (selectedPeriod === 'weekly') newDate.setDate(newDate.getDate() + (dir * 7));
        if (selectedPeriod === 'monthly') newDate.setMonth(newDate.getMonth() + dir);
        if (selectedPeriod === 'yearly') newDate.setFullYear(newDate.getFullYear() + dir);
        setCurrentDate(newDate);
    };

    const handleSaveGoal = () => {
        const val = parseFloat(tempGoalInput);
        if (!isNaN(val)) {
            setGoals(prev => ({ ...prev, [selectedPeriod]: val }));
            setTempGoalInput('');
        }
    };

    // 4. Progress Chart Data - Last 10 periods
    const progressChartData = useMemo(() => {
        const data = [];
        const currentGoal = goals[selectedPeriod] || 0;

        for (let i = 9; i >= 0; i--) {
            const date = new Date(currentDate);

            switch (selectedPeriod) {
                case 'weekly':
                    date.setDate(date.getDate() - (i * 7));
                    break;
                case 'monthly':
                    date.setMonth(date.getMonth() - i);
                    break;
                case 'yearly':
                    date.setFullYear(date.getFullYear() - i);
                    break;
            }

            const { start, end } = getRangeDates(date, selectedPeriod);
            let profit = 0;
            let loss = 0;

            trades.forEach(trade => {
                const tradeDate = new Date(trade.date);
                if (tradeDate >= start && tradeDate <= end) {
                    if (trade.pnl > 0) {
                        profit += trade.pnl;
                    } else if (trade.pnl < 0) {
                        loss += Math.abs(trade.pnl);
                    }
                }
            });

            const netProfit = profit - loss;

            data.push({
                name: date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: selectedPeriod === 'yearly' ? undefined : 'numeric',
                    year: selectedPeriod === 'yearly' ? 'numeric' : undefined
                }),
                profit: parseFloat(netProfit.toFixed(2)),
                goal: currentGoal
            });
        }

        return data;
    }, [trades, selectedPeriod, currentDate, goals]);

    // Format compact numbers for chart
    const formatCompactNumber = (value) => {
        const num = parseFloat(value) || 0;
        const absNum = Math.abs(num);
        const sign = num < 0 ? '-' : '';

        if (absNum >= 1e12) {
            return `${sign}${(absNum / 1e12).toFixed(1)}T`;
        } else if (absNum >= 1e9) {
            return `${sign}${(absNum / 1e9).toFixed(1)}B`;
        } else if (absNum >= 1e6) {
            return `${sign}${(absNum / 1e6).toFixed(1)}M`;
        } else if (absNum >= 1e3) {
            return `${sign}${(absNum / 1e3).toFixed(1)}K`;
        }
        return num.toFixed(0);
    };

    return (
        <div className="w-full text-slate-100 font-sans">

            {/* Top Navigation Bar - Matched to Image */}
            <div className="flex items-center justify-between bg-[#1e293b] border border-slate-700/50 rounded-lg p-2 md:p-3 mb-4 shadow-lg min-h-[56px]" dir="ltr">
                {/* Left: Previous */}
                <button onClick={() => handleNav(-1)} className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-all flex-shrink-0">
                    <ChevronLeft size={20} />
                </button>

                {/* Center: Date Display */}
                <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-1">
                    <div className="flex items-center gap-1.5 md:gap-2.5 text-center">
                        <Calendar className="text-blue-500 flex-shrink-0 hidden xs:block" size={16} />
                        <span className="text-[11px] md:text-sm font-black text-slate-100 leading-tight">
                            {dateLabel}
                        </span>
                    </div>
                </div>

                {/* Right: Next & Reset */}
                <div className="flex items-center gap-1 md:gap-4 flex-shrink-0">
                    <button onClick={() => handleNav(1)} className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-all">
                        <ChevronRight size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="text-[11px] md:text-sm font-bold text-slate-400 hover:text-white transition-all px-2 py-1"
                    >
                        {t("reset")}
                    </button>
                </div>
            </div>

            {/* Main Grid Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* RIGHT COLUMN: Controls & Summary (Moved to top on mobile using order) */}
                <div className="flex flex-col gap-6 order-1 lg:order-2">

                    {/* Period Summary Card (Now Top) */}
                    <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="text-blue-500" size={20} />
                                <h3 className="text-lg font-bold text-white">{t("periodSummary")}</h3>
                            </div>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="bg-[#0f172a] border border-slate-700 text-xs text-slate-300 px-3 py-1 rounded capitalize outline-none cursor-pointer"
                            >
                                <option value="daily">{t("viewDay")}</option>
                                <option value="weekly">{t("viewWeek")}</option>
                                <option value="monthly">{t("viewMonth")}</option>
                                <option value="yearly">{t("viewYear")}</option>
                            </select>
                        </div>

                        <div className="space-y-4 flex-1">
                            {/* Profit Trades Bar */}
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex justify-between items-center">
                                <span className="text-emerald-500 text-sm font-medium">{t("profitTrades")}</span>
                                <span className="text-emerald-500 font-bold">{periodStats.winCount}</span>
                            </div>

                            {/* Loss Trades Bar */}
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex justify-between items-center">
                                <span className="text-rose-500 text-sm font-medium">{t("lossTrades")}</span>
                                <span className="text-rose-500 font-bold">{periodStats.lossCount}</span>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-slate-700/50 my-2"></div>

                            {/* Financials */}
                            <div className="bg-[#0f172a] rounded-lg p-4 flex justify-between items-center">
                                <span className="text-slate-400 text-sm">{t("totalLoss")}</span>
                                <span className="text-rose-500 font-bold">{formatCurrency(periodStats.losses, currency)}</span>
                            </div>

                            <div className="bg-[#0f172a] rounded-lg p-4 flex justify-between items-center">
                                <span className="text-slate-400 text-sm">{t("totalProfit")}</span>
                                <span className="text-emerald-500 font-bold">
                                    {formatCurrency(periodStats.grossProfit, currency)}
                                </span>
                            </div>

                            <div className="bg-[#0f172a] rounded-lg p-4 flex justify-between items-center">
                                <span className="text-slate-400 text-sm">{t("netPnlLabel")}</span>
                                <span className={`${periodStats.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'} font-bold`}>
                                    {formatCurrency(periodStats.netProfit, currency)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Update Goal Card (Now Bottom) */}
                    <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">{t("updateGoal")}</h3>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="bg-[#0f172a] border border-slate-700 text-xs text-white px-3 py-1 rounded outline-none cursor-pointer"
                            >
                                <option value="daily">{t("viewDay")}</option>
                                <option value="weekly">{t("viewWeek")}</option>
                                <option value="monthly">{t("viewMonth")}</option>
                                <option value="yearly">{t("viewYear")}</option>
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{currency}</span>
                                <input
                                    type="number"
                                    value={tempGoalInput}
                                    onChange={(e) => setTempGoalInput(e.target.value)}
                                    placeholder={t("enterGoal")}
                                    className="w-full bg-[#0f172a] border border-slate-700 text-white pl-8 pr-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <button
                                onClick={handleSaveGoal}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
                            >
                                {t("saveGoal")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* LEFT COLUMN: Goal Progress (Moved to bottom on mobile using order) */}
                <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 flex flex-col justify-between h-full order-2 lg:order-1">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6">{t("goalProgress")}</h3>
                        <div className="flex justify-center mb-8">
                            <GoalRing percentage={progress} t={t} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Goal Row */}
                        <div className="flex justify-between items-center bg-[#0f172a] p-4 rounded-lg border border-slate-800/50">
                            <span className="text-slate-400 text-sm font-medium capitalize">
                                {lang === 'he' ? `${t("goal")} ${t(selectedPeriod)}` : `${t(selectedPeriod)} ${t("goal")}`}
                            </span>
                            <span className="text-white font-bold" dir="ltr">{formatCurrency(currentGoal, currency)}</span>
                        </div>

                        {/* Profit Row */}
                        <div className="flex justify-between items-center bg-[#0f172a] p-4 rounded-lg border border-slate-800/50">
                            <span className="text-slate-400 text-sm font-medium capitalize">
                                {lang === 'he' ? `${t("profitLegend")} ${t(selectedPeriod)}` : `${t(selectedPeriod)} ${t("profitLegend")}`}
                            </span>
                            <span className={`${periodStats.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'} font-bold`} dir="ltr">
                                {formatCurrency(periodStats.netProfit, currency)}
                            </span>
                        </div>

                        {/* Remaining Row OR Goal Completed Message */}
                        {progress >= 100 ? (
                            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 p-4 rounded-lg text-center">
                                <span className="text-emerald-400 font-bold text-lg">
                                    🎊 {t("goalCompleted")}
                                </span>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center bg-[#0f172a] p-4 rounded-lg border border-slate-800/50">
                                <span className="text-slate-400 text-sm font-medium">{t("remaining")}</span>
                                <span className="text-white font-bold" dir="ltr">{formatCurrency(remaining, currency)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Chart - Below the two cards */}
            <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-bold text-white mb-6">{t("progressChart")}</h3>

                <div className="overflow-x-auto scrollbar-hide">
                    <div style={{ minWidth: '600px' }}>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={progressChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" strokeWidth={1} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9ca3af"
                                    strokeWidth={2}
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        fill: '#e5e7eb'
                                    }}
                                    tick={{ fill: '#e5e7eb' }}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    strokeWidth={2}
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        fill: '#e5e7eb'
                                    }}
                                    tick={{ fill: '#e5e7eb' }}
                                    tickFormatter={(value) => `${currency}${formatCompactNumber(value)}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                    formatter={(value) => `${currency}${formatCurrency(value, '')}`}
                                    labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
                                />
                                <Legend
                                    wrapperStyle={{
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="goal"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    name={t("goalLegend")}
                                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="profit"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    name={t("profitLegend")}
                                    dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div >

            {/* Annual Goals Overview - Below Progress Chart */}
            < div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 mt-6" >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">{t("annualGoalsOverview")}</h3>
                        <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest">
                            {new Date().getFullYear()} • {t("performanceSummary")}
                        </p>
                    </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }, (_, monthIndex) => {
                        const currentYear = new Date().getFullYear();
                        const currentMonth = new Date().getMonth();
                        const isFutureMonth = monthIndex > currentMonth;

                        let monthlyProfit = 0;
                        let monthlyLoss = 0;
                        trades.forEach(trade => {
                            const tradeDate = new Date(trade.date);
                            if (tradeDate.getFullYear() === currentYear && tradeDate.getMonth() === monthIndex) {
                                if (trade.pnl > 0) monthlyProfit += trade.pnl;
                                else if (trade.pnl < 0) monthlyLoss += Math.abs(trade.pnl);
                            }
                        });

                        const netMonthlyProfit = monthlyProfit - monthlyLoss;
                        const isCurrentMonth = monthIndex === currentMonth;
                        const monthlyGoal = goals.monthly || 0; // Show goal for ALL months
                        const rawProgress = monthlyGoal > 0 ? (netMonthlyProfit / monthlyGoal) * 100 : 0;
                        const progress = Math.min(Math.round(rawProgress), 100);
                        const isCompleted = rawProgress >= 100 && monthlyGoal > 0;

                        const monthNames = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];

                        return (
                            <div
                                key={monthIndex}
                                className={`p-5 rounded-xl border transition-all duration-300 ${isFutureMonth ? 'opacity-40 grayscale-[0.5]' : 'hover:shadow-lg hover:shadow-blue-500/5'
                                    } ${isCurrentMonth ? 'bg-blue-500/5 border-blue-500/30' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isCurrentMonth ? 'text-blue-400' : 'text-slate-400'
                                        }`}>
                                        {monthNames[monthIndex]}
                                    </span>
                                    <span className={`text-xs font-black ${isCompleted ? 'text-emerald-500' : isFutureMonth ? 'text-slate-600' : 'text-blue-500'
                                        }`}>
                                        {monthlyGoal > 0 ? `${progress}%` : '--'}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-1.5 bg-slate-900/50 rounded-full overflow-hidden mb-5">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out rounded-full ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                                            }`}
                                        style={{ width: `${isFutureMonth ? 0 : (monthlyGoal > 0 ? progress : 0)}%` }}
                                    />
                                </div>

                                {/* Profit / Goal */}
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${netMonthlyProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                                            }`}></span>
                                        <span className={`font-bold ${netMonthlyProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                            }`}>
                                            {currency}{formatCompactNumber(netMonthlyProfit)}
                                        </span>
                                    </div>

                                    <span className="text-slate-600 font-bold">/</span>

                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                                        <span className="font-bold text-blue-400">
                                            {isFutureMonth ? `${currency}0` : `${currency}${formatCompactNumber(monthlyGoal)}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div >
        </div >
    );
};

export default GoalsView;
