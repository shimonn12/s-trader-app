import React from 'react';
import { Target, Calendar, Clock } from 'lucide-react';
import PerformanceTable from './PerformanceTable';

// --- 1. Insight Card Component (Expanded Design) ---
const InsightCard = ({ title, data, emoji, styles, t, colorClass = "text-blue-400" }) => {
    const hasData = data && data.count > 0;

    return (
        <div className={`${styles.bgCard} relative overflow-hidden rounded-2xl pt-4 pb-5 px-5 md:px-6 border ${styles.border} shadow-2xl transition-all duration-500`}>
            {/* Background Glow Effect */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-10 transition-all duration-500 ${colorClass === 'text-rose-400' ? 'bg-rose-500' : colorClass === 'text-blue-400' ? 'bg-blue-500' : 'bg-slate-500'}`} />

            <div className="flex items-center gap-4 relative z-10">
                {/* Icon Box Container - Optimized Size */}
                <div className={`w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-700/50 flex items-center justify-center flex-shrink-0 shadow-inner transition-transform duration-500`}>
                    <span className="text-2xl">{emoji}</span>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-normal mb-2 opacity-100 leading-none">
                        {title}
                    </p>

                    {/* Main Value Container with Fixed Min Height for Alignment */}
                    <div className="min-h-[48px] flex flex-col justify-center mb-2">
                        <h3 className={`text-lg md:text-xl font-black ${styles.textPrimary} leading-tight tracking-tight break-words line-clamp-2`}>
                            {hasData ? (data.displayName || data.name) : '-'}
                        </h3>
                    </div>

                    {/* Stats Section - Forced to Bottom for alignment */}
                    {hasData && (
                        <div className="flex flex-col gap-1.5 mt-auto">
                            <div>
                                <div className="inline-flex bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1 shadow-sm">
                                    <span className="text-[10px] font-black text-emerald-400 whitespace-nowrap tracking-wide">
                                        {data.winRate.toFixed(1)}% {t('stat_winrate')}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[9px] font-black text-slate-500 tracking-wider uppercase opacity-80 pl-1">
                                {data.count} {t('stat_trades')}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Performance Breakdown Section Wrapper ---
const AnalyticsPerformanceSection = ({
    analyticsStats,
    currencySymbol = '$',
    styles,
    t = (s) => s,
    lang = 'he',
    isRTL = false
}) => {
    const bestStrat = analyticsStats.strategyData?.[0] || {};
    const bestDay = analyticsStats.dayData?.[0] || {};
    const bestHour = [...(analyticsStats.hourData || [])].sort((a, b) => b.pnl - a.pnl)[0] || {};

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Top Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InsightCard
                    title={t('bestStrategy')}
                    data={bestStrat}
                    emoji="🎯"
                    styles={styles}
                    t={t}
                    colorClass="text-rose-400"
                />
                <InsightCard
                    title={t('bestDay')}
                    data={bestDay}
                    emoji="📅"
                    styles={styles}
                    t={t}
                    colorClass="text-blue-400"
                />
                <InsightCard
                    title={t('bestHour')}
                    data={bestHour}
                    emoji="🕒"
                    styles={styles}
                    t={t}
                    colorClass="text-slate-300"
                />
            </div>

            {/* Performance Table Section - Single Tabbed Table (Stocks Style) */}
            <div className="mt-10">
                <PerformanceTable
                    analyticsStats={analyticsStats}
                    currencySymbol={currencySymbol}
                    t={t}
                    styles={styles}
                    lang={lang}
                />
            </div>
        </div>
    );
};

export default AnalyticsPerformanceSection;
