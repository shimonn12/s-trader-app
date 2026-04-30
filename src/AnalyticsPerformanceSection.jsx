import React, { useMemo, useState } from "react";

/* ------------------------ helpers ------------------------ */
function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function formatPercent(n) {
    const val = safeNum(n);
    return `${val.toFixed(1)}%`;
}

function formatMoney(n, symbol = "$") {
    const val = safeNum(n);
    const sign = val >= 0 ? "+" : "-";
    const abs = Math.abs(val);
    return `${sign}${symbol}${abs.toLocaleString()}`;
}

function getKey(obj, candidates) {
    if (!obj) return null;
    for (const k of candidates) {
        if (obj[k] !== undefined && obj[k] !== null) return k;
    }
    return null;
}

function normalizeAggRows(rows) {
    return Array.isArray(rows) ? rows : [];
}

function pickBestFromAgg(rows, options = {}) {
    const {
        labelKeys = ["name", "label", "title", "strategy", "day", "hour", "Strategy", "Day", "Hour"],
        plKeys = ["totalPL", "totalPl", "pnl", "Pnl", "pl", "PL", "profit", "Profit", "profitLoss", "profit_loss"],
        tradesKeys = ["trades", "Trades", "count", "Count", "numTrades", "tradeCount"],
        winKeys = ["winRate", "WinRate", "win_rate", "wr", "WR"],
        minTrades = 1,
    } = options;

    const safeRows = normalizeAggRows(rows);
    if (safeRows.length === 0) return null;

    const labelKey = getKey(safeRows[0], labelKeys);
    const plKey = getKey(safeRows[0], plKeys);
    const tradesKey = getKey(safeRows[0], tradesKeys);
    const winKey = getKey(safeRows[0], winKeys);

    if (!labelKey || !plKey || !tradesKey) return null;

    const filtered = safeRows.filter((r) => safeNum(r[tradesKey]) >= minTrades);
    if (filtered.length === 0) return null;

    let best = null;
    for (const r of filtered) {
        const totalPL = safeNum(r[plKey]);
        const winRate = winKey ? safeNum(r[winKey]) : 0;

        // Select by highest Total P/L (most profitable)
        if (!best || totalPL > best.totalPL) {
            best = {
                label: String(r[labelKey]),
                totalPL,
                trades: safeNum(r[tradesKey]),
                winRate: winRate,
            };
        }
    }
    return best;
}

function buildBestHourFromTrades(trades, minTrades = 1) {
    if (!Array.isArray(trades) || trades.length === 0) return null;

    const t0 = trades[0] || {};
    const timeKey = getKey(t0, ["date", "Date", "time", "Time", "timestamp", "createdAt", "entryTime", "openTime"]);
    const plKey = getKey(t0, ["pnl", "Pnl", "pl", "PL", "profit", "Profit", "profitLoss", "profit_loss", "totalPL"]);

    if (!timeKey || !plKey) return null;

    const map = new Map(); // hour -> { trades, wins, totalPL }
    for (const tr of trades) {
        const pl = safeNum(tr[plKey]);

        let d = null;
        const raw = tr[timeKey];
        if (raw instanceof Date) d = raw;
        else if (typeof raw === "number") d = new Date(raw);
        else if (typeof raw === "string") {
            const parsed = new Date(raw);
            if (!isNaN(parsed.getTime())) d = parsed;
        }
        if (!d) continue;

        const hour = d.getHours();
        if (!map.has(hour)) map.set(hour, { hour, trades: 0, wins: 0, totalPL: 0 });
        const obj = map.get(hour);

        obj.trades += 1;
        obj.totalPL += pl;
        if (pl > 0) obj.wins += 1;
    }

    const rows = Array.from(map.values()).filter((x) => x.trades >= minTrades);
    if (rows.length === 0) return null;

    // Select by highest Total P/L (most profitable)
    let best = rows[0];
    for (const r of rows) {
        if (r.totalPL > best.totalPL) best = r;
    }

    return {
        label: `${String(best.hour).padStart(2, "0")}:00-${String((best.hour + 1) % 24).padStart(2, "0")}:00`,
        totalPL: best.totalPL,
        trades: best.trades,
        winRate: best.trades ? (best.wins / best.trades) * 100 : 0,
    };
}

