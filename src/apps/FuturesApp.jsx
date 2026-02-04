import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    Plus,
    Trash2,
    Edit2,
    TrendingUp,
    TrendingDown,
    Target,
    DollarSign,
    Save,
    X,
    PieChart as PieIcon,
    List,
    Calendar as CalendarIcon,
    Languages,
    Activity,
    Filter,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    BarChart2,
    Image as ImageIcon,
    Upload,
    Grid,
    Maximize2,
    StickyNote,
    Settings,
    LogOut,
    Trophy,
    Table as TableIcon,
    Coins,
    Camera,
    CheckCircle,
    Phone,
    Mail,
    User,
    Lock,
    Eye,
    EyeOff,
    Download,
    Upload as UploadIcon,
} from "lucide-react";
import AnalyticsView from "./AnalyticsView";
import GoalsView from "./GoalsView";
import { saveUserData, loadUserData, subscribeToUserData } from "../firebaseConfig";

/** =========================
 * CONST / HELPERS
 * ========================= */
const MIN_TRADES_FOR_STATS = 2;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const formatNumber = (num, decimals = 2) => {
    const n = Number(num);
    if (!Number.isFinite(n)) return "0.00";
    const absNum = Math.abs(n);

    // If number is large (over 1 million), use compact notation to avoid UI overflow
    if (absNum >= 1000000) {
        return formatCompactNumber(n);
    }

    return n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

// Helper for comma separated input
const formatNumberWithCommas = (value) => {
    if (value === undefined || value === null || value === '') return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const parseNumberFromCommas = (value) => {
    if (value === undefined || value === null || value === '') return '';
    let str = value.toString().toLowerCase().replace(/,/g, '').trim();

    // Handle shortcuts like K, M, B, T
    const lastChar = str.slice(-1);
    const numericPart = parseFloat(str.slice(0, -1));

    if (!isNaN(numericPart)) {
        if (lastChar === 'k') return (numericPart * 1000).toString();
        if (lastChar === 'm') return (numericPart * 1000000).toString();
        if (lastChar === 'b') return (numericPart * 1000000000).toString();
        if (lastChar === 't') return (numericPart * 1000000000000).toString();
    }

    return str.replace(/[^0-9.]/g, '');
};

const formatR = (num) => {
    const n = Number(num);
    if (!Number.isFinite(n)) return "0R";
    return n.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }) + "R";
};

const formatCompactNumber = (number) => {
    const n = Number(number);
    if (!Number.isFinite(n) || n === 0) return "0";
    return Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(n);
};

