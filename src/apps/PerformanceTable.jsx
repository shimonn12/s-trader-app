import React, { useState } from 'react';
import { Target, Table as TableIcon } from 'lucide-react';

// --- Helper Functions ---
const formatNumber = (num, decimals = 2) => {
    const n = Number(num);
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

const formatCompactNumber = (number) => {
    const n = Number(number);
    if (!Number.isFinite(n) || n === 0) return "0";
    return Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(n);
};

const PerformanceTable = ({ analyticsStats, currencySymbol = '$', t = (s) => s, lang = 'he', styles }) => {
    const [viewMode, setViewMode] = useState('strategy'); // strategy | day | hour

    if (!analyticsStats) return null;

    // Data Selection
    const activeData = viewMode === 'strategy' ? analyticsStats.strategyData
        : viewMode === 'day' ? analyticsStats.dayData
            : analyticsStats.hourData;

    const tabs = [
        { id: 'strategy', label: t('strategy') },
        { id: 'day', label: t('day') },
        { id: 'hour', label: t('hour') }
    ];

    const getModeLabel = () => {
        if (viewMode === 'strategy') return t('strategyMode');
        if (viewMode === 'day') return t('dayMode');
        return t('hourMode');
    };

    // Forced LTR layout but with Hebrew labels
    const isRTL = false;

    return (
        <div className="font-sans w-full" dir="ltr">
            {/* Main Outer Container */}
            <div className="bg-[#0f172a] border border-slate-800/80 shadow-[0_40px_80px_rgba(0,0,0,0.7)] rounded-[2rem] p-4 md:p-6">

                {/* header: Title + Tabs */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center items-start gap-6 mb-6 px-4 pt-1">
                    <h2 className="text-[13px] font-bold text-white tracking-widest uppercase opacity-90">
                        {t('performanceTable')}
                    </h2>

                    <div className="bg-[#0a0f1d] p-1 rounded-xl border border-slate-800 shadow-2xl">
                        <div className="flex gap-1.5">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setViewMode(tab.id)}
                                    className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all duration-300 text-center
                                      ${viewMode === tab.id
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-white bg-transparent border border-slate-700/30 hover:bg-slate-800/50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Inner Bordered Section */}
                <div className="bg-[#0a0f1d]/40 border border-slate-800/50 rounded-[2rem] overflow-hidden shadow-inner">

                    {/* Internal Section Title */}
                    <div className="px-10 pt-8 pb-4 bg-slate-900/10 text-left">
                        <h3 className="text-[13px] font-bold text-slate-400 tracking-normal uppercase opacity-90">
                            {getModeLabel()}
                        </h3>
                    </div>

                    {/* The Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-[#090e1a]/80">
                                <tr className="text-[13px] uppercase font-black text-slate-200 tracking-normal border-b border-slate-800/50 text-left">
                                    <th className="px-10 py-5">{t('name')}</th>
                                    <th className="px-10 py-5 whitespace-nowrap">{t('winRate')}</th>
                                    <th className="px-10 py-5 text-center">{t('trades')}</th>
                                    <th className="px-10 py-5 text-right">{t('pnl_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {activeData && activeData.length > 0 ? (
                                    activeData.map((row, index) => (
                                        <tr key={index} className="transition-all hover:bg-slate-800/20 group">
                                            {/* Name */}
                                            <td className="px-10 py-6 font-black text-[14px] text-white text-left whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {row.displayName || row.name}
                                                    {index === 0 && <span className="text-yellow-500 text-xl drop-shadow-[0_0_15px_rgba(234,179,8,0.7)]">★</span>}
                                                </div>
                                            </td>

                                            {/* Win Rate with Thick Bar */}
                                            <td className="px-10 py-6 text-center">
                                                <div className="flex flex-col items-center gap-2 w-full max-w-[140px] mx-auto">
                                                    <div className="w-full h-2.5 bg-[#090e1a] rounded-full overflow-hidden shadow-inner border border-slate-800/60 relative">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${row.winRate >= 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                                                            style={{ width: `${row.winRate}%`, boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
                                                        />
                                                    </div>
                                                    <span className={`text-[12px] font-black tracking-widest ${row.winRate >= 50 ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                        {row.winRate.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Trades */}
                                            <td className="px-10 py-6 text-center text-[14px] font-black text-slate-200">
                                                {row.count}
                                            </td>

                                            {/* Total P/L */}
                                            <td className={`px-10 py-6 font-black text-[14px] text-right ${row.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {row.pnl >= 0 ? '+' : ''}{currencySymbol}{formatNumber(row.pnl)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-10 py-32 text-center text-slate-600 font-bold text-xl italic tracking-widest opacity-40">
                                            {t("noData")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceTable;