/* ------------------------ UI atoms ------------------------ */
function SegButton({ active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all",
                active
                    ? "bg-blue-600 text-white border-blue-500 shadow"
                    : "bg-transparent text-slate-200 border-slate-700 hover:bg-slate-700/30",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

function BestCard({ icon, title, main, sub, empty }) {
    return (
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 rounded-2xl border border-slate-700/70 shadow-lg px-5 md:px-6 py-5 flex items-center gap-4 min-h-[130px] hover:shadow-xl hover:border-slate-600/80 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900/70 to-slate-900/50 border border-slate-700 flex items-center justify-center text-slate-200 text-xl flex-shrink-0">
                {icon}
            </div>

            <div className="flex-1 min-w-0 flex flex-col h-full">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-2">
                    {title}
                </div>

                {empty ? (
                    <div className="flex flex-col justify-center flex-1">
                        <div className="text-xl font-extrabold text-slate-100">—</div>
                        <div className="text-[11px] text-slate-400 italic mt-1">Not enough data</div>
                    </div>
                ) : (
                    <>
                        <div className="min-h-[44px] flex flex-col justify-center mb-2">
                            <div className="text-lg md:text-xl font-extrabold text-slate-100 leading-tight line-clamp-2">{main}</div>
                        </div>

                        <div className="mt-auto flex flex-col gap-1.5">
                            {sub && sub.includes('%') ? (
                                <>
                                    <div>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                                            <span className="text-emerald-400 font-black text-[10px] whitespace-nowrap">{sub.split('•')[0].trim()}</span>
                                        </span>
                                    </div>
                                    {sub.includes('•') && (
                                        <div className="text-slate-500 text-[9px] font-black uppercase tracking-wider opacity-80 pl-1">
                                            {sub.split('•')[1].trim()}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-[10px] text-slate-400">{sub}</div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function WinRateBar({ value }) {
    const v = Math.max(0, Math.min(100, safeNum(value)));
    const fillClass = v >= 50 ? "bg-emerald-500" : "bg-blue-500";

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-[200px] h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                <div className={`h-full ${fillClass} rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]`} style={{ width: `${v}%` }} />
            </div>
            <div className="text-[11px] font-black text-emerald-400 tracking-tighter">{formatPercent(v)}</div>
        </div>
    );
}

function PerformanceTable({ rows, title, minTrades = 1, currencySymbol = "$", t = (key) => key }) {
    const safeRows = normalizeAggRows(rows);
    const r0 = safeRows[0] || {};

    const nameKey = getKey(r0, ["name", "label", "title", "strategy", "day", "hour", "Strategy", "Day", "Hour"]);
    const winKey = getKey(r0, ["winRate", "WinRate", "win_rate", "wr", "WR"]);
    const tradesKey = getKey(r0, ["trades", "Trades", "count", "Count", "numTrades", "tradeCount"]);
    const plKey = getKey(r0, ["totalPL", "totalPl", "pnl", "Pnl", "pl", "PL", "profit", "Profit"]);

    const filtered = safeRows
        .map((r) => ({
            name: nameKey ? String(r[nameKey]) : "",
            winRate: winKey ? safeNum(r[winKey]) : 0,
            trades: tradesKey ? safeNum(r[tradesKey]) : 0,
            pnl: plKey ? safeNum(r[plKey]) : 0,
        }))
        .filter((r) => r.trades >= minTrades);

    return (
        <div className="bg-slate-900/30 rounded-2xl border border-slate-700/70 overflow-hidden">
            {/* inner header */}
            <div className="px-6 py-4 border-b border-slate-700/70">
                <div className="text-[12px] font-extrabold uppercase tracking-wider text-slate-300">
                    {title}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-950/20 text-slate-400 text-[12px] uppercase font-extrabold">
                        <tr>
                            <th className="px-6 py-4 w-[45%] whitespace-nowrap">{t('col_name') || 'Name'}</th>
                            <th className="px-6 py-4 text-center w-[25%] whitespace-nowrap">{t('stat_winrate') || 'Win Rate'}</th>
                            <th className="px-6 py-4 text-center w-[15%] whitespace-nowrap">{t('stat_trades') || 'Trades'}</th>
                            <th className="px-6 py-4 text-right w-[15%] whitespace-nowrap">{t('stat_pnl') || 'Total P/L'}</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-700/70">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-slate-400">
                                    {t('noData') || 'Not enough data'}
                                </td>
                            </tr>
                        ) : (
                            filtered.map((r, idx) => (
                                <tr key={`${r.name}-${idx}`} className="hover:bg-slate-700/15 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="font-extrabold text-slate-100 whitespace-nowrap">
                                                {t(r.name) || r.name}
                                                {idx === 0 && <span className="text-yellow-400 ml-2">★</span>}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 text-center">
                                        <WinRateBar value={r.winRate} />
                                    </td>

                                    <td className="px-6 py-5 text-center text-slate-200 font-bold">
                                        {r.trades}
                                    </td>

                                    <td
                                        className={[
                                            "px-6 py-5 text-right font-extrabold",
                                            r.pnl >= 0 ? "text-emerald-400" : "text-rose-400",
                                        ].join(" ")}
                                    >
                                        <span className="inline-flex items-center justify-end gap-1">
                                            <span>{r.pnl >= 0 ? "+" : "-"}</span>
                                            <span>{currencySymbol}{Math.abs(r.pnl).toLocaleString()}</span>
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ------------------------ main component ------------------------ */
export default function AnalyticsPerformanceSection({
    analyticsStats,
    filteredTrades,
    defaultView = "strategy",
    minTrades = 2,
    currencySymbol = "$",
    t = (key) => key, // translation function
}) {
    const [view, setView] = useState(defaultView); // strategy | day | hour

    const strategyRows = analyticsStats?.strategyData || analyticsStats?.strategyRows || [];
    const dayRows = analyticsStats?.dayData || analyticsStats?.dayRows || [];
    const hourRows = analyticsStats?.hourData || analyticsStats?.hourRows || [];

    const bestStrategy = useMemo(
        () => pickBestFromAgg(strategyRows, { minTrades }),
        [strategyRows, minTrades]
    );

    const bestDay = useMemo(
        () => pickBestFromAgg(dayRows, { minTrades }),
        [dayRows, minTrades]
    );

    const bestHour = useMemo(() => {
        const fromAgg = pickBestFromAgg(hourRows, {
            labelKeys: ["hour", "Hour", "name", "label", "title"],
            minTrades,
        });
        if (fromAgg) return fromAgg;

        // fallback: compute from trades
        return buildBestHourFromTrades(filteredTrades || analyticsStats?.trades || [], minTrades);
    }, [hourRows, filteredTrades, analyticsStats, minTrades]);

    const rows =
        view === "strategy" ? strategyRows : view === "day" ? dayRows : hourRows;

    const tableTitle =
        view === "strategy"
            ? t('strategyPerf')
            : view === "day"
                ? t('dayPerf')
                : t('hourPerf');

    return (
        <div className="space-y-5">
            {/* BEST cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BestCard
                    icon="🎯"
                    title={t('cat_strategy')}
                    empty={!bestStrategy}
                    main={bestStrategy?.label}
                    sub={
                        bestStrategy
                            ? `${bestStrategy.winRate != null ? `${formatPercent(bestStrategy.winRate)} ${t('stat_winrate')} • ` : ""}${bestStrategy.trades} ${t('stat_trades')}`
                            : ""
                    }
                />

                <BestCard
                    icon="🗓️"
                    title={t('cat_day')}
                    empty={!bestDay}
                    main={bestDay ? (t(bestDay.label) || bestDay.label) : null}
                    sub={
                        bestDay
                            ? `${bestDay.winRate != null ? `${formatPercent(bestDay.winRate)} ${t('stat_winrate')} • ` : ""}${bestDay.trades} ${t('stat_trades')}`
                            : ""
                    }
                />

                <BestCard
                    icon="🕒"
                    title={t('cat_hour')}
                    empty={!bestHour}
                    main={bestHour?.label}
                    sub={
                        bestHour
                            ? `${bestHour.winRate != null ? `${formatPercent(bestHour.winRate)} ${t('stat_winrate')} • ` : ""}${bestHour.trades} ${t('stat_trades')}`
                            : ""
                    }
                />
            </div>

            {/* Performance table card */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/70 shadow-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="text-lg font-black text-slate-100 text-left">
                        {t('performanceTable')}
                    </div>

                    <div className="flex items-center justify-start gap-2 bg-slate-950/40 border border-slate-700/50 rounded-xl p-1.5 self-start sm:self-auto shadow-inner">
                        <SegButton active={view === "strategy"} onClick={() => setView("strategy")}>
                            {t('col_strategy')}
                        </SegButton>
                        <SegButton active={view === "day"} onClick={() => setView("day")}>
                            {t('col_day')}
                        </SegButton>
                        <SegButton active={view === "hour"} onClick={() => setView("hour")}>
                            {t('col_hour')}
                        </SegButton>
                    </div>
                </div>

                <PerformanceTable
                    rows={rows}
                    title={tableTitle}
                    minTrades={minTrades}
                    currencySymbol={currencySymbol}
                    t={t}
                />
            </div>
        </div>
    );
}