const formatCompactCalendar = (num) => {
    const absNum = Math.abs(num);
    if (absNum >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (absNum >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toFixed(0);
};

const getDayOfWeekKey = (dateString) => {
    const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ];
    return days[new Date(dateString).getDay()];
};

const getHourBucket = (timeString) => {
    if (!timeString) return "Unknown";
    const parts = timeString.split(":");
    const hour = parseInt(parts[0], 10);
    if (Number.isNaN(hour)) return "Unknown";
    // Fixed syntax error by using string concatenation instead of template literals
    return hour + ":00 - " + (hour + 1) + ":00";
};

const toISODate = (d) => {
    try {
        return new Date(d).toISOString().split("T")[0];
    } catch {
        return "";
    }
};

const getThemeStyles = (theme) => {
    if (theme === "light") {
        return {
            bgMain: "bg-gray-100",
            bgCard: "bg-white",
            bgHeader: "bg-white",
            textPrimary: "text-gray-900",
            textSecondary: "text-gray-500",
            border: "border-gray-200",
            inputBg: "bg-gray-50",
            hoverBg: "hover:bg-gray-100",
            shadow: "shadow-sm",
        };
    }
    return {
        bgMain: "bg-[#0f172a]",
        bgCard: "bg-slate-800",
        bgHeader: "bg-[#1e293b]",
        textPrimary: "text-slate-100",
        textSecondary: "text-slate-400",
        border: "border-slate-700",
        inputBg: "bg-slate-900",
        hoverBg: "hover:bg-slate-700/40",
        shadow: "shadow-lg",
    };
};

const getWeekStart = (date, weekStartsOnSunday = true) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = weekStartsOnSunday ? day : (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getWeekEnd = (weekStartDate) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
};

const isBetweenInclusive = (d, start, end) => {
    const x = new Date(d).getTime();
    return x >= new Date(start).getTime() && x <= new Date(end).getTime();
};

/** =========================
 * FUTURES DEFAULTS
 * ========================= */

/** Contract Specifications - Point Values */
const CONTRACT_SPECS = {
    ES: { mini: 50, micro: 5 },  // E-mini S&P 500
    NQ: { mini: 20, micro: 2 },  // E-mini NASDAQ-100
    YM: { mini: 5, micro: 0.5 },  // E-mini Dow
    RTY: { mini: 50, micro: 5 },  // E-mini Russell 2000
    GC: { mini: 100, micro: 10 },  // Gold
    CL: { mini: 1000, micro: 100 }, // Crude Oil
    SI: { mini: 5000, micro: 500 }, // Silver
    NG: { mini: 10000, micro: 1000 }, // Natural Gas
};

const getAutoPointValue = (symbol, contractType) => {
    if (!symbol || !contractType) return "";
    const normalized = symbol.trim().toUpperCase();
    const spec = CONTRACT_SPECS[normalized];
    if (!spec) return ""; // Symbol not found
    return spec[contractType] || "";
};

/** =========================
 * FUTURES METRICS
 * ========================= */
const calculateFuturesMetrics = (trade) => {
    const entry = parseFloat(parseNumberFromCommas(trade.entryPrice.toString()));
    const exit = parseFloat(parseNumberFromCommas(trade.exitPrice.toString()));
    const contracts = parseFloat(parseNumberFromCommas(trade.contracts.toString()));
    const pointValue = parseFloat(parseNumberFromCommas(trade.pointValue.toString()));
    const fees = parseFloat(parseNumberFromCommas((trade.fees || 0).toString())) || 0;
    const stop = parseFloat(parseNumberFromCommas((trade.stopLoss || "").toString()));

    if (![entry, exit, contracts, pointValue].every((v) => Number.isFinite(v))) {
        return { pnl: 0, rMultiple: 0, rDisplay: "0.00R", totalRisk: 0 };
    }

    const isLong = trade.type === "Long";
    const grossPoints = isLong ? exit - entry : entry - exit;
    const grossPnl = grossPoints * contracts * pointValue;
    const netPnl = grossPnl - fees;

    const riskPoints = Number.isFinite(stop) ? Math.abs(entry - stop) : 0;
    const totalRisk = riskPoints * contracts * pointValue;

    let rMultiple = 0;
    if (totalRisk > 0) rMultiple = netPnl / totalRisk;

    return {
        pnl: Number(netPnl.toFixed(2)),
        totalRisk: Number(totalRisk.toFixed(2)),
        rMultiple: Number(rMultiple.toFixed(2)),
        rDisplay: `1:${Number(rMultiple.toFixed(2))}`,
    };
};

/** =========================
 * TRANSLATIONS
 * ========================= */
const TRANSLATIONS = {
    en: {
        appTitle: "S Trader",
        subtitle: "Trading & Capital Markets Education",
        loginTitle: "Login to Trading Journal",
        balance: "Balance",
        addTrade: "Add Trade",
        netPnl: "Net P/L",
        grossProfit: "Gross Profit",
        grossLoss: "Gross Loss",
        avgPnl: "Avg P/L",
        avgR: "Avg R",
        tradesCount: "Trades",
        startCap: "Starting Capital",
        winRate: "Win Rate",
        equity: "Portfolio Value",
        winsCount: "Wins",
        lossesCount: "Losses",
        tradeLog: "Trade Log",
        analytics: "Analytics",
        calendar: "Calendar",
        gallery: "Gallery",
        goalsTab: "Goals",
        mentalTab: "Mental",
        settings: "Settings",
        date: "Date",
        time: "Time",
        symbol: "Contract",
        type: "Side",
        position: "Position",
        strategy: "Strategy",
        pnl: "P/L",
        r: "R/R",
        contracts: "Contracts",
        pointValue: "Point Value",
        contractType: "Contract Type",
        micro: "Micro",
        mini: "Mini",
        session: "Session",
        timeframe: "Timeframe",
        entryPrice: "Entry",
        exitPrice: "Exit",
        stopLoss: "Stop",
        fees: "Fees",
        notes: "Notes",
        tags: "Tags",
        screenshot: "Screenshot",
        uploadImage: "Upload / Image URL",
        tradeNumber: "Trade #",
        actions: "Actions",
        noTrades: "No trades found for this period.",
        noImages: "No screenshots yet.",
        equityCurve: "P&L Chart",
        equityCurvePercent: "Equity Growth (%)",
        chartStart: "Start",
        sunday: "Sunday",
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        bestStrategy: "Strongest Strategy",
        bestDay: "Strongest Day",
        bestHour: "Strongest Hour",
        performanceTable: "Performance Table",
        strategyMode: "STRATEGY PERFORMANCE",
        dayMode: "DAY PERFORMANCE",
        hourMode: "HOURLY PERFORMANCE",
        day: "Day",
        hour: "Time",
        name: "Name",
        trades: "Trades",
        pnl_label: "P/L",
        cancel: "Cancel",
        save: "Save",
        update: "Update",
        editTrade: "Edit Trade",
        newTrade: "New Trade",
        deleteConfirm: "Delete this trade permanently?",
        deleteTradeTitle: "Delete this trade permanently?",
        deleteTradeWarning: "This action will permanently delete the trade and cannot be undone.",
        delete: "Delete",
        theme: "Theme",
        themeDark: "Dark / Pro",
        themeLight: "Light / Clean",
        logout: "Logout",
        logoutTitle: "Are you sure you want to logout?",
        logoutWarning: "You can log back in anytime.",
        yes: "Yes",
        no: "No",
        username: "Username",
        password: "Password",
        loginBtn: "Enter Journal",
        registerBtn: "Register",
        registerTitle: "Create Account",
        backToLogin: "Back to Login",
        shareWinTitle: "Winning Trade!",
        shareLossTitle: "Trade Review",
        downloadShareImage: "Use Screen Capture",
        chooseFile: "Choose File",
        max2mbLocal: "Max 2MB",
        stat_trades: "Trades",
        stat_winrate: "Win Rate",
        stat_pnl: "P/L",
        viewAll: "All Time",
        viewYear: "Yearly",
        viewMonth: "Monthly",
        viewWeek: "Weekly",
        viewDay: "Daily",
        goals_daily: "Daily Goal",
        goals_weekly: "Weekly Goal",
        goals_monthly: "Monthly Goal",
        goals_yearly: "Yearly Goal",
        goal_remaining: "Remaining",
        goal_done: "Done",
        backupData: "Backup / Export",
        restoreData: "Restore / Import",
        dataRestored: "Data restored successfully!",
        dataError: "Error restoring data.",
        language: "Language",
        currency: "Currency",
        close: "Close",
        tradingsJournal: "Trading Journal",
        journalSubtitle: "This is your way to jump forward",
        netPnlLabel: "NET P/L",
        portfolioValue: "PORTFOLIO VALUE",
        totalProfit: "TOTAL PROFITS",
        totalLoss: "TOTAL LOSSES",
        winningTrades: "WINNING TRADES",
        losingTrades: "LOSING TRADES",
        long: "Long",
        short: "Short",
        fullScreen: "Full Screen",
        shareSaveInstruction: "To save this image, please use your device's screenshot tool.",
        noNotes: "No notes.",
        selectedDate: "Selected Date",
        dailyPnl: "Daily P/L",
        calendarInstruction: "Click on a day in the calendar to view data",
        pnlLabel: "P/L",
        unknown: "Unknown",
        prev: "Previous",
        next: "Next",
        goalProgress: "Goal Progress",
        completed: "Completed",
        completion: "Completion",
        reset: "Reset",
        goalCompleted: "Goal Completed!",
        enterGoal: "Enter goal",
        updateGoal: "Update Goal",
        saveGoal: "Save Goal",
        periodSummary: "Period Summary",
        profitTrades: "WINNING TRADES",
        lossTrades: "LOSING TRADES",
        netProfitLabel: "TOTAL PROFITS",
        goal: "Goal",
        remaining: "Remaining",
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        yearly: "Yearly",
        progressChart: "Progress Chart",
        goalLegend: "Goal",
        profitLegend: "Profit",
        annualGoalsOverview: "Annual Goals Overview",
        performanceSummary: "PERFORMANCE SUMMARY",
        jan: "JANUARY", feb: "FEBRUARY", mar: "MARCH", apr: "APRIL", may: "MAY", jun: "JUNE",
        jul: "JULY", aug: "AUGUST", sep: "SEPTEMBER", oct: "OCTOBER", nov: "NOVEMBER", dec: "DECEMBER",
        darkTheme: "Dark / Pro",
        lightTheme: "Light / Clean",
        contactSupport: "Contact Support",
        select: "Select...",
        asia: "Asia",
        london: "London",
        ny: "New York",
        am: "AM",
        pm: "PM",
        tf_1s: "1s", tf_5s: "5s", tf_10s: "10s", tf_15s: "15s", tf_30s: "30s",
        tf_1m: "1m", tf_2m: "2m", tf_3m: "3m", tf_5m: "5m", tf_10m: "10m", tf_15m: "15m", tf_30m: "30m", tf_45m: "45m",
        tf_1H: "1H", tf_2H: "2H", tf_4H: "4H", tf_8H: "8H", tf_12H: "12H",
        tf_1D: "1D", tf_1W: "1W", tf_1M: "1M",
        tf_tick_tick: "Tick", // For manual addition or generic label
        winAbbr: "W",
        lossAbbr: "L",
        forgotPass: "Forgot Password?",
        noAccount: "Don't have an account?",
        recoverBtn: "Recover Account",
        phoneOrEmail: "Phone or Email",
        recoverWithPhone: "Authentication via Personal Code",
        recoverWithQuestion: "Authentication via Security Question",
        recoverWithAdmin: "Authentication via System Admin Code",
        enterPhone: "Enter phone number",
        enterCode: "Enter Verification Code",
        verifyBtn: "Verify & Proceed",
        newPass: "New Password",
        resetPass: "Reset Password",
        verifyNewPass: "Verify New Password",
        recoverySent: "Verification code sent to",
        chooseRecoveryMethod: "Choose authentication method for recovery",
        securityQuestionLabel: "Security Question:",
        securityQuestion1: "What was your first teacher's name?",
        securityQuestion2: "In which city were you born?",
        securityQuestion3: "What was the name of your first pet?",
        answerLabel: "Answer",
        enterAdminCode: "Enter admin code",
        mobilePhoneNumber: "Mobile Phone Number",
        adminCode: "Admin Code",
        passResetSuccess: "Password reset successfully!",
        details: "Details",
        phSymbolExample: "ES, NQ, YM...",
        phStrategy: "e.g. Breakout...",
        phImageUrl: "Paste image URL",
        phTradeNumber: "#",
        phTags: "tags...",
        noData: "Not enough data yet.",
        calStatsTitle: "Performance View",
        viewMonthlyStats: "Monthly Performance",
        viewWeeklyStats: "Weekly Performance",
        viewDailyStats: "Daily Performance",
        bestWeek: "Strongest Week",
        worstDay: "Worst Day",
        totalTrades: "Total Trades",
        entryParts: "Entry Parts",
        exitParts: "Exit Parts",
        addPart: "Add Part",
        totalQty: "Total Qty",
        weightedAvg: "Weighted Avg",
        multiEntry: "Multi-Entry",
        scaleOut: "Scale-Out",
        simple: "Simple",
        price: "Price",
        mental: "Mental State",
        mentalRed: "FOMO / Emotions took over",
        mentalGreen: "Followed my rules",
        mentalYellow: "Broke all rules",
        mentalStats: "Mental State Statistics",
        mentalDistribution: "Mental State Distribution",
        disciplinedTrades: "Disciplined Trades",
        emotionalTrades: "Emotional Trades",
        randomTrades: "Random Trades",
        avgPnlPerState: "Avg P/L per State"
    },
    he: {
        appTitle: "שמעון",
        subtitle: "לימודי מסחר ושוק ההון",
        loginTitle: "התחברות ליומן מסחר",
        balance: "יתרה",
        addTrade: "הוסף עסקה",
        netPnl: "רווח/הפסד נקי",
        grossProfit: "סה״כ רווח",
        grossLoss: "סה״כ הפסד",
        avgPnl: "ממוצע רווח/הפסד",
        avgR: "יחס סיכון/סיכוי",
        tradesCount: "מס׳ עסקאות",
        startCap: "הון התחלתי",
        winRate: "אחוזי הצלחה",
        equity: "שווי התיק",
        winsCount: "עסקאות מרוויחות",
        lossesCount: "עסקאות מפסידות",
        tradeLog: "יומן עסקאות",
        analytics: "ניתוחים",
        calendar: "לוח שנה",
        gallery: "גלריה",
        goalsTab: "יעדים",
        mentalTab: "מנטלי",
        settings: "הגדרות",
        date: "תאריך",
        time: "שעה",
        symbol: "חוזה",
        type: "כיוון",
        position: "פוזיציה",
        strategy: "אסטרטגיה",
        pnl: "רווח/הפסד",
        r: "סיכון:סיכוי",
        contracts: "מספר חוזים",
        pointValue: "שווי נקודה",
        contractType: "סוג חוזה",
        micro: "מיקרו",
        mini: "מיני",
        session: "סשן",
        timeframe: "אינטרוול זמן",
        entryPrice: "כניסה",
        exitPrice: "יציאה",
        stopLoss: "סטופ לוס",
        fees: "עמלות",
        notes: "הערות",
        tags: "תגיות",
        screenshot: "צילום מסך",
        uploadImage: "העלה תמונה / קישור",
        tradeNumber: "מספר עסקה",
        actions: "פעולות",
        noTrades: "לא נמצאו עסקאות לתקופה שנבחרה.",
        noImages: "אין תמונות של עסקאות עדיין",
        equityCurve: "גרף רווח והפסד",
        equityCurvePercent: "אחוז צמיחה (%)",
        chartStart: "התחלה",
        sunday: "ראשון",
        monday: "שני",
        tuesday: "שלישי",
        wednesday: "רביעי",
        thursday: "חמישי",
        friday: "שישי",
        saturday: "שבת",
        bestStrategy: "אסטרטגיה חזקה",
        bestDay: "יום חזק",
        bestHour: "שעה חזקה",
        performanceTable: "טבלת ביצועים",
        strategyMode: "ביצועי אסטרטגיה",
        dayMode: "ביצועים לפי ימים",
        hourMode: "ביצועים לפי שעות",
        day: "יום",
        hour: "שעה",
        name: "שם",
        trades: "עסקאות",
        pnl_label: "רווח/הפסד",
        cancel: "ביטול",
        save: "שמור",
        update: "עדכן",
        editTrade: "ערוך עסקה",
        newTrade: "עסקה חדשה",
        deleteConfirm: "האם למחוק את העסקה לצמיתות?",
        deleteTradeTitle: "האם למחוק את העסקה לצמיתות?",
        deleteTradeWarning: "פעולה זו תמחק את העסקה לצמיתות ולא ניתן יהיה לשחזר אותה",
        delete: "מחק",
        theme: "ערכת נושא",
        themeDark: "כהה / מקצועי",
        themeLight: "בהיר / נקי",
        logout: "התנתק",
        logoutTitle: "בטוח/ה שברצונך להתנתק?",
        logoutWarning: "ניתן להתחבר שוב בכל עת",
        yes: "כן",
        no: "לא",
        username: "שם משתמש",
        password: "סיסמה",
        loginBtn: "כנס ליומן",
        registerBtn: "הרשמה",
        registerTitle: "יצירת חשבון",
        backToLogin: "חזרה להתחברות",
        shareWinTitle: "עסקה מנצחת!",
        shareLossTitle: "ניתוח עסקה",
        downloadShareImage: "השתמש בצילום מסך",
        chooseFile: "בחר קובץ",
        max2mbLocal: "מקסימום 2MB",
        stat_trades: "עסקאות",
        stat_winrate: "אחוזי הצלחה",
        stat_pnl: "רווח/הפסד",
        viewAll: "כל הזמנים",
        viewYear: "שנתי",
        viewMonth: "חודשי",
        viewWeek: "שבועי",
        viewDay: "יומי",
        goals_daily: "יעד יומי",
        goals_weekly: "יעד שבועי",
        goals_monthly: "יעד חודשי",
        goals_yearly: "יעד שנתי",
        goal_remaining: "נשאר",
        goal_done: "הושלם",
        backupData: "שמור גיבוי (Backup)",
        restoreData: "טען נתונים (Restore)",
        dataRestored: "הנתונים שוחזרו בהצלחה!",
        dataError: "שגיאה בטעינת הקובץ.",
        language: "שפה",
        currency: "מטבע",
        close: "סגור",
        tradingsJournal: "יומן מסחר",
        journalSubtitle: "זו הדרך לקפיצה שלך קדימה",
        netPnlLabel: "רווח/הפסד נקי",
        portfolioValue: "שווי התיק",
        totalProfit: "סה״כ רווחים",
        totalLoss: "סה״כ הפסדים",
        winningTrades: "עסקאות מרוויחות",
        losingTrades: "עסקאות מפסידות",
        long: "לונג",
        short: "שורט",
        fullScreen: "מסך מלא",
        shareSaveInstruction: "כדי לשמור את התמונה, אנא השתמש בכלי צילום המסך של המכשיר שלך.",
        noNotes: "אין הערות.",
        selectedDate: "תאריך נבחר",
        dailyPnl: "רווח/הפסד יומי",
        calendarInstruction: "לחץ על יום בלוח השנה לצפייה בנתונים",
        pnlLabel: "רווח/הפסד",
        unknown: "לא ידוע",
        prev: "הקודם",
        next: "הבא",
        goalProgress: "התקדמות ליעד",
        completed: "הושלם",
        completion: "השלמה",
        reset: "אפס",
        goalCompleted: "!היעד הושלם",
        enterGoal: "הזן יעד",
        updateGoal: "עדכן יעד",
        saveGoal: "שמור יעד",
        periodSummary: "סיכום תקופה",
        profitTrades: "עסקאות מרוויחות",
        lossTrades: "עסקאות מפסידות",
        netProfitLabel: "סה״כ רווחים",
        goal: "יעד",
        remaining: "נשאר",
        daily: "יומי",
        weekly: "שבועי",
        monthly: "חודשי",
        yearly: "שנתי",
        progressChart: "גרף התקדמות",
        goalLegend: "יעד",
        profitLegend: "רווח",
        annualGoalsOverview: "סקירת יעדים שנתית",
        performanceSummary: "סיכום ביצועים",
        jan: "ינואר", feb: "פברואר", mar: "מרץ", apr: "אפריל", may: "מאי", jun: "יוני",
        jul: "יולי", aug: "אוגוסט", sep: "ספטמבר", oct: "אוקטובר", nov: "נובמבר", dec: "דצמבר",
        darkTheme: "כהה / מקצועי",
        lightTheme: "בהיר / נקי",
        asia: "אסיה",
        london: "לונדון",
        ny: "ניו-ורק",
        am: "AM",
        pm: "PM",
        tf_1s: "1 שנ׳", tf_5s: "5 שנ׳", tf_10s: "10 שנ׳", tf_15s: "15 שנ׳", tf_30s: "30 שנ׳",
        tf_1m: "1 דקה", tf_2m: "2 דקות", tf_3m: "3 דקות", tf_5m: "5 דקות", tf_10m: "10 דקות", tf_15m: "15 דקות", tf_30m: "30 דקות", tf_45m: "45 דקות",
        tf_1H: "1 שעה", tf_2H: "2 שעות", tf_4H: "4 שעות", tf_8H: "8 שעות", tf_12H: "12 שעות",
        tf_1D: "יומי", tf_1W: "שבועי", tf_1M: "חודשי",
        winAbbr: "W",
        lossAbbr: "L",
        forgotPass: "שכחתי סיסמה",
        noAccount: "אין לך חשבון?",
        recoverBtn: "שחזר חשבון",
        phoneOrEmail: "טלפון או מייל",
        recoverWithPhone: "אימות באמצעות קוד אישי",
        recoverWithQuestion: "אימות באמצעות שאלת אבטחה",
        recoverWithAdmin: "אימות באמצעות קוד מנהל מערכת",
        enterPhone: "הזן מספר טלפון נייד",
        enterCode: "הזן קוד אימות",
        verifyBtn: "אמת והמשך",
        newPass: "סיסמא חדשה",
        resetPass: "אפס סיסמא",
        verifyNewPass: "אימות סיסמה חדשה",
        recoverySent: "קוד אימות נשלח ל-",
        chooseRecoveryMethod: "בחר אמצעי אימות לשחזור",
        securityQuestionLabel: "שאלת אבטחה לשחזור חשבון:",
        securityQuestion1: "מה שם המורה הראשון/ה שלך?",
        securityQuestion2: "באיזו עיר נולדת?",
        securityQuestion3: "מה היה שם חיית המחמד הראשונה שלך?",
        answerLabel: "תשובה",
        enterAdminCode: "הזן קוד מנהל",
        calStatsTitle: "תצוגת ביצועים",
        viewMonthlyStats: "ביצועים חודשיים",
        viewWeeklyStats: "ביצועים שבועיים",
        viewDailyStats: "ביצועים יומיים",
        bestWeek: "השבוע הכי חזק",
        worstDay: "היום הכי פחות טוב",
        totalTrades: "סה״כ עסקאות",
        mobilePhoneNumber: "מספר טלפון נייד",
        adminCode: "קוד מנהל",
        passResetSuccess: "הסיסמה אופסה בהצלחה!",
        details: "פרטים",
        phSymbolExample: "ES, NQ...",
        phStrategy: "לדוגמה: Breakout...",
        phImageUrl: "קישור תמונה",
        phTradeNumber: "#",
        phTags: "תגיות...",
        noData: "אין מספיק נתונים עדיין.",
        entryParts: "כל חלקי הכניסה",
        exitParts: "כל חלקי היציאה",
        addPart: "הוסף שכבה",
        totalQty: "סה\"כ כמות",
        weightedAvg: "ממוצע משוקלל",
        multiEntry: "ריבוי כניסות",
        scaleOut: "יציאה בשלבים",
        simple: "רגיל",
        price: "מחיר",
        mental: "מצב מנטלי",
        mentalRed: "FOMO / רגש השתלט עלי",
        mentalGreen: "פעלתי לפי הכללים",
        mentalYellow: "חרגתי מהכללים",
        mentalStats: "סטטיסטיקות מצב מנטלי",
        mentalDistribution: "התפלגות מצב מנטלי",
        disciplinedTrades: "עסקאות משמעתיות",
        emotionalTrades: "עסקאות רגשיות",
        randomTrades: "עסקאות אקראיות",
        avgPnlPerState: "ממוצע רווח/הפסד למצב"
    },
};

/** =========================
 * AUTH (מתוקן ומותאם)
 * ========================= */
const AuthSystem = ({ onLogin, t, lang }) => {
    const isRTL = lang === "he";
    const [view, setView] = useState("login"); // login, register, forgot, verify, reset
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        phone: "",
        recoveryCode: "",
        newPassword: "",
        securityAnswer: "",
    });
    const [recoveryMethod, setRecoveryMethod] = useState("phone");
    const [selectedQuestion, setSelectedQuestion] = useState("q1");
    const [passwordError, setPasswordError] = useState(false);

    useEffect(() => {
        // load last username and password (if any)
        const remembered = localStorage.getItem("futuresAuth_remember") === "1";
        const lastUser = localStorage.getItem("futuresAuth_lastUser") || "";
        const lastPass = localStorage.getItem("futuresAuth_lastPass") || "";
        if (remembered && lastUser) {
            setRememberMe(true);
            setFormData((p) => ({ ...p, username: lastUser, password: lastPass }));
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const u = formData.username.trim();
        const p = formData.password.trim();

        if (!u && view !== "reset" && view !== "verify") return;

        if (view === "register") {
            // Validate all required fields
            if (!p || !formData.phone || !formData.securityAnswer || !formData.recoveryCode) {
                alert(lang === "he" ? "נא למלא את כל השדות" : "Please fill all fields");
                return;
            }

            // Save user registration data
            const userData = {
                username: u,
                password: p,
                phone: formData.phone,
                securityQuestion: selectedQuestion,
                securityAnswer: formData.securityAnswer,
                recoveryCode: formData.recoveryCode,
                registeredAt: new Date().toISOString()
            };

            localStorage.setItem(`futuresUser_${u}`, JSON.stringify(userData));

            alert(lang === "he" ? "נרשמת בהצלחה! כעת תוכל להתחבר" : "Registration successful! You can now login");
            setView("login");
            setFormData({ username: u, password: "", phone: "", recoveryCode: "", newPassword: "", securityAnswer: "" });
            return;
        }

        if (view === "login") {
            // Validate password is required
            if (!p) {
                setPasswordError(true);
                return;
            }
            setPasswordError(false);

            // Check if user exists and password matches
            const storedUserData = localStorage.getItem(`futuresUser_${u}`);

            if (!storedUserData) {
                alert(lang === "he" ? "משתמש לא קיים. נא להירשם תחילה" : "User does not exist. Please register first");
                return;
            }

            const userData = JSON.parse(storedUserData);

            if (userData.password !== p) {
                alert(lang === "he" ? "סיסמה שגויה" : "Incorrect password");
                setPasswordError(true);
                return;
            }

            // Login successful - save remember me preference
            if (rememberMe) {
                localStorage.setItem("futuresAuth_lastUser", u);
                localStorage.setItem("futuresAuth_lastPass", p);
                localStorage.setItem("futuresAuth_remember", "1");
            } else {
                localStorage.removeItem("futuresAuth_lastUser");
                localStorage.removeItem("futuresAuth_lastPass");
                localStorage.removeItem("futuresAuth_remember");
            }

            onLogin(u);
            return;
        }

        if (view === "forgot") setView("verify");
        else if (view === "verify") setView("reset");
        else if (view === "reset") {
            alert(t("passResetSuccess"));
            setView("login");
        }
    };

    const renderHeader = () => (
        <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                <BarChart2 className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t("appTitle")}</h1>
            <p className="text-emerald-400 font-bold tracking-wide">{t("subtitle")}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
            <div
                className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 relative overflow-hidden"
            // Force LTR for the card layout itself if you prefer inputs to be LTR always
            // but RTL text alignment for labels.
            // Based on user request, we usually keep LTR structure for inputs.
            >
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                {renderHeader()}

                {view === "login" && (
                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10" dir="ltr">
                        <h2 className="text-xl font-bold text-white text-center mb-6">
                            {t("loginTitle")}
                        </h2>

                        <div>
                            <input
                                type="text"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-600 text-left"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value })
                                }
                                placeholder={t("username")}
                            />
                        </div>

                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-600 text-left"
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (passwordError) setPasswordError(false);
                                    }}
                                    placeholder={t("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center mt-2 justify-end">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-sm transition-colors select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                />
                                {t("rememberMe")}
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-all mt-6 shadow-lg shadow-blue-500/20 text-md"
                        >
                            {t("loginBtn")}
                        </button>

                        {/* Bottom Links: Forgot Password (Left), Register (Right) */}
                        <div className="mt-6 flex justify-between items-center text-sm">
                            <button
                                type="button"
                                onClick={() => setView("forgot")}
                                className="text-slate-400 hover:text-slate-300 transition-colors"
                            >
                                {lang === "he" ? "שכחתי סיסמה?" : "Forgot Password?"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setView("register")}
                                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                            >
                                {t("registerBtn")}
                            </button>
                        </div>
                    </form>
                )}

                {view === "register" && (
                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10" dir="ltr">
                        <h2 className="text-xl font-bold text-white mb-6 text-center">
                            {t("registerTitle")}
                        </h2>

                        <div>
                            <input
                                type="text"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value })
                                }
                                placeholder={t("username")}
                                required
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                placeholder={t("password")}
                                required
                            />
                        </div>

                        <div>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={selectedQuestion}
                                onChange={(e) => setSelectedQuestion(e.target.value)}
                                required
                            >
                                <option value="" disabled>{lang === "he" ? "שאלת אבטחה" : "Security Question"}</option>
                                <option value="q1">{t("securityQuestion1")}</option>
                                <option value="q2">{t("securityQuestion2")}</option>
                                <option value="q3">{t("securityQuestion3")}</option>
                            </select>
                        </div>

                        <div>
                            <input
                                type="text"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.securityAnswer}
                                onChange={(e) =>
                                    setFormData({ ...formData, securityAnswer: e.target.value })
                                }
                                placeholder={lang === "he" ? "תשובה (זכור לשחזור עתידי)" : "Answer (remember for future recovery)"}
                                required
                            />
                        </div>

                        <div>
                            <input
                                type="tel"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                                placeholder={lang === "he" ? "מספר טלפון נייד" : "Mobile Phone Number"}
                                required
                            />
                        </div>

                        <div>
                            <input
                                type="text"
                                maxLength="4"
                                pattern="[0-9]{4}"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center text-lg tracking-widest"
                                value={formData.recoveryCode}
                                onChange={(e) =>
                                    setFormData({ ...formData, recoveryCode: e.target.value.replace(/\D/g, '') })
                                }
                                placeholder={lang === "he" ? "קוד אישי לשחזור (4 ספרות)" : "Personal recovery code (4 digits)"}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-all mt-4 shadow-lg"
                        >
                            {t("registerBtn")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("login")}
                            className="w-full text-slate-400 hover:text-white text-sm mt-4 transition-colors text-center block"
                        >
                            {t("backToLogin")}
                        </button>
                    </form>
                )}

                {/* Other views remain mostly similar, forcing LTR for input structure */}
                {view === "forgot" && (
                    <div className="space-y-4 relative z-10" dir="ltr">
                        <h2 className="text-xl font-bold text-white mb-6 text-center">
                            {lang === "he" ? "שחזור סיסמה" : "Recover Password"}
                        </h2>

                        <div className="space-y-4">
                            <select
                                value={recoveryMethod}
                                onChange={(e) => setRecoveryMethod(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'left 0.75rem center',
                                    backgroundSize: '1.5rem',
                                    paddingLeft: '2.5rem'
                                }}
                            >
                                <option value="" disabled>
                                    {lang === "he" ? "בחר שיטת אימות לשחזור" : "Choose authentication method for recovery"}
                                </option>
                                <option value="phone">
                                    {lang === "he" ? "אימות באמצעות קוד אישי" : "Authentication via Personal Code"}
                                </option>
                                <option value="security">
                                    {lang === "he" ? "אימות באמצעות שאלת אבטחה" : "Authentication via Security Question"}
                                </option>
                                <option value="admin">
                                    {lang === "he" ? "אימות באמצעות קוד מנהל מערכת" : "Authentication via System Admin Code"}
                                </option>
                            </select>
                        </div>

                        {recoveryMethod && recoveryMethod !== "" && (
                            <div className="space-y-4 mt-6">
                                <h2 className="text-xl font-bold text-white text-center mb-6">
                                    {recoveryMethod === "phone" && (lang === "he" ? "אימות באמצעות קוד אישי" : "Authentication via Personal Code")}
                                    {recoveryMethod === "security" && (lang === "he" ? "אימות באמצעות שאלת אבטחה" : "Authentication via Security Question")}
                                    {recoveryMethod === "admin" && (lang === "he" ? "אימות באמצעות קוד מנהל מערכת" : "Authentication via System Admin Code")}
                                </h2>

                                {/* Username field - always shown */}
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder={lang === "he" ? "שם משתמש" : "Username"}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />

                                {/* Personal Code */}
                                {recoveryMethod === "phone" && (
                                    <input
                                        type="text"
                                        maxLength="4"
                                        pattern="[0-9]{4}"
                                        value={formData.recoveryCode}
                                        onChange={(e) => setFormData({ ...formData, recoveryCode: e.target.value.replace(/\D/g, '') })}
                                        placeholder={lang === "he" ? "קוד אישי (4 ספרות)" : "Personal Code (4 digits)"}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center text-lg tracking-widest"
                                    />
                                )}

                                {/* Security Question */}
                                {recoveryMethod === "security" && (
                                    <>
                                        <select
                                            value={selectedQuestion}
                                            onChange={(e) => setSelectedQuestion(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="q1">{lang === "he" ? "מה היה שם המורה הראשון שלך?" : "What was your first teacher's name?"}</option>
                                            <option value="q2">{lang === "he" ? "באיזו עיר נולדת?" : "In which city were you born?"}</option>
                                            <option value="q3">{lang === "he" ? "מה היה שם חיית המחמד הראשונה שלך?" : "What was the name of your first pet?"}</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={formData.securityAnswer}
                                            onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                                            placeholder={lang === "he" ? "תשובה (זכור לשחזור עתידי)" : "Answer (remember for future recovery)"}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </>
                                )}

                                {/* Admin Code */}
                                {recoveryMethod === "admin" && (
                                    <input
                                        type="text"
                                        placeholder={lang === "he" ? "קוד מנהל מערכת" : "System Admin Code"}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                )}

                                <button
                                    onClick={handleSubmit}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg"
                                    type="button"
                                >
                                    {lang === "he" ? "שחזר סיסמה" : "Recover Password"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setView("login")}
                                    className="w-full text-slate-400 hover:text-blue-400 text-sm transition-colors text-center"
                                >
                                    {lang === "he" ? "חזרה להתחברות" : "Back to Login"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Verify & Reset views ... similar structure */}
                {view === "verify" && (
                    <div className="space-y-6 text-center relative z-10" dir="ltr">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">{t("enterCode")}</h2>
                            <p className="text-slate-400 text-sm">
                                {t("recoverySent")}{" "}
                                <span className="text-white font-mono font-bold">05X-XXXXXXX</span>
                            </p>
                        </div>
                        <div className="flex justify-center gap-3">
                            {[1, 2, 3, 4].map((_, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    maxLength="1"
                                    className="w-14 h-14 bg-slate-900 border border-slate-700 rounded-xl text-center text-2xl font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:scale-105"
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all mt-6 shadow-lg"
                            type="button"
                        >
                            {t("verifyBtn")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("forgot")}
                            className="text-slate-500 hover:text-white text-sm mt-4 block mx-auto"
                        >
                            {t("cancel")}
                        </button>
                    </div>
                )}

                {view === "reset" && (
                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10" dir="ltr">
                        <h2 className="text-xl font-bold text-white mb-6 text-center">
                            {t("resetPass")}
                        </h2>
                        <div>
                            <label className={`block text-slate-400 text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                                {t("newPass")}
                            </label>
                            <input
                                type="password"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="********"
                            />
                        </div>
                        <div>
                            <label className={`block text-slate-400 text-sm font-bold mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                                {t("verifyNewPass")}
                            </label>
                            <input
                                type="password"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="********"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all mt-4 shadow-lg shadow-emerald-500/20"
                        >
                            {t("resetPass")}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

/** =========================
 * SMALL COMPONENTS
 * ========================= */


const MetricCard = ({
    title,
    value,
    subValue,
    icon: Icon,
    trend,
    styles,
    isInput,
    onInputChange,
    currency,
}) => (
    <div
        className={`${styles.bgCard} rounded-xl p-5 border ${styles.border} ${styles.shadow} flex flex-col justify-between h-32`}
    >
        <div className="flex justify-between items-start">
            <div className="flex-1 overflow-hidden">
                <p className={`${styles.textSecondary} text-xs font-bold uppercase tracking-wider truncate`}>
                    {title}
                </p>
                {isInput ? (
                    <div className="flex items-center mt-1">
                        <span className={`text-2xl font-bold ${styles.textPrimary}`}>{currency}</span>
                        <input
                            type="text"
                            placeholder="0 (e.g. 10k, 1m)"
                            value={formatNumberWithCommas(value)}
                            onChange={(e) => {
                                const rawValue = parseNumberFromCommas(e.target.value);
                                if (rawValue === '' || !isNaN(parseFloat(rawValue))) {
                                    onInputChange({ target: { value: rawValue } });
                                }
                            }}
                            className={`bg-transparent text-2xl font-bold ${styles.textPrimary} w-full outline-none border-b border-dashed ${styles.border} focus:border-blue-500 transition-colors text-left`}
                            maxLength={15}
                        />
                    </div>
                ) : (
                    <h3
                        className={`text-2xl font-bold mt-1 truncate ${trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : styles.textPrimary
                            }`}
                        title={value.toString().startsWith(currency) ? value : `${currency}${value}`}
                    >
                        {value}
                    </h3>
                )}
            </div>
            <div className={`p-2.5 rounded-lg bg-gray-500/10 ${styles.textSecondary} flex-shrink-0 ml-3`}>
                <Icon size={20} />
            </div>
        </div>
        {subValue && (
            <div className="mt-auto pt-2">
                <p className={`${styles.textSecondary} text-xs truncate`}>{subValue}</p>
            </div>
        )}
    </div>
);

const PerformanceTable = ({ title, data, colNameKey, t, styles, currency, icon: Icon = Target }) => {
    const sortedData = data
        .filter((d) => d.count >= MIN_TRADES_FOR_STATS)
        .sort((a, b) => b.winRate - a.winRate);

    if (sortedData.length === 0) {
        return (
            <div className={`${styles.bgCard} rounded-xl p-6 border ${styles.border} shadow-lg flex flex-col items-center justify-center text-center h-64`}>
                <div className={`p-3 rounded-full bg-slate-700/30 ${styles.textSecondary} mb-3`}>
                    <TableIcon size={24} />
                </div>
                <h3 className={`${styles.textPrimary} font-bold mb-2`}>{title}</h3>
                <p className={styles.textSecondary}>{t("noData")}</p>
            </div>
        );
    }

    return (
        <div className={`${styles.bgCard} rounded-xl shadow-lg overflow-hidden border ${styles.border}`}>
            <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className={`font-bold ${styles.textPrimary} uppercase text-sm flex items-center gap-2`}>
                    <Icon size={16} className="text-blue-500" /> {title}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className={`${styles.inputBg} ${styles.textSecondary} text-xs uppercase font-bold`}>
                        <tr>
                            <th className="p-3 text-left">{t(colNameKey)}</th>
                            <th className="p-3 text-center">{t("stat_winrate")}</th>
                            <th className="p-3 text-center">{t("stat_trades")}</th>
                            <th className="p-3 text-center">{t("stat_pnl")}</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${styles.border}`}>
                        {sortedData.map((row, index) => (
                            <tr key={index} className={`${styles.hoverBg} transition-colors text-sm ${index === 0 ? "bg-blue-500/10" : ""}`}>
                                <td className={`p-3 font-medium ${styles.textPrimary} text-left`}>
                                    {row.displayName || row.name} {index === 0 && <span className="text-yellow-500">★</span>}
                                </td>
                                <td className="p-3 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                            <div className={`h-full ${row.winRate >= 50 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${row.winRate}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-emerald-500">{row.winRate.toFixed(1)}%</span>
                                    </div>
                                </td>
                                <td className={`p-3 text-center ${styles.textSecondary}`}>{row.count}</td>
                                <td className={`p-3 text-center font-bold ${row.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                    {row.pnl > 0 ? "+" : ""}
                                    {currency}
                                    {formatCompactNumber(row.pnl)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/** =========================
 * Trade Form (Futures Only)
 * + Seconds timeframes
 * ========================= */
const TradeForm = ({ isOpen, onClose, onSave, editingTrade, existingStrategies, t, styles, lang, isRTL }) => {
    const nowDate = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    const [formData, setFormData] = useState({
        date: nowDate,
        time: nowTime,
        symbol: "",
        type: "Long",
        contracts: 1,
        contractType: "mini",
        timeInterval: "1m",
        pointValue: "",
        session: "",
        strategy: "",
        entryPrice: "",
        exitPrice: "",
        stopLoss: "",
        fees: 0,
        notes: "",
        tags: "",
        image: "",
        tradeNumber: "",
        mental: "",
        entryParts: [],
        exitParts: []
    });

    const [showEntryParts, setShowEntryParts] = useState(false);
    const [showExitParts, setShowExitParts] = useState(false);

    // Load saved draft when opening form (only for new trades)
    useEffect(() => {
        if (isOpen && !editingTrade) {
            const savedDraft = localStorage.getItem('futuresTradeDraft');
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setFormData(parsed);
                    if (parsed.entryParts?.length > 0) setShowEntryParts(true);
                    if (parsed.exitParts?.length > 0) setShowExitParts(true);
                } catch (e) {
                    console.error('Failed to load draft:', e);
                }
            }
        }
    }, [isOpen, editingTrade]);

    // Auto-save draft to localStorage whenever formData changes (only for new trades)
    useEffect(() => {
        if (isOpen && !editingTrade) {
            localStorage.setItem('futuresTradeDraft', JSON.stringify(formData));
        }
    }, [formData, isOpen, editingTrade]);

    useEffect(() => {
        if (!isOpen) return;

        if (editingTrade) {
            setFormData({
                date: editingTrade.date || nowDate,
                time: editingTrade.time || nowTime,
                symbol: (editingTrade.symbol || "").toUpperCase(),
                type: editingTrade.type || "Long",
                contracts: editingTrade.contracts ?? 1,
                contractType: editingTrade.contractType || "mini",
                timeInterval: editingTrade.timeInterval || "1m",
                pointValue: editingTrade.pointValue ?? "",
                session: editingTrade.session || "",
                strategy: editingTrade.strategy || "",
                entryPrice: editingTrade.entryPrice ?? "",
                exitPrice: editingTrade.exitPrice ?? "",
                stopLoss: editingTrade.stopLoss ?? "",
                fees: editingTrade.fees ?? 0,
                notes: editingTrade.notes || "",
                tags: editingTrade.tags || "",
                image: editingTrade.image || "",
                tradeNumber: editingTrade.tradeNumber || "",
                entryParts: editingTrade.entryParts || [],
                exitParts: editingTrade.exitParts || []
            });
            if (editingTrade.entryParts?.length > 0) setShowEntryParts(true);
            if (editingTrade.exitParts?.length > 0) setShowExitParts(true);
        }
        // Don't reset form for new trades - draft will be loaded by the first useEffect
    }, [editingTrade, isOpen, nowDate, nowTime]);

    const updateAverages = (updatedData) => {
        const calculateAvg = (parts) => {
            const valid = parts.filter(p => p.price && p.quantity);
            if (valid.length === 0) return null;
            const totalQty = valid.reduce((acc, p) => acc + parseFloat(p.quantity), 0);
            const totalVal = valid.reduce((acc, p) => acc + (parseFloat(p.price) * parseFloat(p.quantity)), 0);
            return { avg: totalVal / totalQty, total: totalQty };
        };

        const newData = { ...updatedData };

        if (showEntryParts) {
            const entryRes = calculateAvg(newData.entryParts);
            if (entryRes) {
                newData.entryPrice = entryRes.avg.toFixed(4);
                newData.contracts = entryRes.total;
            }
        }

        if (showExitParts) {
            const exitRes = calculateAvg(newData.exitParts);
            if (exitRes) {
                newData.exitPrice = exitRes.avg.toFixed(4);
            }
        }

        setFormData(newData);
    };

    const handlePartChange = (type, index, field, value) => {
        const partsKey = type === 'entry' ? 'entryParts' : 'exitParts';
        const newParts = [...formData[partsKey]];
        newParts[index] = { ...newParts[index], [field]: value };
        updateAverages({ ...formData, [partsKey]: newParts });
    };

    const addPart = (type) => {
        const partsKey = type === 'entry' ? 'entryParts' : 'exitParts';
        const newParts = [...formData[partsKey], { price: '', quantity: '' }];
        updateAverages({ ...formData, [partsKey]: newParts });
    };

    const removePart = (type, index) => {
        const partsKey = type === 'entry' ? 'entryParts' : 'exitParts';
        const newParts = formData[partsKey].filter((_, i) => i !== index);
        updateAverages({ ...formData, [partsKey]: newParts });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "symbol") {
            setFormData((prev) => ({ ...prev, symbol: value.toUpperCase() }));
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2000000) {
            alert(t("max2mbLocal"));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData((prev) => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const submissionData = {
            ...formData,
            id: editingTrade ? editingTrade.id : Date.now().toString(),
            symbol: (formData.symbol || "").toUpperCase().trim(),
            contracts: Number(formData.contracts),
            pointValue: formData.pointValue === "" ? "" : parseNumberFromCommas(formData.pointValue.toString()),
            fees: formData.fees === "" ? 0 : parseNumberFromCommas(formData.fees.toString()),
            entryPrice: formData.entryPrice === "" ? "" : parseNumberFromCommas(formData.entryPrice.toString()),
            exitPrice: formData.exitPrice === "" ? "" : parseNumberFromCommas(formData.exitPrice.toString()),
            stopLoss: formData.stopLoss === "" ? "" : parseNumberFromCommas(formData.stopLoss.toString()),
        };

        const metrics = calculateFuturesMetrics(submissionData);

        onSave({
            ...submissionData,
            ...metrics,
        });

        // Clear the saved draft after successful save
        localStorage.removeItem('futuresTradeDraft');

        // Reset form to initial state
        setFormData({
            date: nowDate,
            time: nowTime,
            symbol: "",
            type: "Long",
            contracts: 1,
            contractType: "mini",
            timeInterval: "1m",
            pointValue: "",
            session: "",
            strategy: "",
            entryPrice: "",
            exitPrice: "",
            stopLoss: "",
            fees: 0,
            notes: "",
            tags: "",
            image: "",
            tradeNumber: "",
            entryParts: [],
            exitParts: []
        });
        setShowEntryParts(false);
        setShowExitParts(false);

        onClose();
    };

    const renderPartSection = (type) => {
        const isEntry = type === 'entry';
        const parts = isEntry ? formData.entryParts : formData.exitParts;
        const label = isEntry ? t('entryParts') : t('exitParts');
        const mainField = isEntry ? 'entryPrice' : 'exitPrice';

        return (
            <div className={`w-full p-3 rounded-xl border ${styles.border} bg-black/10 space-y-2`}>
                <div className="flex justify-between items-center bg-transparent">
                    <label className={`text-[11px] font-bold ${styles.textPrimary}`}>
                        {label}
                    </label>
                    <button
                        type="button"
                        onClick={() => addPart(type)}
                        className="text-[9px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    >
                        <Plus size={10} /> {t('addPart')}
                    </button>
                </div>
                <div className="flex justify-start">
                    <span className="text-[9px] bg-blue-500/15 text-blue-400 px-2 py-1 rounded border border-blue-500/20 whitespace-nowrap leading-none">
                        {t('weightedAvg')}: {formatNumber(parseFloat(formData[mainField]))}
                    </span>
                </div>

                <div className="space-y-2">
                    {parts.map((part, index) => (
                        <div key={index} className="flex gap-2 items-center animate-in slide-in-from-top-1 duration-200">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder={t('price')}
                                    value={formatNumberWithCommas(part.price)}
                                    onChange={(e) => handlePartChange(type, index, 'price', parseNumberFromCommas(e.target.value))}
                                    className={`w-full p-2 text-xs ${styles.inputBg} border ${styles.border} rounded-lg ${styles.textPrimary} outline-none focus:ring-1 focus:ring-blue-500`}
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder={t('contracts')}
                                    value={formatNumberWithCommas(part.quantity)}
                                    onChange={(e) => handlePartChange(type, index, 'quantity', parseNumberFromCommas(e.target.value))}
                                    className={`w-full p-2 text-xs ${styles.inputBg} border ${styles.border} rounded-lg ${styles.textPrimary} outline-none focus:ring-1 focus:ring-blue-500`}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removePart(type, index)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {parts.length === 0 && (
                        <div className={`text-center py-4 text-xs ${styles.textSecondary} italic border border-dashed ${styles.border} rounded-lg`}>
                            {lang === 'he' ? 'לחץ על + כדי להוסיף שכבות מחיר' : 'Click + to add price layers'}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    const TF_OPTS = [
        { v: "1s", label: t("tf_1s") },
        { v: "5s", label: t("tf_5s") },
        { v: "10s", label: t("tf_10s") },
        { v: "15s", label: t("tf_15s") },
        { v: "30s", label: t("tf_30s") },
        { v: "1m", label: t("tf_1m") },
        { v: "2m", label: t("tf_2m") },
        { v: "3m", label: t("tf_3m") },
        { v: "5m", label: t("tf_5m") },
        { v: "10m", label: t("tf_10m") },
        { v: "15m", label: t("tf_15m") },
        { v: "30m", label: t("tf_30m") },
        { v: "45m", label: t("tf_45m") },
        { v: "1H", label: t("tf_1H") },
        { v: "2H", label: t("tf_2H") },
        { v: "4H", label: t("tf_4H") },
        { v: "8H", label: t("tf_8H") },
        { v: "12H", label: t("tf_12H") },
        { v: "1D", label: t("tf_1D") },
        { v: "1W", label: t("tf_1W") },
        { v: "1M", label: t("tf_1M") },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className={`${styles.bgCard} rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border ${styles.border}`}
                dir="ltr"
            >
                <div className={`flex justify-between items-center p-6 border-b ${styles.border} sticky top-0 ${styles.bgCard} z-10`}>
                    <h2 className={`text-xl font-bold ${styles.textPrimary}`}>
                        {editingTrade ? t("editTrade") : t("newTrade")}
                    </h2>
                    <button onClick={onClose} className={`${styles.textSecondary} hover:text-blue-500 transition-colors`} type="button">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("date")}</label>
                        <input
                            required
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("time")}</label>
                        <input
                            type="time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("symbol")}</label>
                        <input
                            required
                            type="text"
                            name="symbol"
                            placeholder={t("phSymbolExample")}
                            value={formData.symbol}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary} font-bold`}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className={`block text-xs font-bold ${styles.textSecondary} uppercase`}>{t("contracts")}</label>
                        </div>
                        <input
                            required
                            readOnly={showEntryParts}
                            type="number"
                            step="1"
                            min="0"
                            name="contracts"
                            placeholder={showEntryParts ? t('totalQty') : t('contracts')}
                            value={formData.contracts}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary} ${showEntryParts ? 'opacity-70 bg-slate-800' : ''}`}
                        />
                    </div>



                    <div>
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("contractType")}</label>
                        <select
                            name="contractType"
                            value={formData.contractType}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                        >
                            <option value="micro">{t("micro")}</option>
                            <option value="mini">{t("mini")}</option>
                        </select>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("timeframe")}</label>
                        <select
                            name="timeInterval"
                            value={formData.timeInterval}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                        >
                            {TF_OPTS.map((o) => (
                                <option key={o.v} value={o.v}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>
                            {t("pointValue")}
                        </label>
                        <input
                            required
                            type="number"
                            step="0.01"
                            name="pointValue"
                            value={formData.pointValue}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("session")}</label>
                        <select
                            name="session"
                            value={formData.session}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                        >
                            <option value="">{t("select")}</option>
                            <option value="asia">{t("asia")}</option>
                            <option value="london">{t("london")}</option>
                            <option value="ny">{t("ny")}</option>
                            <option value="am">{t("am")}</option>
                            <option value="pm">{t("pm")}</option>
                        </select>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("type")}</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData((p) => ({ ...p, type: "Long" }))}
                                className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${formData.type === "Long"
                                    ? "bg-emerald-600 text-white shadow-lg"
                                    : `${styles.inputBg} ${styles.textSecondary} hover:bg-gray-500/20`
                                    }`}
                            >
                                {t("long")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData((p) => ({ ...p, type: "Short" }))}
                                className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${formData.type === "Short"
                                    ? "bg-rose-600 text-white shadow-lg"
                                    : `${styles.inputBg} ${styles.textSecondary} hover:bg-gray-500/20`
                                    }`}
                            >
                                {t("short")}
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("strategy")}</label>
                        <input
                            type="text"
                            name="strategy"
                            list="strategies-list"
                            value={formData.strategy}
                            onChange={handleChange}
                            placeholder={t("phStrategy")}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                        />
                        <datalist id="strategies-list">
                            {existingStrategies.map((s, i) => (
                                <option key={i} value={s} />
                            ))}
                        </datalist>
                    </div>

                    {/* Entry & Exit Grouping for Desktop */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Entry Section Container */}
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className={`block text-xs font-bold ${styles.textSecondary} uppercase`}>{t('entryPrice')}</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowEntryParts(!showEntryParts)}
                                        className={`text-[10px] font-bold ${showEntryParts ? 'text-blue-400' : 'text-slate-500'} hover:text-blue-300 flex items-center gap-1 transition-colors`}
                                    >
                                        {showEntryParts ? t('simple') : `${t('multiEntry')} +`}
                                    </button>
                                </div>
                                {!showEntryParts ? (
                                    <input
                                        required
                                        type="text"
                                        name="entryPrice"
                                        value={formatNumberWithCommas(formData.entryPrice)}
                                        onChange={(e) => {
                                            const rawValue = parseNumberFromCommas(e.target.value);
                                            if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                                                setFormData(prev => ({ ...prev, entryPrice: rawValue }));
                                            }
                                        }}
                                        className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                                    />
                                ) : (
                                    <div className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg text-blue-400 font-bold bg-blue-500/5`}>
                                        {formatNumber(parseFloat(formData.entryPrice))} (Auto)
                                    </div>
                                )}
                            </div>

                            {showEntryParts && renderPartSection('entry')}
                        </div>

                        {/* Exit Section Container */}
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className={`block text-xs font-bold ${styles.textSecondary} uppercase`}>{t('exitPrice')}</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowExitParts(!showExitParts)}
                                        className={`text-[10px] font-bold ${showExitParts ? 'text-blue-400' : 'text-slate-500'} hover:text-blue-300 flex items-center gap-1 transition-colors`}
                                    >
                                        {showExitParts ? t('simple') : `${t('scaleOut')} +`}
                                    </button>
                                </div>
                                {!showExitParts ? (
                                    <input
                                        required
                                        type="text"
                                        name="exitPrice"
                                        value={formatNumberWithCommas(formData.exitPrice)}
                                        onChange={(e) => {
                                            const rawValue = parseNumberFromCommas(e.target.value);
                                            if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                                                setFormData(prev => ({ ...prev, exitPrice: rawValue }));
                                            }
                                        }}
                                        className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                                    />
                                ) : (
                                    <div className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg text-blue-400 font-bold bg-blue-500/5`}>
                                        {formatNumber(parseFloat(formData.exitPrice))} (Auto)
                                    </div>
                                )}
                            </div>

                            {showExitParts && renderPartSection('exit')}
                        </div>

                        {/* Fees & Stop Loss Row - Responsive Order */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="order-1 md:order-2">
                                <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("stopLoss")}</label>
                                <input
                                    required
                                    type="text"
                                    name="stopLoss"
                                    value={formatNumberWithCommas(formData.stopLoss)}
                                    onChange={(e) => {
                                        const rawValue = parseNumberFromCommas(e.target.value);
                                        if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                            setFormData((prev) => ({ ...prev, stopLoss: rawValue }));
                                        }
                                    }}
                                    className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                                />
                            </div>

                            <div className="order-2 md:order-1">
                                <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("fees")}</label>
                                <input
                                    type="text"
                                    name="fees"
                                    value={formatNumberWithCommas(formData.fees)}
                                    onChange={(e) => {
                                        const rawValue = parseNumberFromCommas(e.target.value);
                                        if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                            setFormData((prev) => ({ ...prev, fees: rawValue }));
                                        }
                                    }}
                                    className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("uploadImage")}</label>
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                name="image"
                                placeholder={t("phImageUrl")}
                                value={formData.image}
                                onChange={handleChange}
                                className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary} text-xs`}
                            />
                            <div className="flex items-center gap-2">
                                <label className={`cursor-pointer ${styles.hoverBg} border ${styles.border} ${styles.textPrimary} px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors`}>
                                    <Upload size={14} /> {t("chooseFile")}
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                                <span className={`text-[10px] ${styles.textSecondary}`}>{t("max2mbLocal")}</span>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("tradeNumber")}</label>
                        <input
                            type="text"
                            name="tradeNumber"
                            placeholder={t("phTradeNumber")}
                            value={formData.tradeNumber}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary} font-mono`}
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("tags")}</label>
                        <input
                            type="text"
                            name="tags"
                            placeholder={t("phTags")}
                            value={formData.tags}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                        />
                    </div>

                    {/* Mental State - 3 Dots */}
                    <div className="flex flex-col items-center">
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-3`}>{t("mental")}</label>
                        <div className="flex gap-4 justify-center">
                            {[
                                { value: "green", color: "bg-emerald-500", label: t("mentalGreen") },
                                { value: "yellow", color: "bg-yellow-500", label: t("mentalYellow") },
                                { value: "red", color: "bg-red-500", label: t("mentalRed") }
                            ].map((mental) => (
                                <div key={mental.value} className="flex flex-col items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, mental: mental.value })}
                                        className={`w-6 h-6 rounded-full ${mental.color} transition-all ${formData.mental === mental.value
                                            ? 'ring-4 ring-white scale-110 shadow-lg'
                                            : 'opacity-40 hover:opacity-100 hover:scale-105'
                                            }`}
                                    ></button>
                                    <span className={`text-[9px] ${styles.textSecondary} text-center leading-tight max-w-[80px]`}>
                                        {mental.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t("notes")}</label>
                        <textarea
                            name="notes"
                            rows="3"
                            value={formData.notes}
                            onChange={handleChange}
                            className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2 flex gap-4 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`w-full py-3 px-4 bg-gray-500/10 hover:bg-gray-500/20 ${styles.textPrimary} rounded-lg font-bold transition-colors`}
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30"
                        >
                            <Save size={18} />
                            {editingTrade ? t("update") : t("save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/** =========================
 * Modals
 * ========================= */
const NoteViewerModal = ({ isOpen, onClose, notes, styles }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className={`${styles.bgCard} ${styles.textPrimary} rounded-xl p-6 max-w-lg w-full ${styles.border} border shadow-2xl relative`} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={`absolute top-4 right-4 ${styles.textSecondary} hover:text-blue-500`} type="button">
                    <X size={20} />
                </button>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <StickyNote className="text-yellow-400" /> {t('notes')}
                </h3>
                <div className={`${styles.inputBg} p-4 rounded-lg border ${styles.border} whitespace-pre-wrap max-h-[60vh] overflow-y-auto`}>
                    {notes || t('noNotes')}
                </div>
            </div>
        </div>
    );
};

const ShareModal = ({ isOpen, onClose, trade, t, styles, currency }) => {
    const modalRef = useRef(null);
    if (!isOpen || !trade) return null;
    const win = trade.pnl > 0;

    const handleDownload = () => {
        alert(t('shareSaveInstruction'));
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div ref={modalRef} className={`${styles.bgCard} rounded-xl p-8 max-w-sm w-full border ${styles.border} shadow-2xl relative text-center`} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={`absolute top-4 right-4 ${styles.textSecondary}`} type="button">
                    <X size={24} />
                </button>
                <div className="mb-6 flex justify-center">
                    <div className={`p-4 rounded-full ${win ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-700/50 text-slate-400"}`}>
                        <Trophy size={48} />
                    </div>
                </div>
                <h3 className={`text-2xl font-extrabold ${styles.textPrimary} mb-2`}>
                    {win ? t("shareWinTitle") : t("shareLossTitle")}
                </h3>
                <div className="bg-slate-900/80 rounded-lg p-6 mb-6 border border-slate-700/50">
                    <div className="text-4xl font-black text-white mb-2">{trade.symbol}</div>
                    <div className={`text-3xl font-black ${win ? "text-emerald-400" : "text-rose-400"}`}>
                        {win ? "+" : ""}
                        {currency}
                        {formatNumber(trade.pnl)}
                    </div>
                    <div className="text-slate-400 text-sm mt-2">
                        {trade.contracts} {t("contracts")} | {trade.type} | {trade.rDisplay || `${trade.rMultiple ?? 0}R`}
                    </div>
                </div>
                <button onClick={handleDownload} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-2" type="button">
                    <Camera size={18} /> {t("downloadShareImage")}
                </button>
            </div>
        </div>
    );
};

/** =========================
 * Views
 * ========================= */
const CalendarView = ({ trades, isRTL, t, styles, currency, lang }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState("monthly");

    // Default to today's date
    const getTodayDateStr = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    };
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(getTodayDateStr());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay, year, month };
    };

    const { days, firstDay, year, month } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString(lang === "he" ? "he-IL" : "en-US", { month: "long", year: "numeric" });

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // חישוב הנתונים ללוח השנה (יומי, שבועי, חודשי)
    const monthData = useMemo(() => {
        const dailyMap = {};
        let totalPnl = 0;
        let totalTrades = 0;
        let wins = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        let maxDay = { pnl: -Infinity, date: "" };
        let minDay = { pnl: Infinity, date: "" };
        const weeklyMap = {};

        trades.forEach((trade) => {
            const d = new Date(trade.date);
            const pnl = parseFloat(trade.pnl) || 0;
            if (d.getMonth() === month && d.getFullYear() === year) {
                const day = d.getDate();
                if (!dailyMap[day]) dailyMap[day] = { pnl: 0, count: 0 };
                dailyMap[day].pnl += pnl;
                dailyMap[day].count += 1;

                totalPnl += pnl;
                totalTrades += 1;
                if (pnl > 0) {
                    wins += 1;
                    grossProfit += pnl;
                } else {
                    grossLoss += pnl;
                }

                const firstDayOfMonth = new Date(year, month, 1).getDay();
                const weekNum = Math.ceil((day + firstDayOfMonth) / 7);
                if (!weeklyMap[weekNum]) weeklyMap[weekNum] = 0;
                weeklyMap[weekNum] += pnl;
            }
        });

        Object.keys(dailyMap).forEach((day) => {
            const val = dailyMap[day].pnl;
            if (val > maxDay.pnl) maxDay = { pnl: val, date: `${day}/${month + 1}` };
            if (val < minDay.pnl) minDay = { pnl: val, date: `${day}/${month + 1}` };
        });

        const activeDays = Object.keys(dailyMap).length;
        const avgDaily = activeDays > 0 ? totalPnl / activeDays : 0;

        let bestWeek = { pnl: -Infinity, week: 0, trades: 0, wins: 0, startDate: "", endDate: "" };
        Object.keys(weeklyMap).forEach((w) => {
            if (weeklyMap[w] > bestWeek.pnl) {
                // Calculate week dates
                const weekNum = parseInt(w);
                const firstDayOfMonth = new Date(year, month, 1).getDay();
                const startDay = (weekNum - 1) * 7 - firstDayOfMonth + 1;
                const endDay = Math.min(startDay + 6, days);

                // Count trades and wins for this week
                let weekTrades = 0;
                let weekWins = 0;
                trades.forEach((trade) => {
                    const d = new Date(trade.date);
                    if (d.getMonth() === month && d.getFullYear() === year) {
                        const day = d.getDate();
                        if (day >= startDay && day <= endDay) {
                            weekTrades++;
                            if (trade.pnl > 0) weekWins++;
                        }
                    }
                });

                bestWeek = {
                    pnl: weeklyMap[w],
                    week: w,
                    trades: weekTrades,
                    wins: weekWins,
                    startDate: `${Math.max(1, startDay)}/${month + 1}`,
                    endDate: `${endDay}/${month + 1}`,
                };
            }
        });

        return {
            dailyMap,
            totalPnl,
            grossProfit,
            grossLoss,
            totalTrades,
            winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
            worstDay: minDay.pnl !== Infinity ? minDay : { pnl: 0, date: "-" },
            maxDay: maxDay.pnl !== -Infinity ? maxDay : { pnl: 0, date: "-" },
            avgDaily,
            bestWeek: bestWeek.pnl !== -Infinity ? bestWeek : { pnl: 0, week: "-" },
        };
    }, [trades, month, year]);

    const weekDays = [t("sunday"), t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday")];
    const weekDaysShort = lang === "he" ? weekDays : ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const weekDaysFull = lang === "he" ? weekDays : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // תצוגת הצד (Sidebar) עם הסטטיסטיקה
    const renderSidebar = () => {
        return (
            <div className={`flex flex-col gap-4 p-4 ${styles.bgCard} bg-opacity-50 rounded-lg border ${styles.border} h-full text-left`}>
                <div className="mb-2">
                    <label className={`text-xs font-bold ${styles.textSecondary} uppercase block mb-2`}>{t("calStatsTitle")}</label>
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className={`w-full ${styles.inputBg} border ${styles.border} ${styles.textPrimary} text-sm rounded-md p-2 outline-none`}
                    >
                        <option value="monthly">{t("viewMonthlyStats")}</option>
                        <option value="weekly">{t("viewWeeklyStats")}</option>
                        <option value="daily">{t("viewDailyStats")}</option>
                    </select>
                </div>

                <div className="space-y-4">
                    {viewMode === "monthly" && (
                        <>
                            <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                <div className={`text-xs ${styles.textSecondary}`}>{t("netPnl")}</div>
                                <div className={`text-xl font-bold ${monthData.totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                    {currency}{formatNumber(monthData.totalPnl)}
                                </div>
                            </div>

                            <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                <div className={`text-xs ${styles.textSecondary}`}>{t("totalTrades")}</div>
                                <div className={`text-xl font-bold ${styles.textPrimary}`}>{monthData.totalTrades}</div>
                            </div>

                            <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                <div className={`text-xs ${styles.textSecondary}`}>{t("winRate")}</div>
                                <div className={`text-xl font-bold text-blue-500`}>{monthData.winRate.toFixed(1)}%</div>
                            </div>

                            <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                <div className={`text-xs ${styles.textSecondary}`}>{t("bestDay")} ({monthData.maxDay.date})</div>
                                <div className="text-lg font-bold text-emerald-500">
                                    {monthData.maxDay.pnl > 0 ? "+" : ""}{currency}{formatNumber(monthData.maxDay.pnl)}
                                </div>
                            </div>

                            <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                <div className={`text-xs ${styles.textSecondary}`}>{t("worstDay")} ({monthData.worstDay.date})</div>
                                <div className="text-lg font-bold text-rose-500">
                                    {monthData.worstDay.pnl > 0 ? "+" : ""}{currency}{formatNumber(monthData.worstDay.pnl)}
                                </div>
                            </div>
                        </>
                    )}

                    {viewMode === "daily" && (
                        <>
                            {/* Selected Date Display */}
                            {selectedCalendarDate && (
                                <div className={`${styles.bgCard} p-4 rounded border ${styles.border} mb-4`}>
                                    <div className={`text-xs ${styles.textSecondary} font-bold mb-1`}>
                                        {t('selectedDate')}
                                    </div>
                                    <div className={`text-lg font-bold ${styles.textPrimary}`}>
                                        {(() => {
                                            const d = new Date(selectedCalendarDate + "T00:00:00");
                                            if (lang === "he") {
                                                const months = [t("jan"), t("feb"), t("mar"), t("apr"), t("may"), t("jun"), t("jul"), t("aug"), t("sep"), t("oct"), t("nov"), t("dec")];
                                                return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
                                            }
                                            return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
                                        })()}
                                    </div>
                                </div>
                            )}

                            {selectedCalendarDate ? (
                                (() => {
                                    // Calculate stats for selected day
                                    const dayTrades = trades.filter((t) => t.date === selectedCalendarDate);
                                    const dailyPnl = dayTrades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);
                                    const wins = dayTrades.filter((t) => (parseFloat(t.pnl) || 0) > 0).length;
                                    const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;
                                    const avgR = dayTrades.length > 0 ? dayTrades.reduce((acc, t) => acc + (parseFloat(t.rMultiple) || 0), 0) / dayTrades.length : 0;

                                    return (
                                        <>
                                            <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                                <div className={`text-xs ${styles.textSecondary}`}>{t('dailyPnl')}</div>
                                                <div className={`text-xl font-bold ${dailyPnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                    {dailyPnl > 0 ? "+" : ""}{currency}{formatNumber(dailyPnl)}
                                                </div>
                                            </div>

                                            <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                                <div className={`text-xs ${styles.textSecondary}`}>{t('stat_trades')}</div>
                                                <div className={`text-xl font-bold ${styles.textPrimary}`}>{dayTrades.length}</div>
                                            </div>

                                            <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                                <div className={`text-xs ${styles.textSecondary}`}>{t('winRate')}</div>
                                                <div className="text-xl font-bold text-blue-500">{winRate.toFixed(1)}%</div>
                                            </div>

                                            <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                                <div className={`text-xs ${styles.textSecondary}`}>{t('avgR')}</div>
                                                <div className="text-xl font-bold text-blue-400">{avgR.toFixed(2)}R</div>
                                            </div>
                                        </>
                                    );
                                })()
                            ) : (
                                <div className={`${styles.bgCard} p-4 rounded border ${styles.border} text-center`}>
                                    <div className={`text-sm ${styles.textSecondary}`}>
                                        {t('calendarInstruction')}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {viewMode === "weekly" && (
                        <>
                            {/* Best Week - Clean Boxes */}
                            <div className={`${styles.bgCard} p-4 rounded border ${styles.border}`}>
                                <div className={`text-sm font-bold ${styles.textPrimary} mb-4`}>{t("bestWeek")}</div>

                                {/* Stats Grid - Single Column */}
                                <div className="space-y-3">
                                    {/* Date */}
                                    <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                        <div className="flex justify-between items-center">
                                            <div className={`text-sm ${styles.textSecondary} font-bold`}>{t('date')}</div>
                                            <div className={`text-xs ${styles.textSecondary}`}>
                                                {monthData.bestWeek.startDate} - {monthData.bestWeek.endDate}
                                            </div>
                                        </div>
                                    </div>

                                    {/* P/L */}
                                    <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                        <div className={`text-xs ${styles.textSecondary} mb-1`}>{t('pnlLabel')}</div>
                                        <div className={`text-lg font-bold ${monthData.bestWeek.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                            {monthData.bestWeek.pnl > 0 ? "+" : ""}{currency}{formatNumber(monthData.bestWeek.pnl)}
                                        </div>
                                    </div>

                                    {/* Trades */}
                                    <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                        <div className={`text-xs ${styles.textSecondary} mb-1`}>{t('stat_trades')}</div>
                                        <div className={`text-lg font-bold ${styles.textPrimary}`}>{monthData.bestWeek.trades}</div>
                                    </div>

                                    {/* Win Rate */}
                                    <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                                        <div className={`text-xs ${styles.textSecondary} mb-1`}>{t('winRate')}</div>
                                        <div className={`text-lg font-bold ${styles.textPrimary}`}>
                                            {monthData.bestWeek.trades > 0 ? ((monthData.bestWeek.wins / monthData.bestWeek.trades) * 100).toFixed(1) : 0}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`${styles.bgCard} rounded-xl shadow-xl border ${styles.border} overflow-hidden flex flex-col md:flex-row`} dir="ltr">
            <div className={`w-full md:w-64 border-b md:border-b-0 md:border-r ${styles.border} ${styles.bgCard}`}>{renderSidebar()}</div>

            <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-2xl font-bold ${styles.textPrimary} capitalize tracking-wide`}>{monthName}</h2>
                    <div className="flex gap-2">
                        <button onClick={prevMonth} className={`p-2 hover:${styles.hoverBg} rounded-lg ${styles.textSecondary} transition-colors`}>
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={nextMonth} className={`p-2 hover:${styles.hoverBg} rounded-lg ${styles.textSecondary} transition-colors`}>
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                <div className={`grid grid-cols-7 gap-px ${styles.border} border rounded-lg overflow-hidden bg-gray-700/50`}>
                    {weekDays.map((day, i) => (
                        <div key={i} className={`${styles.bgCard} px-1 py-3 md:px-3 text-center text-[9px] md:text-xs font-bold ${styles.textSecondary} uppercase tracking-wider`}>
                            <span className="md:hidden">{weekDaysShort[i]}</span>
                            <span className="hidden md:inline">{weekDaysFull[i]}</span>
                        </div>
                    ))}
                    {[...Array(firstDay)].map((_, i) => (
                        <div key={`empty-${i}`} className={`${styles.bgCard} bg-opacity-50 min-h-[100px]`} />
                    ))}
                    {[...Array(days)].map((_, i) => {
                        const dayNum = i + 1;
                        const data = monthData.dailyMap[dayNum];
                        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

                        // Check if this is today
                        const today = new Date();
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                        const isToday = dateStr === todayStr;

                        // Background overlay color based on P/L or today
                        const overlayBg = data && data.pnl > 0 ? "bg-emerald-500/15" : data && data.pnl < 0 ? "bg-rose-500/15" : isToday && !data ? "bg-slate-600/40" : "";

                        return (
                            <div
                                key={dayNum}
                                onClick={() => setSelectedCalendarDate(dateStr)}
                                className={`${styles.bgCard} min-h-[100px] p-2 flex flex-col justify-between cursor-pointer transition-colors relative group border-t ${styles.border} border-opacity-30 overflow-hidden`}
                            >
                                {/* ✅ Background overlay layer that won't be overridden */}
                                {overlayBg && <div className={`absolute inset-0 ${overlayBg} pointer-events-none`} />}

                                {/* ✅ All content above the overlay */}
                                <div className="relative z-10 flex flex-col justify-between h-full">
                                    <span className={`text-sm font-bold ${styles.textSecondary} group-hover:text-blue-500`}>{dayNum}</span>

                                    {data && (
                                        <div className="text-right">
                                            <div className={`text-[8px] md:text-[10px] ${styles.textSecondary} font-bold mb-0.5 leading-none`}>
                                                {data.count} {t("stat_trades")}
                                            </div>
                                            <div className={`font-black text-[9px] md:text-sm ${data.pnl > 0 ? "text-emerald-500" : "text-rose-500"} leading-none`}>
                                                {data.pnl > 0 ? "+" : ""}
                                                {formatCompactCalendar(data.pnl)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Trailing empty cells to complete the last row */}
                    {(() => {
                        const totalCells = firstDay + days;
                        const trailing = (7 - (totalCells % 7)) % 7;
                        return [...Array(trailing)].map((_, i) => <div key={`trailing-${i}`} className={`${styles.bgCard} min-h-[100px] border-t ${styles.border} border-opacity-30`} />);
                    })()}
                </div>
            </div>
        </div>
    );
};

const GalleryView = ({ trades, styles, t, onEdit, currency = "$", lang = "en" }) => {
    const tradesWithImages = trades.filter(trade => trade.image && trade.image.length > 0);
    const [selectedImg, setSelectedImg] = useState(null);

    return (
        <div className="space-y-6" dir="ltr">
            <div className="flex justify-between items-center mb-6">
                <div className={`flex items-center gap-2 ${styles.textSecondary}`}>
                    <ImageIcon size={20} />
                    <h3 className={`text-lg font-bold ${styles.textPrimary}`}>{t('gallery')}</h3>
                </div>
            </div>

            {tradesWithImages.length === 0 ? (
                <div className={`text-center py-20 ${styles.bgCard} rounded-xl border ${styles.border} border-dashed`}>
                    <ImageIcon size={48} className={`mx-auto ${styles.textSecondary} mb-4`} />
                    <p className={`${styles.textSecondary} font-medium`}>{t('noImages')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tradesWithImages.map(trade => (
                        <div key={trade.id} className={`${styles.bgCard} rounded-xl overflow-hidden border ${styles.border} hover:border-blue-500 transition-all ${styles.shadow} group flex flex-col`}>
                            <div className="aspect-square w-full relative bg-black overflow-hidden group-hover:shadow-2xl">
                                <img
                                    src={trade.image}
                                    alt={trade.symbol}
                                    className="w-full h-full object-cover transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => setSelectedImg(trade.image)}
                                        className="bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 rounded-full text-white transition-all"
                                    >
                                        <Maximize2 size={24} />
                                    </button>
                                </div>
                                <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white backdrop-blur-sm">
                                    {trade.date}
                                </div>
                            </div>
                            <div className={`p-4 flex-1 flex flex-col justify-between ${styles.bgCard} border-t ${styles.border}`}>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className={`font-bold ${styles.textPrimary} text-md`}>{trade.symbol}</h4>
                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${trade.type === 'Long' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                            {trade.type}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs ${styles.textSecondary} font-mono`}>
                                            #{trade.tradeNumber || 'N/A'}
                                        </span>
                                        <div className={`text-md font-bold font-mono ${trade.pnl > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {trade.pnl > 0 ? '+' : ''}{currency}{formatNumber(trade.pnl)}
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex justify-between items-center text-xs ${styles.textSecondary} mt-3 pt-3 border-t ${styles.border}`}>
                                    <span className="truncate max-w-[70%]">{trade.strategy}</span>
                                    <button
                                        onClick={() => onEdit(trade)}
                                        className="text-blue-400 hover:text-blue-500 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedImg && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedImg(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
                        onClick={() => setSelectedImg(null)}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={selectedImg}
                        alt={t('fullScreen')}
                        className="max-w-full max-h-full rounded shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};






const SettingsView = ({ settings, setSettings, t, styles, lang, setLang, setActiveTab }) => (
    <div className={`max-w-xl mx-auto ${styles.bgCard} rounded-xl p-6 border ${styles.border} shadow-lg`}>
        <h2 className={`text-xl font-bold ${styles.textPrimary} mb-4 flex items-center gap-2`}>
            <Settings className="text-blue-500" size={20} /> {t("settings")}
        </h2>

        <div className="space-y-3">
            {/* Language */}
            <div className={`flex items-center justify-between p-3 rounded-lg ${styles.inputBg} border ${styles.border}`}>
                <span className={`font-bold ${styles.textPrimary} text-sm flex items-center gap-2`}>
                    <Languages size={16} /> {t("language")}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setLang("he")}
                        className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${lang === "he" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                        type="button"
                    >
                        עברית
                    </button>
                    <button
                        onClick={() => setLang("en")}
                        className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${lang === "en" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                        type="button"
                    >
                        English
                    </button>
                </div>
            </div>

            {/* Currency */}
            <div className={`flex items-center justify-between p-3 rounded-lg ${styles.inputBg} border ${styles.border}`}>
                <span className={`font-bold ${styles.textPrimary} text-sm flex items-center gap-2`}>
                    <DollarSign size={16} /> {t("currency")}
                </span>
                <div className="flex gap-2">
                    {["$", "€", "₪"].map((cur) => (
                        <button
                            key={cur}
                            onClick={() => setSettings((s) => ({ ...s, currency: cur }))}
                            className={`w-8 h-8 rounded-md font-bold text-xs transition-colors ${settings.currency === cur ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                                }`}
                            type="button"
                        >
                            {cur}
                        </button>
                    ))}
                </div>
            </div>

            {/* Theme */}
            <div className={`flex items-center justify-between p-3 rounded-lg ${styles.inputBg} border ${styles.border}`}>
                <span className={`font-bold ${styles.textPrimary} text-sm flex items-center gap-2`}>
                    <Settings size={16} /> {t("theme")}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSettings((s) => ({ ...s, theme: "dark" }))}
                        className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${settings.theme === "dark" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                            }`}
                        type="button"
                    >
                        {t("darkTheme")}
                    </button>
                    <button
                        onClick={() => setSettings((s) => ({ ...s, theme: "light" }))}
                        className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${settings.theme === "light" ? "bg-slate-200 text-slate-900" : "text-slate-400 hover:text-white"
                            }`}
                        type="button"
                    >
                        {t("lightTheme")}
                    </button>
                </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={() => setActiveTab("journal")}
                    className="px-6 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-bold text-sm transition-colors"
                    type="button"
                >
                    {t("close")}
                </button>
            </div>
        </div>
    </div>
);

/** =========================
 * Delete Confirmation Modal
 * ========================= */
const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, t, styles, isRTL }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div
                className={`${styles.bgCard} ${styles.textPrimary} rounded-xl p-6 max-w-md w-full ${styles.border} border shadow-2xl`}
                dir={isRTL ? "rtl" : "ltr"}
            >
                {/* Icon and Title */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                        <Trash2 className="text-red-500" size={28} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold mb-2">
                            {t("deleteTradeTitle") || "האם למחוק את העסקה לצמיתות?"}
                        </h3>
                        <p className={`text-sm ${styles.textSecondary} max-w-xs mx-auto`}>
                            {t("deleteTradeWarning") || "פעולה זו תמחק את העסקה לצמיתות ולא ניתן יהיה לשחזר אותה"}
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
                        type="button"
                    >
                        {t("cancel") || "Cancel"}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                        type="button"
                    >
                        {t("delete") || "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LogoutConfirmModal = ({ isOpen, onConfirm, onCancel, t, styles, isRTL }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div
                className={`${styles.bgCard} ${styles.textPrimary} rounded-xl p-6 max-w-md w-full ${styles.border} border shadow-2xl`}
                dir={isRTL ? "rtl" : "ltr"}
            >
                {/* Title and Warning */}
                <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-center">
                        {t("logoutTitle") || "האם אתה בטוח שברצונך להתנתק?"}
                    </h3>
                    <p className={`text-sm ${styles.textSecondary} text-center`}>
                        {t("logoutWarning") || "כל השינויים שלא נשמרו יאבדו."}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
                        type="button"
                    >
                        {t("no") || "לא"}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                        type="button"
                    >
                        {t("yes") || "כן"}
                    </button>
                </div>
            </div>
        </div>
    );
};

/** =========================
 * MAIN APP
 * ========================= */
export default function FuturesApp({ username: propUsername, onLogout: propOnLogout, onSwitchJournal }) {
    const [user, setUser] = useState(propUsername || null);
    const [hydrated, setHydrated] = useState(false);
    const [trades, setTrades] = useState([]);
    const [startingCapital, setStartingCapital] = useState(25000);
    const [settings, setSettings] = useState({ currency: "$", theme: "dark", fontSize: 14 });
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState("journal");
    const [currentDateFilter, setCurrentDateFilter] = useState(new Date());
    const [timeViewMode, setTimeViewMode] = useState("month"); // day/week/month/year/all
    const [lang, setLang] = useState("he");
    const [goals, setGoals] = useState({ daily: 1000, weekly: 5000, monthly: 20000, yearly: 200000 });
    const [showPercentage, setShowPercentage] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState(null);
    const [viewingNotes, setViewingNotes] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedTradeId, setSelectedTradeId] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const t = (key) => TRANSLATIONS[lang]?.[key] || key;
    const styles = getThemeStyles(settings.theme);
    const isRTL = lang === "he";

    // Sync user with prop
    useEffect(() => {
        if (propUsername) {
            setUser(propUsername);
        }
    }, [propUsername]);

    /** ===== Persistence (HYBRID: LocalStorage + Firebase) ===== */
    useEffect(() => {
        if (!user) {
            setHydrated(true);
            return;
        }

        setHydrated(false);

        // 1. Initial Load (Hybrid: Local + Cloud)
        loadUserData(user, 'futures').then(data => {
            if (data) {
                setTrades(Array.isArray(data.trades) ? data.trades : []);
                setSettings(data.settings || { currency: "$", theme: "dark", fontSize: 14 });
                setStartingCapital(Number.isFinite(data.startingCapital) ? data.startingCapital : 25000);
                setGoals(data.goals || { daily: 1000, weekly: 5000, monthly: 20000, yearly: 200000 });
                if (data.lang) setLang(data.lang);
            }
            setHydrated(true);
        }).catch(error => {
            console.error('Failed to load futures data:', error);
            setHydrated(true);
        });

        // 2. Real-time Subscription (Background sync from other devices)
        const unsubscribe = subscribeToUserData(user, 'futures', (dataToAdd) => {
            if (dataToAdd && hydrated) {
                // Only update if cloud is newer (timestamp logic is inside subscribe)
                setTrades(Array.isArray(dataToAdd.trades) ? dataToAdd.trades : []);
                setSettings(dataToAdd.settings || { currency: "$", theme: "dark", fontSize: 14 });
                setStartingCapital(Number.isFinite(dataToAdd.startingCapital) ? dataToAdd.startingCapital : 25000);
                setGoals(dataToAdd.goals || { daily: 1000, weekly: 5000, monthly: 20000, yearly: 200000 });
                if (dataToAdd.lang) setLang(dataToAdd.lang);
            }
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (!user || !hydrated) return;

        const dataToSave = {
            trades,
            settings,
            startingCapital,
            goals,
            lang,
        };

        // Save using hybrid storage (LocalStorage + Firestore)
        saveUserData(user, 'futures', dataToSave).catch(error => {
            console.error('Failed to save futures data:', error);
        });
    }, [trades, settings, startingCapital, goals, user, hydrated, lang]);

    const handleLogin = (username) => setUser(username);
    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        if (propOnLogout) {
            propOnLogout(); // Call parent logout
        } else {
            setUser(null);
            setTrades([]);
            setActiveTab("journal");
        }
    };

    /** ===== CRUD ===== */
    const handleSaveTrade = (trade) => {
        // ensure metrics are correct even if importing old trades
        const ensured = { ...trade, ...calculateFuturesMetrics(trade) };
        if (editingTrade) setTrades((prev) => prev.map((x) => (x.id === ensured.id ? ensured : x)));
        else setTrades((prev) => [...prev, ensured]);
        setEditingTrade(null);
    };

    const handleDeleteTrade = (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            setTrades((prev) => prev.filter((x) => x.id !== deleteConfirmId));
            if (selectedTradeId === deleteConfirmId) setSelectedTradeId(null);
            setDeleteConfirmId(null);
        }
    };

    /** ===== Export/Import (FULL) ===== */
    const handleExportData = () => {
        const payload = { trades, settings, startingCapital, goals, exportedAt: new Date().toISOString() };
        const dataStr = JSON.stringify(payload, null, 2);
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", `Futures_Backup_${user}.json`);
        linkElement.click();
    };

    const handleImportData = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                const normalizeTrades = (arr) =>
                    (Array.isArray(arr) ? arr : []).map((tr) => ({
                        ...tr,
                        ...calculateFuturesMetrics(tr),
                    }));

                if (Array.isArray(imported)) {
                    if (window.confirm("Overwrite existing data?")) {
                        setTrades(normalizeTrades(imported));
                        alert(t("dataRestored"));
                    }
                } else if (imported && Array.isArray(imported.trades)) {
                    if (window.confirm("Overwrite existing data?")) {
                        setTrades(normalizeTrades(imported.trades));
                        if (imported.settings) setSettings(imported.settings);
                        if (Number.isFinite(imported.startingCapital)) setStartingCapital(imported.startingCapital);
                        if (imported.goals) setGoals(imported.goals);
                        alert(t("dataRestored"));
                    }
                } else {
                    alert(t("dataError"));
                }
            } catch {
                alert(t("dataError"));
            }
        };
        reader.readAsText(file);
        event.target.value = "";
    };

    /** ===== Filters (day/week/month/year/all) ===== */
    const filteredTrades = useMemo(() => {
        const fDate = new Date(currentDateFilter);

        let weekStart = null;
        let weekEnd = null;
        if (timeViewMode === "week") {
            weekStart = getWeekStart(fDate, isRTL); // he: Sunday, en: Monday
            weekEnd = getWeekEnd(weekStart);
        }

        return trades
            .filter((tr) => {
                const tDate = new Date(tr.date);
                if (timeViewMode === "day") return tr.date === toISODate(fDate);
                if (timeViewMode === "week") return isBetweenInclusive(tDate, weekStart, weekEnd);
                if (timeViewMode === "month") return tDate.getMonth() === fDate.getMonth() && tDate.getFullYear() === fDate.getFullYear();
                if (timeViewMode === "year") return tDate.getFullYear() === fDate.getFullYear();
                return true;
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
                const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
                return dateB - dateA;
            });
    }, [trades, currentDateFilter, timeViewMode, isRTL]);

    /** ===== Stats (for filtered period) ===== */
    const stats = useMemo(() => {
        const wins = filteredTrades.filter((x) => Number(x.pnl) > 0);
        const losses = filteredTrades.filter((x) => Number(x.pnl) <= 0);

        const totalPnl = filteredTrades.reduce((acc, x) => acc + (Number(x.pnl) || 0), 0);
        const grossProfit = wins.reduce((acc, x) => acc + (Number(x.pnl) || 0), 0);
        const grossLoss = losses.reduce((acc, x) => acc + (Number(x.pnl) || 0), 0); // negative
        const winRate = filteredTrades.length > 0 ? (wins.length / filteredTrades.length) * 100 : 0;

        const avgPnl = filteredTrades.length > 0 ? totalPnl / filteredTrades.length : 0;

        const rTrades = filteredTrades.filter((x) => Number(x.totalRisk) > 0);
        const avgR = rTrades.length > 0 ? rTrades.reduce((a, x) => a + (Number(x.rMultiple) || 0), 0) / rTrades.length : 0;

        let balance = startingCapital;
        const equityData = filteredTrades
            .slice()
            .reverse()
            .map((x, i) => {
                balance += Number(x.pnl) || 0;
                return { name: i + 1, value: balance, pnl: Number(x.pnl) || 0 };
            });

        const groupPerformance = (keyFn, displayFn) => {
            const groups = {};
            filteredTrades.forEach((x) => {
                const key = keyFn(x);
                const displayName = displayFn ? displayFn(key, x) : undefined;
                if (!groups[key]) groups[key] = { name: key, displayName, pnl: 0, count: 0, wins: 0 };
                groups[key].pnl += Number(x.pnl) || 0;
                groups[key].count += 1;
                if ((Number(x.pnl) || 0) > 0) groups[key].wins += 1;
            });
            return Object.values(groups).map((g) => ({
                ...g,
                winRate: g.count > 0 ? (g.wins / g.count) * 100 : 0,
            }));
        };

        const strategyData = groupPerformance((x) => x.strategy || "Unknown");
        const dayData = groupPerformance(
            (x) => getDayOfWeekKey(x.date),
            (dayKey) => t(dayKey)
        );
        const hourData = groupPerformance((x) => getHourBucket(x.time));

        return {
            totalPnl,
            grossProfit,
            grossLoss,
            avgPnl,
            avgR,
            winRate,
            winsCount: wins.length,
            lossesCount: losses.length,
            tradesCount: filteredTrades.length,
            equity: startingCapital + totalPnl,
            equityData,
            strategyData,
            dayData,
            hourData,
        };
    }, [filteredTrades, startingCapital, isRTL]);

    /** ===== Goal progress (relative to TODAY) ===== */
    const goalProgress = useMemo(() => {
        const now = new Date();
        const todayISO = toISODate(now);

        const weekStart = getWeekStart(now, isRTL);
        const weekEnd = getWeekEnd(weekStart);

        let daily = 0, weekly = 0, monthly = 0, yearly = 0;

        trades.forEach((tr) => {
            const pnl = Number(tr.pnl) || 0;
            const d = new Date(tr.date);

            if (tr.date === todayISO) daily += pnl;
            if (isBetweenInclusive(d, weekStart, weekEnd)) weekly += pnl;
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthly += pnl;
            if (d.getFullYear() === now.getFullYear()) yearly += pnl;
        });

        return { daily, weekly, monthly, yearly };
    }, [trades, isRTL]);

    const uniqueStrategies = useMemo(
        () => [...new Set(trades.map((x) => x.strategy).filter(Boolean))],
        [trades]
    );

    /** ===== Date label & nav behavior ===== */
    const periodLabel = useMemo(() => {
        const d = new Date(currentDateFilter);
        if (timeViewMode === "day") return d.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
        if (timeViewMode === "week") {
            const ws = getWeekStart(d, isRTL);
            const we = getWeekEnd(ws);
            if (lang === "he") {
                const months = [t("jan"), t("feb"), t("mar"), t("apr"), t("may"), t("jun"), t("jul"), t("aug"), t("sep"), t("oct"), t("nov"), t("dec")];
                const startMonth = months[ws.getMonth()];
                const endMonth = months[we.getMonth()];
                return `${startMonth} ${ws.getDate()} - ${endMonth} ${we.getDate()}`;
            }
            const a = ws.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const b = we.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return `${a} - ${b}`;
        }
        if (timeViewMode === "year") return String(d.getFullYear());
        if (timeViewMode === "all") return t("viewAll");
        return d.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { month: "long", year: "numeric" });
    }, [currentDateFilter, timeViewMode, lang, t]);

    const shiftPeriod = (dir) => {
        const d = new Date(currentDateFilter);
        if (timeViewMode === "day") d.setDate(d.getDate() + dir);
        else if (timeViewMode === "week") d.setDate(d.getDate() + 7 * dir);
        else if (timeViewMode === "year") d.setFullYear(d.getFullYear() + dir);
        else if (timeViewMode === "month") d.setMonth(d.getMonth() + dir);
        setCurrentDateFilter(d);
    };

    /** ===== Tooltip for chart ===== */
    const ChartTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const v = payload[0]?.value;
        return (
            <div className="bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
                <div className="text-xs text-slate-300 font-bold mb-1">#{label}</div>
                <div className="text-sm font-black text-white">
                    {showPercentage ? `${formatNumber(v, 2)}%` : `${settings.currency}${formatNumber(v, 2)}`}
                </div>
            </div>
        );
    };

    // Show login screen if no user
    if (!user) {
        return <AuthSystem onLogin={setUser} t={t} lang={lang} isRTL={isRTL} />;
    }

    return (
        <div
            className={`min-h-screen ${styles.bgMain} ${styles.textPrimary} font-sans transition-colors duration-300`}
            dir="ltr"
            style={{ fontSize: `${settings.fontSize}px` }}
        >
            {/* Header */}
            <header className={`${styles.bgHeader} border-b ${styles.border} sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-lg`}>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg">
                        <BarChart2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">S Trader</h1>
                        <p className="text-xs text-emerald-400">לימודי מסחר ושוק ההון</p>
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <button onClick={handleLogout} className="flex items-center gap-2 p-2 md:px-3 md:py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm" type="button">
                        <LogOut size={18} /> <span className="hidden md:inline">{t("logout")}</span>
                    </button>
                </div>
            </header>

            <main className="p-4 w-full space-y-4 pb-62">
                {/* Page Header */}
                <div className="text-center mt-8 mb-12">
                    <h1 className="text-3xl font-bold text-white mb-2">{t('tradingsJournal')}</h1>
                    <p className={`text-base ${styles.textSecondary}`}>{t('journalSubtitle')}</p>
                </div>

                {/* KPI Cards - Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* 1. NET P/L */}
                    <MetricCard
                        title={t('netPnlLabel')}
                        value={`${settings.currency}${formatNumber(stats.totalPnl)}`}
                        icon={DollarSign}
                        trend={stats.totalPnl > 0 ? 'up' : stats.totalPnl < 0 ? 'down' : 'neutral'}
                        styles={styles}
                    />
                    {/* 2. WIN RATE */}
                    <MetricCard
                        title={t('winRate')}
                        value={`${formatNumber(stats.winRate, 1)}%`}
                        subValue={`${stats.winsCount} ${t('winAbbr')} - ${stats.lossesCount} ${t('lossAbbr')}`}
                        icon={Target}
                        trend={stats.winRate > 50 ? 'up' : 'neutral'}
                        styles={styles}
                    />
                    {/* 3. PORTFOLIO VALUE */}
                    <MetricCard
                        title={t('portfolioValue')}
                        value={`${settings.currency}${formatNumber(stats.equity)}`}
                        icon={TrendingUp}
                        styles={styles}
                    />
                    {/* 4. AVG R */}
                    <MetricCard
                        title={t('avgR')}
                        value={formatR(stats.avgR)}
                        icon={Activity}
                        trend={stats.avgR >= 0 ? 'up' : 'down'}
                        styles={styles}
                    />
                </div>

                {/* KPI Cards - Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* 5. TOTAL PROFIT */}
                    <MetricCard
                        title={t('totalProfit')}
                        value={`${settings.currency}${formatNumber(stats.grossProfit)}`}
                        icon={TrendingUp}
                        trend="up"
                        styles={styles}
                    />
                    {/* 6. TOTAL LOSS */}
                    <MetricCard
                        title={t('totalLoss')}
                        value={`${settings.currency}${formatNumber(Math.abs(stats.grossLoss))}`}
                        icon={TrendingDown}
                        trend="down"
                        styles={styles}
                    />
                    {/* 7. STARTING CAPITAL */}
                    <MetricCard
                        title={t('startCap')}
                        value={startingCapital.toLocaleString("en-US")}
                        isInput
                        currency={settings.currency}
                        onInputChange={(e) => {
                            const val = e.target.value.replace(/[^\d.]/g, '');
                            setStartingCapital(parseFloat(val) || 0);
                        }}
                        icon={DollarSign}
                        styles={styles}
                    />
                    {/* 8. WINNING/LOSING TRADES - Two Rows */}
                    <div className={`${styles.bgCard} rounded-xl p-5 border ${styles.border} ${styles.shadow} flex flex-col justify-center gap-4 h-32`}>
                        {/* Row 1: WINNING TRADES */}
                        <div className="flex justify-between items-center">
                            <p className={`${styles.textSecondary} text-xs font-bold uppercase tracking-wider`}>
                                {t('winningTrades')}
                            </p>
                            <h3 className="text-2xl font-bold text-emerald-500">
                                {stats.winsCount}
                            </h3>
                        </div>
                        {/* Row 2: LOSING TRADES */}
                        <div className="flex justify-between items-center">
                            <p className={`${styles.textSecondary} text-xs font-bold uppercase tracking-wider`}>
                                {t('losingTrades')}
                            </p>
                            <h3 className="text-2xl font-bold text-rose-500">
                                {stats.lossesCount}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className={`flex gap-2 md:gap-4 overflow-x-auto pb-2 border-b ${styles.border} scrollbar-hide justify-between md:justify-start`}>
                    {[
                        { id: "journal", icon: List, label: t("tradeLog") },
                        { id: "gallery", icon: Grid, label: t("gallery") },
                        { id: "calendar", icon: CalendarIcon, label: t("calendar") },
                        { id: "analytics", icon: PieIcon, label: t("analytics") },
                        { id: "mental", icon: Activity, label: t("mentalTab") },
                        { id: "goals", icon: Trophy, label: t("goalsTab") },
                        { id: "settings", icon: Settings, label: t("settings") },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-1 font-bold flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors relative whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'text-blue-500' : `${styles.textSecondary} hover:${styles.textPrimary}`
                                }`}
                            type="button"
                        >
                            <tab.icon size={16} className="md:w-[18px] md:h-[18px]" />
                            <span className="text-[9px] md:text-sm">{tab.label}</span>
                            {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>}
                        </button>
                    ))}
                </div>

                {/* Journal */}
                {
                    activeTab === "journal" && (
                        <div className={`${styles.bgCard} rounded-xl shadow-lg border ${styles.border} overflow-hidden`}>
                            <div className={`p-4 border-b ${styles.border} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                                {/* Left Side: Period Selector | Date Display | Nav Arrows */}
                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 flex-nowrap">
                                    {/* View Mode Select */}
                                    <div className="shrink-0">
                                        <select
                                            value={timeViewMode}
                                            onChange={(e) => setTimeViewMode(e.target.value)}
                                            className={`bg-[#0a0f1d] border ${styles.border} ${styles.textPrimary} rounded-lg px-3 h-10 text-[12px] font-bold outline-none focus:border-emerald-500 cursor-pointer min-w-[85px] hover:bg-slate-900 transition-all shadow-inner`}
                                        >
                                            <option value="day">{t("viewDay")}</option>
                                            <option value="week">{t("viewWeek")}</option>
                                            <option value="month">{t("viewMonth")}</option>
                                            <option value="year">{t("viewYear")}</option>
                                            <option value="all">{t("viewAll")}</option>
                                        </select>
                                    </div>

                                    {/* Current Date Visual Component */}
                                    <div className={`flex items-center justify-center gap-2 px-3 h-10 bg-[#0a0f1d] border ${styles.border} rounded-lg shadow-inner group hover:border-slate-500 transition-colors cursor-default shrink-0 min-w-[150px]`}>
                                        <CalendarIcon size={16} className="text-emerald-500" />
                                        <span className="font-bold text-[12px] whitespace-nowrap text-center text-white">{periodLabel}</span>
                                    </div>

                                    {/* Compact Navigation Arrows */}
                                    <div className={`flex border ${styles.border} bg-[#0a0f1d] rounded-lg overflow-hidden shadow-inner h-10 shrink-0`}>
                                        <button
                                            onClick={() => shiftPeriod(-1)}
                                            className={`px-2.5 h-full border-r ${styles.border} hover:bg-slate-900 text-slate-400 hover:text-white transition-all flex items-center justify-center`}
                                            type="button"
                                            title={t("prev") || "Previous"}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => shiftPeriod(1)}
                                            className={`px-2.5 h-full hover:bg-slate-900 text-slate-400 hover:text-white transition-all flex items-center justify-center`}
                                            type="button"
                                            title={t("next") || "Next"}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side: Add Trade Action */}
                                <div className="shrink-0 w-full md:w-auto">
                                    <button
                                        onClick={() => {
                                            setEditingTrade(null);
                                            setIsModalOpen(true);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all transform active:scale-95 group w-full justify-center text-sm uppercase tracking-wide"
                                        type="button"
                                    >
                                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                        <span>{t("addTrade")}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className={`${styles.inputBg} ${styles.textSecondary} text-xs uppercase font-bold`}>
                                        <tr>
                                            <th className="p-4">{t("date")}</th>
                                            <th className="p-4 text-center whitespace-nowrap">{t("mental")}</th>
                                            <th className="p-4">{t("symbol")}</th>
                                            <th className="p-4">{t("position")}</th>
                                            <th className="p-4 text-center whitespace-nowrap">{t("contracts")}</th>
                                            <th className={`p-4 ${isRTL ? "text-left" : "text-right"}`}>{t("pnl")}</th>
                                            <th className="p-4 text-center">{t("r")}</th>
                                            <th className="p-4 text-center">{t("notes")}</th>
                                            <th className="p-4 text-center whitespace-nowrap">{t("screenshot")}</th>
                                            <th className="p-4 text-center">{t("actions")}</th>
                                        </tr>
                                    </thead>

                                    <tbody className={`divide-y ${styles.border}`}>
                                        {filteredTrades.map((trade) => {
                                            const selected = selectedTradeId === trade.id;
                                            const rowTint =
                                                trade.pnl > 0 ? "bg-emerald-500/5" : "";
                                            return (
                                                <React.Fragment key={trade.id}>
                                                    <tr
                                                        className={`${styles.hoverBg} ${rowTint}`}
                                                    >
                                                        <td className="p-4 font-mono">
                                                            <div className="flex flex-col whitespace-nowrap">
                                                                <span className="text-[11px] font-bold text-white leading-tight">{trade.date}</span>
                                                                <span className="text-[10px] text-slate-500 leading-tight">{trade.time}</span>
                                                            </div>
                                                        </td>

                                                        <td className="p-4 text-center">
                                                            {trade.mental && (
                                                                <div className={`w-4 h-4 rounded-full mx-auto ${trade.mental === 'green' ? 'bg-emerald-500' :
                                                                    trade.mental === 'yellow' ? 'bg-yellow-500' :
                                                                        trade.mental === 'red' ? 'bg-red-500' : 'bg-slate-600'
                                                                    }`} title={
                                                                        trade.mental === 'green' ? t("mentalGreen") :
                                                                            trade.mental === 'yellow' ? t("mentalYellow") :
                                                                                trade.mental === 'red' ? t("mentalRed") : ''
                                                                    }></div>
                                                            )}
                                                        </td>

                                                        <td className="p-4 font-bold">
                                                            {trade.symbol}
                                                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1" dir="ltr">
                                                                <span>{trade.contractType ? t(trade.contractType.toLowerCase()).toUpperCase() : ""}</span>
                                                                <span>•</span>
                                                                <span>{trade.timeInterval}</span>
                                                                {trade.session && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="whitespace-nowrap">{t(trade.session.toLowerCase()).toUpperCase()}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="p-4">
                                                            <span
                                                                className={`px-2 py-1 rounded text-xs font-bold ${trade.type === "Long"
                                                                    ? "bg-emerald-500/20 text-emerald-500"
                                                                    : "bg-rose-500/20 text-rose-500"
                                                                    }`}
                                                            >
                                                                {t(trade.type.toLowerCase())}
                                                            </span>
                                                        </td>

                                                        <td className="p-4 text-center font-mono">{trade.contracts}</td>

                                                        <td
                                                            className={`p-4 font-bold font-mono ${isRTL ? "text-left" : "text-right"} ${trade.pnl > 0 ? "text-emerald-500" : "text-rose-500"
                                                                }`}
                                                        >
                                                            {trade.pnl > 0 ? "+" : ""}
                                                            {settings.currency}
                                                            {formatNumber(trade.pnl)}
                                                        </td>

                                                        <td className="p-4 text-center text-sm font-mono">
                                                            {trade.rDisplay || formatR(trade.rMultiple)}
                                                        </td>

                                                        <td className="p-4 text-center">
                                                            {trade.notes && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setViewingNotes(trade.notes);
                                                                    }}
                                                                    className="text-yellow-400"
                                                                    type="button"
                                                                    title={t("notes")}
                                                                >
                                                                    <StickyNote size={18} />
                                                                </button>
                                                            )}
                                                        </td>

                                                        {/* Screenshot Column */}
                                                        <td className="p-4 text-center">
                                                            {trade.image && (
                                                                <a
                                                                    href={trade.image}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-blue-400 hover:text-blue-300 transition-colors inline-block"
                                                                    title={t("screenshot")}
                                                                >
                                                                    <ImageIcon size={20} />
                                                                </a>
                                                            )}
                                                        </td>

                                                        {/* Actions Column */}
                                                        <td className="p-4 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingTrade(trade);
                                                                        setIsModalOpen(true);
                                                                    }}
                                                                    className="text-blue-400 p-1 hover:bg-slate-700 rounded"
                                                                    type="button"
                                                                    title={t("editTrade")}
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteTrade(trade.id);
                                                                    }}
                                                                    className="text-rose-400 p-1 hover:bg-slate-700 rounded"
                                                                    type="button"
                                                                    title={t('delete')}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {filteredTrades.length === 0 && (
                                    <div className="p-12 text-center text-slate-500">{t("noTrades")}</div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Analytics */}
                {
                    activeTab === "analytics" && (
                        <AnalyticsView
                            trades={trades}
                            startingCapital={startingCapital}
                            currency={settings.currency}
                            styles={styles}
                            t={t}
                            lang={lang}
                            isRTL={isRTL}
                        />
                    )
                }

                {/* Calendar */}
                {
                    activeTab === "calendar" && (
                        <CalendarView trades={trades} isRTL={isRTL} t={t} styles={styles} currency={settings.currency} lang={lang} />
                    )
                }

                {/* Gallery */}
                {activeTab === "gallery" && (
                    <GalleryView
                        trades={filteredTrades}
                        styles={styles}
                        t={t}
                        onEdit={(trade) => { setEditingTrade(trade); setIsModalOpen(true); }}
                        currency={settings.currency}
                        lang={lang}
                    />
                )}

                {/* Goals */}
                {
                    activeTab === "goals" && (
                        <GoalsView
                            trades={trades}
                            goals={goals}
                            setGoals={setGoals}
                            t={t}
                            styles={styles}
                            currency={settings.currency}
                            isRTL={isRTL}
                            lang={lang}
                        />
                    )
                }

                {/* Mental Tab */}
                {
                    activeTab === "mental" && (() => {
                        // Calculate mental state statistics
                        const mentalStats = {
                            green: { count: 0, wins: 0, totalPnl: 0 },
                            yellow: { count: 0, wins: 0, totalPnl: 0 },
                            red: { count: 0, wins: 0, totalPnl: 0 },
                            none: { count: 0, wins: 0, totalPnl: 0 }
                        };

                        trades.forEach(trade => {
                            const mental = trade.mental || 'none';
                            if (mentalStats[mental]) {
                                mentalStats[mental].count++;
                                mentalStats[mental].totalPnl += trade.pnl || 0;
                                if (trade.pnl > 0) mentalStats[mental].wins++;
                            }
                        });

                        const totalWithMental = mentalStats.green.count + mentalStats.yellow.count + mentalStats.red.count;

                        return (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-white mb-2 whitespace-nowrap">{t("mentalStats")}</h2>
                                    <p className={styles.textSecondary}>
                                        {isRTL ? "נתח את המצב המנטלי שלך במהלך המסחר" : "Analyze your mental state during trading"}
                                    </p>
                                </div>

                                <>
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Green - Disciplined */}
                                        <div className={`${styles.bgCard} rounded-xl shadow-lg border-2 border-emerald-500/30 p-6`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-white">{t("disciplinedTrades")}</h3>
                                                <div className="w-7 h-7 rounded-full bg-emerald-500"></div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className={`text-sm ${styles.textSecondary}`}>{t("totalTrades")}</p>
                                                    <p className="text-2xl font-bold text-white">{mentalStats.green.count}</p>
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${styles.textSecondary}`}>{t("winRate")}</p>
                                                    <p className="text-xl font-bold text-emerald-400">
                                                        {mentalStats.green.count > 0 ? ((mentalStats.green.wins / mentalStats.green.count) * 100).toFixed(1) : 0}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${styles.textSecondary}`}>{t("netPnl")}</p>
                                                    <p className={`text-xl font-bold ${mentalStats.green.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                        }`}>
                                                        {mentalStats.green.totalPnl > 0 ? '+' : ''}{settings.currency}{formatNumber(mentalStats.green.totalPnl)}
                                                    </p>
                                                </div>

                                                {/* Progress Bar Section */}
                                                <div className="pt-4 border-t border-slate-700/50">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t("mentalGreen")}</span>
                                                        <span className="text-xs font-bold text-white">
                                                            {totalWithMental > 0 ? ((mentalStats.green.count / totalWithMental) * 100).toFixed(1) : 0}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                            style={{ width: `${totalWithMental > 0 ? (mentalStats.green.count / totalWithMental) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Yellow - Random */}
                                        <div className={`${styles.bgCard} rounded-xl shadow-lg border-2 border-yellow-500/30 p-6`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-white">{t("randomTrades")}</h3>
                                                <div className="w-7 h-7 rounded-full bg-yellow-500"></div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className={`text-sm ${styles.textSecondary}`}>{t("totalTrades")}</p>
                                                    <p className="text-2xl font-bold text-white">{mentalStats.yellow.count}</p>
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${styles.textSecondary}`}>{t("winRate")}</p>
                                                    <p className="text-xl font-bold text-yellow-400">
                                                        {mentalStats.yellow.count > 0 ? ((mentalStats.yellow.wins / mentalStats.yellow.count) * 100).toFixed(1) : 0}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${styles.textSecondary}`}>{t("netPnl")}</p>
                                                    <p className={`text-xl font-bold ${mentalStats.yellow.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                        }`}>
                                                        {mentalStats.yellow.totalPnl > 0 ? '+' : ''}{settings.currency}{formatNumber(mentalStats.yellow.totalPnl)}
                                                    </p>
                                                </div>

                                                {/* Progress Bar Section */}
                                                <div className="pt-4 border-t border-slate-700/50">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">{t("mentalYellow")}</span>
                                                        <span className="text-xs font-bold text-white">
                                                            {totalWithMental > 0 ? ((mentalStats.yellow.count / totalWithMental) * 100).toFixed(1) : 0}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className="h-full bg-yellow-500 transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                                            style={{ width: `${totalWithMental > 0 ? (mentalStats.yellow.count / totalWithMental) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Red - Emotional */}
                                        <div className={`${styles.bgCard} rounded-xl shadow-lg border-2 border-red-500/30 p-6`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-white">{t("emotionalTrades")}</h3>
                                                <div className="w-7 h-7 rounded-full bg-red-500"></div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className={`text-sm ${styles.textSecondary}`}>{t("totalTrades")}</p>
                                                    <p className="text-2xl font-bold text-white">{mentalStats.red.count}</p>
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${styles.textSecondary}`}>{t("winRate")}</p>
                                                    <p className="text-xl font-bold text-red-400">
                                                        {mentalStats.red.count > 0 ? ((mentalStats.red.wins / mentalStats.red.count) * 100).toFixed(1) : 0}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${styles.textSecondary}`}>{t("netPnl")}</p>
                                                    <p className={`text-xl font-bold ${mentalStats.red.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                        }`}>
                                                        {mentalStats.red.totalPnl > 0 ? '+' : ''}{settings.currency}{formatNumber(mentalStats.red.totalPnl)}
                                                    </p>
                                                </div>

                                                {/* Progress Bar Section */}
                                                <div className="pt-4 border-t border-slate-700/50">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{t("mentalRed")}</span>
                                                        <span className="text-xs font-bold text-white">
                                                            {totalWithMental > 0 ? ((mentalStats.red.count / totalWithMental) * 100).toFixed(1) : 0}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className="h-full bg-red-500 transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                                            style={{ width: `${totalWithMental > 0 ? (mentalStats.red.count / totalWithMental) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            </div>
                        );
                    })()}

                {/* Settings */}
                {activeTab === "settings" && (
                    <SettingsView
                        settings={settings}
                        setSettings={setSettings}
                        t={t}
                        styles={styles}
                        lang={lang}
                        setLang={setLang}
                        setActiveTab={setActiveTab}
                    />
                )}
            </main>

            {/* Modals */}
            <TradeForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTrade}
                editingTrade={editingTrade}
                existingStrategies={uniqueStrategies}
                t={t}
                styles={styles}
                lang={lang}
                isRTL={isRTL}
            />
            <NoteViewerModal isOpen={!!viewingNotes} onClose={() => setViewingNotes(null)} notes={viewingNotes} styles={styles} />
            <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} trade={trades.find((x) => x.id === selectedTradeId)} t={t} styles={styles} currency={settings.currency} />
            <DeleteConfirmModal
                isOpen={!!deleteConfirmId}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirmId(null)}
                t={t}
                styles={styles}
                isRTL={isRTL}
            />
            <LogoutConfirmModal
                isOpen={showLogoutConfirm}
                onConfirm={confirmLogout}
                onCancel={() => setShowLogoutConfirm(false)}
                t={t}
                styles={styles}
                isRTL={isRTL}
            />

            {/* WhatsApp Button (אפשר למחוק אם לא צריך) */}
            {!isModalOpen && !shareModalOpen && (
                <a
                    href={`https://wa.me/972547899848?text=${encodeURIComponent("היי הגעתי דרך היומן מסחר ויש לי שאלה")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-8 right-8 z-50 group"
                    title={t("contactWhatsapp")}
                >
                    <div className="relative flex items-center justify-center w-16 h-16">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping duration-[1500ms]" />
                        <div className="relative w-16 h-16 bg-[#25D366] hover:bg-[#20ba5a] rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.5)] flex items-center justify-center text-white transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6">
                            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor" className="drop-shadow-sm">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </div>
                    </div>
                </a>
            )}
        </div>
    );
}
