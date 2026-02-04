import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, TrendingUp, Target, Calendar as CalendarIcon, Award, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const GoalsView = ({ trades, goals, setGoals, t, styles, isRTL, currency, lang }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('weekly');
    const [inputGoal, setInputGoal] = useState('');
    const [achievements, setAchievements] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showMonthlyAmounts, setShowMonthlyAmounts] = useState(true);

    // Load achievements from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('smartJournal_achievements');
        if (saved) {
            setAchievements(JSON.parse(saved));
        }
    }, []);

    // Validate achievements against current trades
    useEffect(() => {
        if (achievements.length === 0) return;

        const validatedAchievements = achievements.filter(achievement => {
            const { start, end } = getPeriodDates(achievement.period, new Date(achievement.date));

            let periodProfit = 0;
            trades.forEach(trade => {
                const tradeDate = new Date(trade.date);
                if (tradeDate >= start && tradeDate <= end && trade.pnl > 0) {
                    periodProfit += trade.pnl;
                }
            });

            // Keep achievement only if it's still valid
            return periodProfit >= achievement.goal;
        });

        if (validatedAchievements.length !== achievements.length) {
            setAchievements(validatedAchievements);
            localStorage.setItem('smartJournal_achievements', JSON.stringify(validatedAchievements));
        }
    }, [trades, achievements]);

    // Format number with currency separator
    const formatCurrency = (value) => {
        const num = parseFloat(value) || 0;
        if (currency === '₪') {
            return num.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Parse input with comma/dot support
    const parseInput = (value) => {
        return parseFloat(value.replace(/,/g, '')) || 0;
    };

    // Format large numbers compactly for charts (K, M, B, T)
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

    // Get period dates
    const getPeriodDates = (period, date = selectedDate) => {
        const d = new Date(date);
        let start, end;

        switch (period) {
            case 'daily':
                start = new Date(d);
                start.setHours(0, 0, 0, 0);
                end = new Date(d);
                end.setHours(23, 59, 59, 999);
                break;
            case 'weekly':
                const day = d.getDay();
                const diff = d.getDate() - day;
                start = new Date(d.setDate(diff));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                start = new Date(d.getFullYear(), d.getMonth(), 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'yearly':
                start = new Date(d.getFullYear(), 0, 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(d.getFullYear(), 11, 31);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                start = new Date();
                end = new Date();
        }

        return { start, end };
    };

    // Navigate dates
    const navigateDate = (direction) => {
        const newDate = new Date(selectedDate);

        switch (selectedPeriod) {
            case 'daily':
                newDate.setDate(newDate.getDate() + direction);
                break;
            case 'weekly':
                newDate.setDate(newDate.getDate() + (direction * 7));
                break;
            case 'monthly':
                newDate.setMonth(newDate.getMonth() + direction);
                break;
            case 'yearly':
                newDate.setFullYear(newDate.getFullYear() + direction);
                break;
        }

        setSelectedDate(newDate);
    };

    // Calculate period profit
    const periodStats = useMemo(() => {
        const { start, end } = getPeriodDates(selectedPeriod);
        const currentGoal = goals[selectedPeriod] || 0;

        let periodProfit = 0;
        let periodLoss = 0;
        let profitTrades = 0;
        let lossTrades = 0;

        trades.forEach(trade => {
            const tradeDate = new Date(trade.date);
            if (tradeDate >= start && tradeDate <= end) {
                if (trade.pnl > 0) {
                    periodProfit += trade.pnl;
                    profitTrades++;
                } else if (trade.pnl < 0) {
                    periodLoss += Math.abs(trade.pnl);
                    lossTrades++;
                }
            }
        });

        const netProfit = periodProfit - periodLoss;
        const progress = currentGoal > 0 ? Math.max(0, Math.min((netProfit / currentGoal) * 100, 100)) : 0;
        const remaining = Math.max(currentGoal - netProfit, 0);
        const isCompleted = netProfit >= currentGoal && currentGoal > 0;

        return {
            periodProfit,
            periodLoss,
            grossProfit: periodProfit,
            grossLoss: periodLoss,
            netProfit,
            profitTrades,
            lossTrades,
            progress,
            remaining,
            isCompleted,
            currentGoal
        };
    }, [trades, selectedPeriod, selectedDate, goals, achievements, currency]);

    // Auto-delete achievements if profit drops below goal
    useEffect(() => {
        const validAchievements = achievements.filter(achievement => {
            // Get the period dates for this achievement
            const achievementDate = new Date(achievement.date);
            const { start, end } = getPeriodDates(achievement.period, achievementDate);

            // Calculate current net profit for that period
            let currentProfit = 0;
            let currentLoss = 0;
            trades.forEach(trade => {
                const tradeDate = new Date(trade.date);
                if (tradeDate >= start && tradeDate <= end) {
                    if (trade.pnl > 0) {
                        currentProfit += trade.pnl;
                    } else if (trade.pnl < 0) {
                        currentLoss += Math.abs(trade.pnl);
                    }
                }
            });

            const netProfit = currentProfit - currentLoss;

            // Keep achievement only if current net profit is still >= goal
            const currentGoal = goals[achievement.period] || 0;
            return netProfit >= currentGoal && currentGoal > 0;
        });

        // Update if achievements changed
        if (validAchievements.length !== achievements.length) {
            setAchievements(validAchievements);
            localStorage.setItem('smartJournal_achievements', JSON.stringify(validAchievements));
        }
    }, [trades, achievements, goals]);


    // Progress chart data (last 10 periods)
    const progressChartData = useMemo(() => {
        const data = [];
        const currentGoal = goals[selectedPeriod] || 0;

        for (let i = 9; i >= 0; i--) {
            const date = new Date(selectedDate);

            switch (selectedPeriod) {
                case 'daily':
                    date.setDate(date.getDate() - i);
                    break;
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

            const { start, end } = getPeriodDates(selectedPeriod, date);
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
                name: date.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
                    month: 'short',
                    day: selectedPeriod === 'yearly' ? undefined : 'numeric',
                    year: selectedPeriod === 'yearly' ? 'numeric' : undefined
                }),
                profit: parseFloat(netProfit.toFixed(2)),
                goal: currentGoal
            });
        }

        return data;
    }, [trades, selectedPeriod, selectedDate, goals, lang]);

    const handleSaveGoal = () => {
        const newGoal = parseInput(inputGoal);
        setGoals({ ...goals, [selectedPeriod]: newGoal });
        setInputGoal('');
    };

    // Pie chart data
    const pieData = [
        { name: 'Progress', value: periodStats.progress },
        { name: 'Remaining', value: 100 - periodStats.progress }
    ];

    const COLORS = ['#10b981', '#374151'];

    const periodLabels = {
        daily: { en: 'Daily', he: 'יומי' },
        weekly: { en: 'Weekly', he: 'שבועי' },
        monthly: { en: 'Monthly', he: 'חודשי' },
        yearly: { en: 'Yearly', he: 'שנתי' }
    };

    const { start, end } = getPeriodDates(selectedPeriod);

    return (
        <div className="space-y-6 pb-12">
            {/* Date Navigator */}
            <div className="bg-slate-800 p-2 md:p-3 rounded-lg shadow-lg border border-slate-700 min-h-[56px]">
                <div className={`flex items-center justify-between gap-1 md:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                        onClick={() => navigateDate(-1)}
                        className="p-2 text-white hover:bg-slate-700 rounded-lg transition-all flex-shrink-0"
                    >
                        {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>

                    <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-1">
                        <div className="flex items-center gap-1.5 md:gap-2 justify-center text-center">
                            <CalendarIcon size={16} className="text-blue-500 flex-shrink-0 hidden xs:block" />
                            <div className="text-center">
                                {/* Mobile & Desktop: Improved wrapping for small screens */}
                                <div className="text-[11px] md:text-sm font-bold text-white leading-tight">
                                    {lang === 'he'
                                        ? `${start.toLocaleDateString('he-IL', { month: 'short' })} ${start.getDate()} - ${end.toLocaleDateString('he-IL', { month: 'short' })} ${end.getDate()}, ${end.getFullYear()}`
                                        : `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} - ${end.toLocaleDateString('en-US', { month: 'short' })} ${end.getDate()}, ${end.getFullYear()}`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigateDate(1)}
                        className="p-2 text-white hover:bg-slate-700 rounded-lg transition-all flex-shrink-0"
                    >
                        {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>

                    <button
                        onClick={() => setSelectedDate(new Date())}
                        className="text-[11px] md:text-xs text-slate-400 hover:text-blue-500 transition-colors px-2 py-1 rounded hover:bg-slate-700 flex-shrink-0"
                    >
                        {t('reset')}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-6">

                {/* Left: Progress Chart */}
                <div className={`${styles.bgCard} p-6 rounded-xl shadow-lg border ${styles.border}`}>
                    <h3 className={`text-xl font-bold ${styles.textPrimary} mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('goalProgress')}
                    </h3>

                    <div className="space-y-6">
                        {/* Donut Chart */}
                        <div className="relative">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className={`text-4xl font-bold ${periodStats.isCompleted ? 'text-emerald-500' : styles.textPrimary}`}>
                                        {Math.round(periodStats.progress)}%
                                    </div>
                                    <div className={`text-sm ${styles.textSecondary} mt-1`}>
                                        {periodStats.isCompleted ? t('completed') : t('completion')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-3">
                            <div className={`flex justify-between items-center p-3 rounded-lg ${styles.inputBg} ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className={styles.textSecondary}>
                                    {t(`${selectedPeriod}GoalLabel`)}
                                </span>
                                <span className={`font-bold ${styles.textPrimary}`}>{currency}{formatCurrency(periodStats.currentGoal)}</span>
                            </div>

                            <div className={`flex justify-between items-center p-3 rounded-lg ${styles.inputBg} ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className={styles.textSecondary}>
                                    {t(`${selectedPeriod}ProfitLabel`)}
                                </span>
                                <span className={`font-bold ${periodStats.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {currency}{formatCurrency(periodStats.netProfit)}
                                </span>
                            </div>

                            {!periodStats.isCompleted && (
                                <div className={`flex justify-between items-center p-3 rounded-lg ${styles.inputBg} ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span className={styles.textSecondary}>{t('remaining')}</span>
                                    <span className={`font-bold ${styles.textPrimary}`}>{currency}{formatCurrency(periodStats.remaining)}</span>
                                </div>
                            )}

                            {periodStats.isCompleted && (
                                <div className={`p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center`}>
                                    <p className="text-emerald-500 font-bold text-lg">
                                        🎉 {t('goalCompleted')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Goal Settings & Stats */}
                <div className="space-y-6 flex flex-col h-full">

                    {/* Period Summary */}
                    <div className={`${styles.bgCard} p-6 rounded-xl shadow-lg border ${styles.border} h-full flex flex-col order-first lg:order-none`}>
                        <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h3 className={`text-xl font-bold ${styles.textPrimary} flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <TrendingUp size={20} className="text-blue-500" />
                                {t('periodSummary')}
                            </h3>

                            {/* Period Dropdown */}
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className={`px-3 py-1.5 ${styles.inputBg} border ${styles.border} rounded-lg ${styles.textPrimary} font-bold focus:border-blue-500 outline-none cursor-pointer transition-all hover:border-blue-400 text-xs`}
                                >
                                    <option value="daily">{periodLabels.daily[lang === 'he' ? 'he' : 'en']}</option>
                                    <option value="weekly">{periodLabels.weekly[lang === 'he' ? 'he' : 'en']}</option>
                                    <option value="monthly">{periodLabels.monthly[lang === 'he' ? 'he' : 'en']}</option>
                                    <option value="yearly">{periodLabels.yearly[lang === 'he' ? 'he' : 'en']}</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1">
                            <div className={`flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="text-emerald-600 font-semibold">{t('profitTrades')}</span>
                                <span className="font-bold text-emerald-600">{periodStats.profitTrades}</span>
                            </div>

                            <div className={`flex justify-between items-center p-3 rounded-lg bg-red-500/10 border border-red-500/30 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="text-red-600 font-semibold">{t('lossTrades')}</span>
                                <span className="font-bold text-red-600">{periodStats.lossTrades}</span>
                            </div>

                            <div className={`flex justify-between items-center p-3 rounded-lg ${styles.inputBg} ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className={styles.textSecondary}>{t('grossLoss')}</span>
                                <span className="font-bold text-red-500">{currency}{formatCurrency(periodStats.grossLoss)}</span>
                            </div>

                            <div className={`flex justify-between items-center p-3 rounded-lg ${styles.inputBg} ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className={styles.textSecondary}>{t('grossProfit')}</span>
                                <span className="font-bold text-emerald-500">{currency}{formatCurrency(periodStats.grossProfit)}</span>
                            </div>

                            <div className={`flex justify-between items-center p-3 rounded-lg ${styles.inputBg} ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className={styles.textSecondary}>{lang === 'he' ? 'רווח/הפסד נקי' : 'Net P/L'}</span>
                                <span className={`font-bold ${periodStats.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {currency}{formatCurrency(periodStats.netProfit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Update Goal */}
                    <div className={`${styles.bgCard} p-6 rounded-xl shadow-lg border ${styles.border}`}>
                        <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h3 className={`text-xl font-bold ${styles.textPrimary} ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t('updateGoal')}
                            </h3>

                            {/* Period Dropdown - Compact */}
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className={`px-3 py-1.5 ${styles.inputBg} border ${styles.border} rounded-lg ${styles.textPrimary} font-bold focus:border-blue-500 outline-none cursor-pointer transition-all hover:border-blue-400 text-xs`}
                            >
                                <option value="daily">{periodLabels.daily[lang === 'he' ? 'he' : 'en']}</option>
                                <option value="weekly">{periodLabels.weekly[lang === 'he' ? 'he' : 'en']}</option>
                                <option value="monthly">{periodLabels.monthly[lang === 'he' ? 'he' : 'en']}</option>
                                <option value="yearly">{periodLabels.yearly[lang === 'he' ? 'he' : 'en']}</option>
                            </select>
                        </div>

                        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="relative flex-1">
                                <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 ${styles.textSecondary} font-bold`}>
                                    {currency}
                                </span>
                                <input
                                    type="text"
                                    value={inputGoal}
                                    onChange={(e) => setInputGoal(e.target.value)}
                                    placeholder={t('enterGoal')}
                                    className={`w-full p-3 ${isRTL ? 'pr-8 text-right' : 'pl-8 text-left'} ${styles.inputBg} border ${styles.border} rounded-lg ${styles.textPrimary} focus:border-blue-500 outline-none`}
                                />
                            </div>
                            <button
                                onClick={handleSaveGoal}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
                            >
                                {t('saveGoal')}
                            </button>
                        </div>
                    </div>

                </div>
            </div>


            {/* Progress Chart */}
            <div className={`${styles.bgCard} p-6 rounded-xl shadow-lg border ${styles.border}`}>
                <h3 className={`text-xl font-bold ${styles.textPrimary} mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('progressChart')}
                </h3>

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
                                    formatter={(value) => `${currency}${formatCurrency(value)}`}
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
                                    dataKey="profit"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    name={t('profit')}
                                    dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="goal"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    name={t('goal')}
                                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Statistics, Alerts & Comparisons */}
            <div className="grid grid-cols-1 gap-6">

            </div>

            {/* Yearly Monthly Overview - Premium Grid Design */}
            <div className={`${styles.bgCard} p-6 rounded-2xl shadow-xl border ${styles.border} mt-8 backdrop-blur-sm relative overflow-hidden group`}>
                {/* Background Accent */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors duration-700"></div>

                <div className={`flex justify-between items-center mb-8 relative z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div>
                        <h3 className={`text-xl md:text-2xl font-black ${styles.textPrimary} tracking-tight`}>
                            {lang === 'he' ? 'סקירת יעדים שנתית' : 'Annual Goals Overview'}
                        </h3>
                        <p className={`${styles.textSecondary} text-xs mt-1 font-bold opacity-60 uppercase tracking-widest`}>
                            {selectedDate.getFullYear()} • {lang === 'he' ? 'סיכום ביצועים' : 'Performance Summary'}
                        </p>
                    </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
                    {Array.from({ length: 12 }, (_, monthIndex) => {
                        const currentYear = selectedDate.getFullYear();
                        const currentMonth = new Date().getMonth();
                        const currentYearNow = new Date().getFullYear();
                        const isFutureMonth = currentYear === currentYearNow && monthIndex > currentMonth;

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
                        const isCurrentMonth = monthIndex === currentMonth && currentYear === currentYearNow;
                        const monthlyGoal = goals.monthly || 0; // Show goal for ALL months, not just current
                        const isCompleted = monthlyGoal > 0 ? (netMonthlyProfit >= monthlyGoal) : (netMonthlyProfit > 0);
                        const rawProgress = monthlyGoal > 0 ? (netMonthlyProfit / monthlyGoal) * 100 : (netMonthlyProfit > 0 ? 100 : 0);
                        const progress = Math.min(Math.round(rawProgress), 100);

                        const monthNames = lang === 'he'
                            ? ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
                            : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

                        return (
                            <div
                                key={monthIndex}
                                className={`group/card p-5 rounded-2xl border transition-all duration-300 relative ${isFutureMonth ? 'opacity-40 grayscale-[0.5]' : 'hover:shadow-lg hover:shadow-blue-500/5'
                                    } ${isCurrentMonth ? 'bg-blue-500/5 border-blue-500/30' : `${styles.bgCard} ${styles.border} hover:border-slate-500`
                                    }`}
                            >
                                <div className={`flex justify-between items-start mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isCurrentMonth ? 'text-blue-400' : styles.textSecondary}`}>
                                        {monthNames[monthIndex]}
                                    </span>
                                    <span className={`text-xs font-black ${isCompleted ? 'text-emerald-500' : isFutureMonth ? 'text-slate-600' : 'text-blue-500'}`}>
                                        {monthlyGoal > 0 ? `${progress}%` : (netMonthlyProfit > 0 ? '100%' : '0%')}
                                    </span>
                                </div>

                                {/* Slim Progress Bar */}
                                <div className="w-full h-1.5 bg-slate-900/50 rounded-full overflow-hidden mb-5">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out rounded-full ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                                            }`}
                                        style={{ width: `${isFutureMonth ? 0 : progress}%` }}
                                    />
                                </div>

                                {showMonthlyAmounts && (
                                    <div className={`flex items-center gap-3 text-xs mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${netMonthlyProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`}></span>
                                            <span className={`font-bold ${netMonthlyProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {currency}{formatCompactNumber(netMonthlyProfit)}
                                            </span>
                                        </div>

                                        <span className="text-slate-600 font-bold">/</span>

                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                                            <span className="font-bold text-slate-300">
                                                {currency}{formatCompactNumber(monthlyGoal)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
};

export default GoalsView;
