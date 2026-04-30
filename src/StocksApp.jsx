import React, { useState, useEffect, useMemo, useRef } from 'react';
import { excelService } from './services/excelService';
import {
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  DollarSign,
  Filter,
  Save,
  X,
  PieChart as PieIcon,
  List,
  Clock,
  Calendar as CalendarIcon,
  Calendar,
  Languages,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BarChart2,
  Percent,
  Image as ImageIcon,
  Upload,
  Grid,
  Maximize2,
  CalendarDays,
  StickyNote,
  Download,
  Settings,
  LogOut,
  User,
  Lock,
  Phone,
  Mail,
  Type,
  Palette,
  Coins,
  CheckSquare,
  MessageCircle,
  Printer,
  Trophy,
  Table as TableIcon,
  RefreshCw,
  Share2,
  Instagram,
  Send,
  ExternalLink,
  Star,
  FileUp,
  FileDown,
  Database,
  Terminal,
  ShieldCheck,
  CheckCircle,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Globe
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList
} from 'recharts';
import html2canvas from 'html2canvas';
import AuthSystem from './SimpleAuthSystem.jsx';
import WatchlistView from './WatchlistView.jsx';
import GoalsView from './GoalsView.jsx';
import AnalyticsPerformanceSection from './AnalyticsPerformanceSection.jsx';
import { supabase } from './lib/supabaseClient';
import { tradeService } from './services/tradeService';
import { localDbService } from './services/localDbService';
import { colmexService } from './services/colmexService';

// --- Dropdown Component ---
const DropdownComponent = ({ currency, showPercentage, setShowPercentage }) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handleSelect = (value) => {
    console.log('showPercentage->', value);
    setShowPercentage(value);
    setDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="bg-blue-500/20 border border-blue-500/40 rounded px-3 py-0.5 text-[10px] font-bold text-blue-400 backdrop-blur-sm hover:bg-blue-500/30 transition-all flex items-center gap-1 min-w-[40px]"
      >
        {showPercentage ? '%' : currency}
        <ChevronDown size={10} />
      </button>
      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded shadow-xl">
          <button
            onClick={() => handleSelect(false)}
            className={`w-full px-3 py-1 text-[10px] font-bold text-center hover:bg-slate-700 transition-colors ${!showPercentage ? 'text-blue-400 bg-slate-700/50' : 'text-slate-300'}`}
          >
            {currency}
          </button>
          <button
            onClick={() => handleSelect(true)}
            className={`w-full px-3 py-1 text-[10px] font-bold text-center hover:bg-slate-700 transition-colors ${showPercentage ? 'text-blue-400 bg-slate-700/50' : 'text-slate-300'}`}
          >
            %
          </button>
        </div>
      )}
    </div>
  );
};

// --- Constants & Translations ---

const MIN_TRADES_FOR_STATS = 2;

const TRANSLATIONS = {
  en: {
    appTitle: "S Trader",
    subtitle: "Trading & Capital Markets Education",
    mainTitle: "Trading Journal",
    slogan: "This is your way to jump forward",
    balance: "Balance",
    addTrade: "Add Trade",
    shareTrade: "Share Trade",
    netPnl: "Net P/L",
    grossProfit: "Total Profit",
    grossLoss: "Total Loss",
    startCap: "Starting Capital",
    winRate: "Win Rate",
    equity: "Portfolio Value",
    avgR: "Avg R",
    winsCount: "Winning Trades",
    lossesCount: "Losing Trades",
    tradeLog: "Trade Log",
    analytics: "Analytics",
    calendar: "Calendar",
    gallery: "Gallery",
    watchlist: "Watchlist",
    goalsTab: "Goals",
    connections: "Connections",
    settings: "Settings",
    loginToBroker: "Connect to Colmex",
    pasteAndConnect: "Paste & Connect",
    syncTrades: "Sync Trades Now",
    logoutBtn: "Disconnect",
    authorizationUrl: "Authorization URL",
    connectedStatus: "Connected",
    disconnectedStatus: "Disconnected",
    weeklyGoal: "Weekly Goal",
    updateGoal: "Update Goal",
    goalProgress: "Goal Progress",
    completed: "Completed",
    completion: "Completion",
    weeklyProfit: "Weekly Profit",
    remaining: "Remaining",
    filters: "Filters",
    searchSymbol: "Search Symbol...",
    allStrategies: "All Strategies",
    allTypes: "All Types",
    viewType: "View By",
    viewDay: "Daily",
    viewWeek: "Weekly",
    viewMonth: "Monthly",
    viewYear: "Yearly",
    viewAll: "All Time",
    date: "Date",
    time: "Time",
    symbol: "Symbol",
    position: "Position",
    type: "Type",
    strategy: "Strategy",
    pnl: "P/L",
    r: "R/R",
    actions: "Actions",
    noTrades: "No trades found for this period",
    noImages: "No screenshots yet. Add a trade with an image via the Journal!",
    equityCurve: "P&L Chart",
    equityCurvePercent: "Cumulative Return",
    strategyPerf: "Strategy Performance",
    dayPerf: "Daily Performance",
    hourPerf: "Hourly Performance",
    performanceTable: "Performance Table",
    editTrade: "Edit Trade",
    newTrade: "New Trade",
    entryPrice: "Entry",
    exitPrice: "Take Profit",
    stopLoss: "Stop Loss",
    quantity: "Qty",
    fees: "Fees",
    tags: "Tags",
    notes: "Notes",
    viewNotes: "View Notes",
    screenshot: "Screenshot",
    uploadImage: "Upload / Image URL",
    tradeNumber: "Trade #",
    cancel: "Cancel",
    save: "Save",
    update: "Update",
    sunday: "SUN",
    monday: "MON",
    tuesday: "TUE",
    wednesday: "WED",
    thursday: "THU",
    friday: "FRI",
    saturday: "SAT",
    calStatsTitle: "Performance View",
    viewMonthlyStats: "Monthly Performance",
    viewWeeklyStats: "Weekly Performance",
    viewDailyStats: "Daily Performance",
    totalTrades: "Total Trades",
    bestDay: "Best Day",
    worstDay: "Worst Day",
    avgDailyPnl: "Avg Daily P/L",
    bestWeek: "Best Week",
    deleteConfirm: "Delete this trade permanently?",
    togglePercent: "Show %",
    backupData: "Backup / Export Data",
    restoreData: "Restore / Import Data",
    printPdf: "Print / Save as PDF",
    dataRestored: "Data restored successfully!",
    dataError: "Error restoring data. Check file format.",
    currency: "Currency",
    theme: "Theme",
    fontSize: "Font Size",
    language: "Language",
    themeDark: "Dark / Pro",
    themeLight: "Light / Clean",
    logout: "Logout",
    loginTitle: "Login to S Trader",
    registerTitle: "Create Account",
    forgotPass: "Forgot Password?",
    username: "Username",
    password: "Password (Optional)",
    phoneOrEmail: "Phone or Email",
    loginBtn: "Enter Journal",
    registerBtn: "Register",
    recoverBtn: "Recover Account",
    backToLogin: "Back to Login",
    enterCode: "Enter Verification Code",
    verifyBtn: "Verify & Proceed",
    newPass: "New Password",
    resetPass: "Reset Password",
    recoverySent: "Verification code sent to",
    codeSim: "1234",
    rememberMe: "Remember Me",
    contactWhatsapp: "Contact Support",
    close: "Close",
    dataManagement: "Data Management",
    bestPerformers: "Weekly Top Performers (Min 2 Trades)",
    bestCategory: "Category",
    bestName: "Name",
    bestPnl: "P/L",
    bestWinRate: "Win Rate",
    stat_trades: "Trades",
    stat_winrate: "Win Rate",
    stat_pnl: "Total P/L",
    stat_avgR: "Avg R",
    noData: "Not enough data",
    col_day: "Day",
    col_hour: "Time",
    col_strategy: "Strategy",
    col_name: "Name",
    cat_strategy: "Best Strategy",
    cat_day: "Best Day",
    cat_hour: "Best Hour",
    clickToToggle: "",
    stats_daily: "Daily P/L",
    stats_weekly: "Weekly P/L",
    stats_monthly: "Monthly P/L",
    stats_yearly: "Yearly P/L",
    selectedDate: "Selected Date",
    selectTradeWarning: "Please select a trade first!",
    shareWinTitle: "Winning Trade!",
    shareLossTitle: "Trade Analysis",
    shareText: "Check out my trade on",
    downloadShareImage: "Download Image for Sharing",
    generalStatistics: "General Statistics",
    successRate: "Success Rate",
    winStreak: "Win Streak",
    personalBest: "Personal Best",
    alertsEncouragement: "Alerts & Encouragement",
    congratulations: "Congratulations!",
    youReachedGoal: "You reached your goal!",
    almostThere: "Almost There!",
    onlyLeft: "Only",
    left: "left!",
    halfwayThere: "Halfway There!",
    passed50: "You passed 50% of the goal!",
    needToPush: "Need to Push!",
    below25: "You are below 25% of the goal",
    startTrading: "Start Trading!",
    noTradesThisPeriod: "No trades this period yet",
    setAGoal: "Set a Goal!",
    setGoalToTrack: "Set a goal to start tracking",
    comparisons: "Comparisons",
    vsPreviousPeriod: "vs Previous Period",
    bestVsWorst: "Best vs Worst",
    totalAchievements: "Total Achievements",
    progressChart: "Progress Chart",
    goal: "Goal",
    profit: "Profit",
    period: "Period",
    reset: "Reset",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
    enterGoal: "Enter goal",
    saveGoal: "Save Goal",
    periodSummary: "Period Summary",
    profitTrades: "WINNING TRADES",
    lossTrades: "LOSING TRADES",
    totalLosses: "TOTAL LOSSES",
    netProfit: "TOTAL PROFITS",
    weeklyGoalLabel: "Weekly Goal",
    monthlyGoalLabel: "Monthly Goal",
    yearlyGoalLabel: "Yearly Goal",
    dailyGoalLabel: "Daily Goal",
    weeklyProfitLabel: "Weekly Profit",
    monthlyProfitLabel: "Monthly Profit",
    yearlyProfitLabel: "Yearly Profit",
    dailyProfitLabel: "Daily Profit",
    goalCompleted: "Goal Completed!",
    phSymbolExample: "e.g. AAPL",
    phStrategy: "Type your strategy...",
    phImageUrl: "Paste image URL here...",
    phTags: "e.g. FOMO",
    phTradeNumber: "#123",
    chooseFile: "Choose File",
    max2mbLocal: "Max 2MB (stored locally)",
    long: "Long",
    short: "Short",
    tradesLabel: "Trades",
    questionPlaceholder: "Security Question",
    answerPlaceholder: "Answer",
    phoneNumber: "Phone Number",
    personalCode: "Personal Recovery Code (4 digits)",
    adminCode: "Admin Code",
    recoverWithPhone: "Authentication via Personal Code",
    recoverWithQuestion: "Authentication via Security Question",
    recoverWithAdmin: "Authentication via System Admin Code",
    enterPhone: "Enter phone number",
    enterPersonalCode: "Enter your personal code",
    enterAdminCode: "Enter admin code",
    phoneOrUsername: "Phone Number or Username",
    recoveryMethodLabel: "Recovery Method:",
    securityQuestionLabel: "Security Question for Account Recovery:",
    securityQuestion1: "What was your first teacher's name?",
    securityQuestion2: "In which city were you born?",
    securityQuestion3: "What was the name of your first pet?",
    answerLabel: "Answer (remember for future recovery)",
    mobilePhoneNumber: "Mobile Phone Number",
    personalCodeLabel: "Personal recovery code (4 digits)",
    chooseRecoveryMethod: "Choose authentication method for recovery",
    logoutTitle: "Are you sure you want to logout?",
    logoutWarning: "You can log back in anytime.",
    yes: "Yes",
    no: "No",
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
    mentalTab: "Mental",
    mentalStats: "Mental State Statistics",
    mentalDistribution: "Mental State Distribution",
    disciplinedTrades: "Disciplined Trades",
    emotionalTrades: "Emotional Trades",
    randomTrades: "Random Trades",
    avgPnlPerState: "Avg P/L per State",
    importBtn: "Import Trades",
    exportBtn: "Export Trades",
    importTitle: "Import Trades from File",
    selectPlatform: "Select Platform",
    brokerIBKR: "Interactive Brokers",
    brokerTradeStation: "TradeStation",
    importSuccess: "Trades imported successfully",
    deleteAfterImport: "The file was deleted after reading and data synced to cloud",
    noTradesToExport: "No trades found to export"
  },
  he: {
    appTitle: "S Trader",
    subtitle: "לימודי מסחר ושוק ההון",
    mainTitle: "יומן מסחר",
    slogan: "זו הדרך לקפיצה שלך קדימה",
    balance: "יתרה",
    addTrade: "הוסף עסקה",
    shareTrade: "שתף עסקה",
    netPnl: "רווח/הפסד נקי",
    grossProfit: "סה״כ רווח",
    grossLoss: "סה״כ הפסד",
    startCap: "הון התחלתי",
    winRate: "אחוזי הצלחה",
    equity: "שווי התיק",
    avgR: "יחס סיכון/סיכוי",
    winsCount: "עסקאות מרוויחות",
    lossesCount: "עסקאות מפסידות",
    tradeLog: "יומן עסקאות",
    analytics: "ניתוחים",
    calendar: "לוח שנה",
    gallery: "גלריה",
    watchlist: "רשימת מעקב",
    goalsTab: "יעדים",
    connections: "חיבורים",
    settings: "הגדרות",
    connectedStatus: "מחובר",
    disconnectedStatus: "מנותק",
    pasteAndConnect: "התחבר וסנכרן",
    syncTrades: "סנכרן עסקאות עכשיו",
    logoutBtn: "התנתקות מהחשבון",
    authorizationUrl: "הדבק כתובת אימות",
    weeklyGoal: "יעד שבועי",
    updateGoal: "עדכן יעד",
    goalProgress: "התקדמות ליעד",
    completed: "הושלם",
    completion: "השלמה",
    weeklyProfit: "רווח שבועי",
    remaining: "נשאר",
    filters: "סינון",
    searchSymbol: "חפש סימול...",
    allStrategies: "כל האסטרטגיות",
    allTypes: "כל הסוגים",
    viewType: "תצוגה לפי",
    viewDay: "יומי",
    viewWeek: "שבועי",
    viewMonth: "חודשי",
    viewYear: "שנתי",
    viewAll: "כל הזמנים",
    date: "תאריך",
    time: "שעה",
    symbol: "סימבול",
    position: "פוזיציה",
    type: "כיוון",
    strategy: "אסטרטגיה",
    pnl: "רווח/הפסד",
    r: "סיכון:סיכוי",
    actions: "פעולות",
    noTrades: "לא נמצאו עסקאות לתקופה שנבחרה",
    noImages: "אין תמונות של עסקאות עדיין",
    equityCurve: "גרף רווח והפסד",
    equityCurvePercent: "תשואה מצטברת",
    strategyPerf: "ביצועי אסטרטגיה",
    dayPerf: "ביצועים לפי יום",
    hourPerf: "ביצועים לפי שעה",
    performanceTable: "טבלת ביצועים",
    editTrade: "ערוך עסקה",
    newTrade: "עסקה חדשה",
    entryPrice: "כניסה",
    exitPrice: "יציאה",
    stopLoss: "סטופ לוס",
    quantity: "כמות",
    fees: "עמלות",
    tags: "תגיות",
    notes: "הערות",
    viewNotes: "צפה בהערות",
    screenshot: "צילום מסך",
    uploadImage: "העלה תמונה / קישור",
    tradeNumber: "מספר עסקה",
    cancel: "ביטול",
    save: "שמור",
    update: "עדכן",
    sunday: "ראשון",
    monday: "שני",
    tuesday: "שלישי",
    wednesday: "רביעי",
    thursday: "חמישי",
    friday: "שישי",
    saturday: "שבת",
    calStatsTitle: "תצוגת ביצועים",
    viewMonthlyStats: "ביצועים חודשיים",
    viewWeeklyStats: "ביצועים שבועיים",
    viewDailyStats: "ביצועים יומיים",
    totalTrades: "סה״כ עסקאות",
    bestDay: "היום הטוב ביותר",
    worstDay: "היום הגרוע ביותר",
    avgDailyPnl: "ממוצע יומי",
    bestWeek: "השבוע הכי חזק",
    deleteConfirm: "?האם למחוק את העסקה לצמיתות",
    togglePercent: "הצג %",
    backupData: "שמור גיבוי (Backup)",
    restoreData: "טען נתונים (Restore)",
    printPdf: "הדפס / שמור כ-PDF",
    dataRestored: "הנתונים שוחזרו בהצלחה!",
    dataError: "שגיאה בטעינת הקובץ",
    currency: "מטבע",
    theme: "ערכת נושא",
    fontSize: "גודל גופן",
    language: "שפה",
    themeDark: "כהה / מקצועי",
    themeLight: "בהיר / נקי",
    logout: "התנתק",
    loginTitle: "התחברות ל-S Trader",
    registerTitle: "יצירת חשבון",
    forgotPass: "שכחתי סיסמא?",
    username: "שם משתמש",
    password: "סיסמא (אופציונלי)",
    phoneOrEmail: "טלפון או מייל",
    loginBtn: "התחברות",
    registerBtn: "הרשמה",
    recoverBtn: "שחזר חשבון",
    backToLogin: "חזרה להתחברות",
    enterCode: "הזן קוד אימות",
    verifyBtn: "אמת והמשך",
    newPass: "סיסמא חדשה",
    resetPass: "אפס סיסמא",
    recoverySent: "קוד אימות נשלח ל-",
    codeSim: "1234",
    rememberMe: "זכור אותי",
    contactWhatsapp: "צור קשר בוואטסאפ",
    close: "סגור",
    dataManagement: "ניהול נתונים וגיבוי",
    bestPerformers: "סיכום המצטיינים",
    bestTimeframe: "טווח זמן",
    bestPnl: "רווח שיא",
    bestHour: "השעה הכי חזקה",
    bestStrategy: "האסטרטגיה הכי חזקה",
    stat_trades: "עסקאות",
    stat_winrate: "אחוזי הצלחה",
    stat_pnl: "רווח/הפסד",
    stat_avgR: "R ממוצע",
    noData: "אין ביצועים",
    col_day: "יום",
    col_hour: "שעה",
    col_strategy: "אסטרטגיה",
    col_name: "שם",
    cat_strategy: "אסטרטגיה חזקה",
    cat_day: "יום חזק",
    cat_hour: "שעה חזקה",
    clickToToggle: "החלף",
    stats_daily: "יומי",
    stats_weekly: "שבועי",
    stats_monthly: "חודשי",
    stats_yearly: "שנתי",
    selectedDate: "תאריך נבחר",
    selectTradeWarning: "אנא בחר עסקה מהטבלה!",
    shareWinTitle: "עסקה מנצחת!",
    shareLossTitle: "ניתוח עסקה",
    shareText: "צפו בעסקה שלי ב-",
    downloadShareImage: "הורד תמונה לשיתוף",
    generalStatistics: "סטטיסטיקה כללית",
    successRate: "אחוזי הצלחה",
    winStreak: "רצף ניצחונות",
    personalBest: "שיא אישי",
    alertsEncouragement: "התראות ועידוד",
    congratulations: "כל הכבוד!",
    youReachedGoal: "השגת את היעד!",
    almostThere: "כמעט שם!",
    onlyLeft: "נשארו רק",
    left: "!",
    halfwayThere: "חצי דרך!",
    passed50: "עברת 50% מהיעד!",
    needToPush: "צריך להתאמץ!",
    below25: "אתה מתחת ל-25% מהיעד",
    startTrading: "התחל לסחור!",
    noTradesThisPeriod: "עדיין אין עסקאות בתקופה הזו",
    setAGoal: "הגדר יעד!",
    setGoalToTrack: "הגדר יעד כדי להתחיל מעקב",
    comparisons: "השוואות",
    vsPreviousPeriod: "לעומת תקופה קודמת",
    bestVsWorst: "הטוב מול הגרוע",
    totalAchievements: "סך הישגים",
    progressChart: "גרף התקדמות",
    goal: "יעד",
    profit: "רווח",
    period: "תקופה",
    reset: "אפס",
    daily: "יומי",
    weekly: "שבועי",
    monthly: "חודשי",
    yearly: "שנתי",
    enterGoal: "הזן יעד",
    saveGoal: "שמור יעד",
    periodSummary: "סיכום תקופה",
    profitTrades: "עסקאות מרוויחות",
    lossTrades: "עסקאות מפסידות",
    totalLosses: "סה״כ הפסדים",
    netProfit: "סה״כ רווחים",
    weeklyGoalLabel: "יעד שבועי",
    monthlyGoalLabel: "יעד חודשי",
    yearlyGoalLabel: "יעד שנתי",
    dailyGoalLabel: "יעד יומי",
    weeklyProfitLabel: "רווח שבועי",
    monthlyProfitLabel: "רווח חודשי",
    yearlyProfitLabel: "רווח שנתי",
    dailyProfitLabel: "רווח יומי",
    goalCompleted: "!היעד הושלם",
    phSymbolExample: "לדוגמה: AAPL",
    phStrategy: "הקלד את האסטרטגיה...",
    phImageUrl: "הדבק כאן קישור לתמונה...",
    phTags: "לדוגמה: FOMO",
    phTradeNumber: "#123",
    chooseFile: "בחר קובץ",
    max2mbLocal: "מקסימום 2MB (נשמר מקומית)",
    long: "לונג",
    short: "שורט",
    tradesLabel: "עסקאות",
    questionPlaceholder: "שאלת אבטחה",
    answerPlaceholder: "תשובה",
    phoneNumber: "מספר טלפון",
    personalCode: "קוד אישי לשחזור (4 ספרות)",
    adminCode: "קוד מנהל",
    recoverWithPhone: "אימות באמצעות קוד אישי",
    recoverWithQuestion: "אימות באמצעות שאלת אבטחה",
    recoverWithAdmin: "אימות באמצעות קוד מנהל מערכת",
    enterPhone: "הזן מספר טלפון נייד",
    enterPersonalCode: "הזן את הקוד האישי שלך",
    enterAdminCode: "הזן קוד מנהל",
    phoneOrUsername: "מספר טלפון או שם משתמש",
    recoveryMethodLabel: "שיטת שחזור:",
    importBtn: "ייבוא עסקאות",
    exportBtn: "ייצוא עסקאות",
    importTitle: "ייבוא עסקאות מקובץ",
    selectPlatform: "בחר ספק",
    brokerIBKR: "אינטראקטיב ברוקרס",
    brokerTradeStation: "טריידסטיישן",
    importSuccess: "העסקאות יובאו בהצלחה",
    deleteAfterImport: "הקובץ נמחק לאחר הקריאה והנתונים סונכרנו לענן",
    noTradesToExport: "לא נמצאו עסקאות לייצוא",
    securityQuestionLabel: "שאלת אבטחה לשחזור חשבון:",
    securityQuestion1: "מה שם המורה הראשון/ה שלך?\u200F",
    securityQuestion2: "באיזו עיר נולדת?\u200F",
    securityQuestion3: "מה היה שם חיית המחמד הראשונה שלך?\u200F",
    answerLabel: "תשובה (לזכור לשחזור עתידי)",
    mobilePhoneNumber: "מספר טלפון נייד",
    personalCodeLabel: "קוד אישי לשחזור סיסמה (4 ספרות)",
    chooseRecoveryMethod: "בחר אמצעי אימות לשחזור",
    logoutTitle: "?בטוח/ה שברצונך להתנתק",
    logoutWarning: ".ניתן להתחבר שוב בכל עת",
    yes: "כן",
    no: "לא",
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
    mentalTab: "מנטלי",
    mentalStats: "סטטיסטיקות מצב מנטלי",
    mentalDistribution: "התפלגות מצב מנטלי",
    disciplinedTrades: "עסקאות משמעתיות",
    emotionalTrades: "עסקאות רגשיות",
    randomTrades: "עסקאות אקראיות",
    avgPnlPerState: "ממוצע רווח/הפסד למצב"
  }
};

// --- Theme & Style Helpers ---

const getThemeStyles = (theme) => {
  if (theme === 'light') {
    return {
      bgMain: 'bg-gray-100',
      bgCard: 'bg-white',
      bgHeader: 'bg-white',
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-500',
      border: 'border-gray-200',
      inputBg: 'bg-gray-50',
      hoverBg: 'hover:bg-gray-100',
      shadow: 'shadow-sm',
      bestCardBg: 'bg-gradient-to-br from-blue-50 to-white'
    };
  }
  // Default Dark
  return {
    bgMain: 'bg-[#0f172a]',
    bgCard: 'bg-slate-800',
    bgHeader: 'bg-[#1e293b]',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    border: 'border-slate-700',
    inputBg: 'bg-slate-900',
    hoverBg: 'hover:bg-slate-700',
    shadow: 'shadow-lg',
    bestCardBg: 'bg-gradient-to-br from-slate-800 to-slate-900'
  };
};

const INITIAL_SETTINGS = {
  currency: '$',
  theme: 'dark',
  fontSize: 14
};

// --- Helper Functions ---

const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null || isNaN(num)) return '0.00';
  const n = Number(num);

  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
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

const formatCompactNumber = (number) => {
  if (number === 0 || !number || isNaN(number)) return '0';
  return Intl.NumberFormat('en-US', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(number);
};

const calculateMetrics = (trade) => {
  const entry = parseFloat(parseNumberFromCommas(trade.entryPrice.toString()));
  const exit = parseFloat(parseNumberFromCommas(trade.exitPrice.toString()));
  const qty = parseFloat(parseNumberFromCommas(trade.quantity.toString()));
  const stop = parseFloat(parseNumberFromCommas(trade.stopLoss.toString()));
  const fees = parseFloat(parseNumberFromCommas((trade.fees || 0).toString())) || 0;

  if (isNaN(entry) || isNaN(exit) || isNaN(qty)) return { pnl: 0, rMultiple: 0, riskRewardRatio: '0:0' };

  let grossPnl = 0;
  if (trade.type === 'Long') {
    grossPnl = (exit - entry) * qty;
  } else {
    grossPnl = (entry - exit) * qty;
  }

  const netPnl = grossPnl - fees;
  const riskPerShare = Math.abs(entry - stop);
  const totalRisk = riskPerShare * qty;

  let rMultiple = 0;
  let riskRewardRatio = '0:0';

  if (totalRisk > 0) {
    rMultiple = netPnl / totalRisk;
    riskRewardRatio = `1:${Math.abs(rMultiple).toFixed(2)}`;
  }

  return {
    pnl: netPnl,
    rMultiple: parseFloat(rMultiple.toFixed(2)),
    riskRewardRatio,
    riskPerShare,
    totalRisk
  };
};

// Format numbers compactly for calendar (e.g., 1.2K, 10K, 1M)
const formatCompactCalendar = (num) => {
  const absNum = Math.abs(num);
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (absNum >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toFixed(0);
};


const getDayOfWeek = (dateString) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(dateString).getDay()];
};

const getHourBucket = (timeString) => {
  if (!timeString) return 'Unknown';
  const hour = parseInt(timeString.split(':')[0], 10);
  return `${hour}:00 - ${hour + 1}:00`;
};

const getWeekDates = (date = new Date()) => {
  const currentDay = date.getDay(); // 0 = Sunday
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { start: startOfWeek, end: endOfWeek };
};

// --- Components ---

const ShareModal = ({ isOpen, onClose, trade, t, styles, currency }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const modalRef = useRef(null);

  if (!isOpen || !trade) return null;

  const win = trade.pnl > 0;

  const handleDownloadImage = async () => {
    if (!modalRef.current) return;

    setIsGenerating(true);

    // Clean up old iframes first
    document.querySelectorAll('.html2canvas-container').forEach(el => el.remove());

    try {
      const canvas = await html2canvas(modalRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
        removeContainer: true,
      });

      // Clean up immediately after capture
      setTimeout(() => {
        document.querySelectorAll('.html2canvas-container').forEach(el => el.remove());
      }, 100);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `S-Trader-${trade.symbol}-${trade.date}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setIsGenerating(false);
        }, 100);
      }, 'image/png');

    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
      setIsGenerating(false);
      // Clean up on error too
      document.querySelectorAll('.html2canvas-container').forEach(el => el.remove());
    }
  };

  const handleShareToWhatsApp = async () => {
    if (!modalRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(modalRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
        logging: false,
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          // Create a file from the blob
          const file = new File([blob], `trade-${trade.symbol}.png`, { type: 'image/png' });

          // Check if Web Share API is available and supports files
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: `${win ? '🎉' : '📊'} ${trade.symbol} Trade`,
                text: `${win ? 'Winning' : ''} Trade: ${currency}${formatNumber(trade.pnl)}`
              });
            } catch (err) {
              if (err.name !== 'AbortError') {
                // Fallback: download the image
                const link = document.createElement('a');
                link.download = `trade-${trade.symbol}-${trade.date}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                alert('Image downloaded! Please share it manually to WhatsApp.');
              }
            }
          } else {
            // Fallback: download the image
            const link = document.createElement('a');
            link.download = `trade-${trade.symbol}-${trade.date}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            alert('Image downloaded! Please share it manually to WhatsApp.');
          }
        }
        setIsGenerating(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image');
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        ref={modalRef}
        className={`${styles.bgCard} rounded-xl p-8 max-w-sm w-full border ${styles.border} shadow-2xl relative overflow-hidden text-center`}
        onClick={e => e.stopPropagation()}
      >
        {/* Confetti Effect for Wins */}
        {win && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#FCD34D', '#34D399', '#60A5FA', '#F87171'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </div>
        )}

        <button onClick={onClose} className={`absolute top-4 right-4 ${styles.textSecondary} hover:text-white z-10`}>
          <X size={24} />
        </button>

        {/* Logo Placeholder */}
        <div className="mb-6 flex justify-center z-10 relative">
          <div className={`p-4 rounded-full ${win ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-400'} shadow-lg`}>
            <Trophy size={48} />
          </div>
        </div>

        <h3 className={`text-2xl font-extrabold ${styles.textPrimary} mb-2 relative z-10`}>{win ? t('shareWinTitle') : t('shareLossTitle')}</h3>

        <div className="bg-slate-900/80 rounded-lg p-6 mb-6 border border-slate-700/50 relative z-10 backdrop-blur-sm">
          <div className="text-4xl font-black text-white mb-2">{trade.symbol}</div>
          <div className={`text-5xl font-black ${win ? 'text-emerald-400' : 'text-rose-400'} mb-4`}>
            {win ? '+' : ''}{currency}{formatCompactNumber(trade.pnl)}
          </div>

          {/* Additional Trade Details */}
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-300 font-mono border-t border-slate-700/50 pt-4">
            <div className="text-right pr-2 border-r border-slate-700/50">
              <div className="text-slate-500 uppercase text-xs mb-1">{t('date')}</div>
              <div>{trade.date}</div>
            </div>
            <div className="text-left pl-2">
              <div className="text-slate-500 uppercase text-xs mb-1">{t('type')}</div>
              <div>{trade.type}</div>
            </div>
            <div className="text-right pr-2 border-r border-slate-700/50">
              <div className="text-slate-500 uppercase text-xs mb-1">{t('strategy')}</div>
              <div className="truncate">{trade.strategy}</div>
            </div>
            <div className="text-left pl-2">
              <div className="text-slate-500 uppercase text-xs mb-1">{t('r')}</div>
              <div>{trade.riskRewardRatio && trade.riskRewardRatio !== '0:0' ? trade.riskRewardRatio : `${trade.rMultiple}R`}</div>
            </div>
          </div>
        </div>

        {/* Screenshot Instruction */}
        <div className="w-full py-4 px-6 bg-blue-600/20 border-2 border-blue-500 text-white rounded-lg font-bold text-center relative z-10">
          <div className="flex flex-col items-center gap-2">
            <Camera size={32} className="text-blue-400" />
            <div className="text-lg font-bold">📸 לצילום מסך</div>
            <div className="text-sm text-blue-200">
              {isRTL ? (
                <>
                  <div>Windows: לחץ <kbd className="px-2 py-1 bg-slate-700 rounded">Win + Shift + S</kbd></div>
                  <div className="mt-1">או <kbd className="px-2 py-1 bg-slate-700 rounded">Print Screen</kbd></div>
                </>
              ) : (
                <>
                  <div>Press <kbd className="px-2 py-1 bg-slate-700 rounded">Win + Shift + S</kbd></div>
                  <div className="mt-1">or <kbd className="px-2 py-1 bg-slate-700 rounded">Print Screen</kbd></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ title, icon: Icon, data, t, styles, currency, isRTL }) => {
  if (!data || data.count < MIN_TRADES_FOR_STATS) {
    return (
      <div className={`${styles.bgCard} rounded-2xl border ${styles.border} shadow-lg p-5 min-h-[110px] flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-slate-700 flex items-center justify-center text-slate-300">
            <Icon size={20} />
          </div>
          <div>
            <div className={`text-[10px] uppercase tracking-wider ${styles.textSecondary} font-bold`}>
              {title}
            </div>
            <div className={`text-lg font-extrabold ${styles.textPrimary}`}>—</div>
            <div className={`text-xs ${styles.textSecondary} italic`}>{t('noData')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.bgCard} rounded-2xl border ${styles.border} shadow-lg p-5 min-h-[110px] flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-slate-700 flex items-center justify-center text-slate-300">
          <Icon size={20} />
        </div>
        <div>
          <div className={`text-[10px] uppercase tracking-wider ${styles.textSecondary} font-bold`}>
            {title}
          </div>
          <div className={`text-lg font-extrabold ${styles.textPrimary}`}>
            {data.displayName || data.name}
          </div>
          <div className={`text-xs ${styles.textSecondary}`}>
            {data.winRate != null ? `${data.winRate.toFixed(1)}% win rate • ` : ''}
            {data.count ?? 0} trades
          </div>
        </div>
      </div>
    </div>
  );
};

const PerformanceTable = ({ title, data, colNameKey, t, styles, currency, isRTL, icon: Icon = Target }) => {
  const sortedData = data
    .filter(d => d.count >= MIN_TRADES_FOR_STATS)
    .sort((a, b) => b.winRate - a.winRate);

  if (sortedData.length === 0) {
    return (
      <div className={`${styles.bgCard} rounded-xl p-6 border ${styles.border} shadow-lg flex flex-col items-center justify-center text-center h-64`}>
        <div className={`p-3 rounded-full bg-slate-700/30 ${styles.textSecondary} mb-3`}>
          <TableIcon size={24} />
        </div>
        <h3 className={`${styles.textPrimary} font-bold mb-2`}>{title}</h3>
        <p className={styles.textSecondary}>{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.bgCard} rounded-xl shadow-lg overflow-hidden`}>
      <div className="px-4 py-3">
        <h3 className={`font-bold ${styles.textPrimary} uppercase text-sm flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Icon size={16} className="text-blue-500" /> {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className={`${styles.inputBg} ${styles.textSecondary} text-xs uppercase font-bold`}>
            <tr>
              <th className={`p-3 border-b ${styles.border} ${isRTL ? 'text-right' : 'text-left'} w-1/3`}>{t(colNameKey)}</th>
              <th className={`p-3 border-b ${styles.border} text-center w-1/3`}>{t('stat_winrate')}</th>
              <th className={`p-3 border-b ${styles.border} text-center w-1/6`}>{t('stat_trades')}</th>
              <th className={`p-3 border-b ${styles.border} text-center w-1/4`}>{t('stat_pnl')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${styles.border}`}>
            {sortedData.map((row, index) => (
              <tr key={index} className={`${styles.hoverBg} transition-colors text-sm ${index === 0 ? 'bg-blue-500/10' : ''}`}>
                <td className={`p-3 font-medium ${styles.textPrimary} ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-2">
                    {row.displayName || row.name}
                    {index === 0 && <span className="text-yellow-500">★</span>}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full max-w-[150px] h-3 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${row.winRate >= 50 ? 'bg-emerald-500' : 'bg-blue-500'} transition-all duration-1000 ease-out rounded-full`}
                        style={{ width: `${row.winRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-emerald-500">{row.winRate.toFixed(2)}%</span>
                  </div>
                </td>
                <td className={`p-3 text-center ${styles.textSecondary}`}>{row.count}</td>
                <td className={`p-3 text-center font-bold ${row.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {row.pnl > 0 ? '+' : ''}{currency}{formatNumber(row.pnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



const NoteViewerModal = ({ isOpen, onClose, notes, styles, t, isRTL }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div
        className={`${styles.bgCard} ${styles.textPrimary} rounded-2xl p-8 max-w-lg w-full border ${styles.border} shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden`}
        onClick={e => e.stopPropagation()}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Decorative Background Element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} ${styles.textSecondary} hover:text-blue-400 transition-colors p-1 hover:bg-slate-700/50 rounded-full`}
        >
          <X size={24} />
        </button>

        <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row' : 'flex-row'}`}>
          <div className="p-3 bg-yellow-500/20 rounded-xl">
            <StickyNote className="text-yellow-400" size={28} />
          </div>
          <h3 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {t('notes')}
          </h3>
        </div>

        <div className={`${styles.inputBg} p-6 rounded-2xl border ${styles.border} whitespace-pre-wrap max-h-[50vh] overflow-y-auto text-lg leading-relaxed shadow-inner font-medium text-slate-200 custom-scrollbar`}>
          {notes || (isRTL ? "אין הערות זמינות לעסקה זו." : "No notes available for this trade.")}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-blue-500/20"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subValue, icon: Icon, trend, isRTL, isInput, onInputChange, inputValue, currency, styles }) => (
  <div className={`${styles.bgCard} rounded-xl p-5 border ${styles.border} ${styles.shadow} flex flex-col justify-between h-32 ${isRTL ? 'text-right' : ''}`}>
    <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className="flex-1 overflow-hidden">
        <p className={`${styles.textSecondary} text-xs font-bold uppercase tracking-wider truncate`}>{title}</p>

        {isInput ? (
          <div className={`flex items-center mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className={`text-2xl font-bold ${styles.textPrimary}`}>{currency}</span>
            <input
              type="text"
              placeholder="0 (e.g. 10k, 1m)"
              value={formatNumberWithCommas(inputValue)}
              onChange={(e) => {
                const rawValue = parseNumberFromCommas(e.target.value);
                if (rawValue === '' || !isNaN(parseFloat(rawValue))) {
                  onInputChange({ target: { value: rawValue } });
                }
              }}
              className={`bg-transparent text-2xl font-bold ${styles.textPrimary} w-full outline-none border-b border-dashed ${styles.border} focus:border-blue-500 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
              maxLength={15}
            />
          </div>
        ) : (
          <h3
            className={`text-2xl font-bold mt-1 truncate ${trend === 'up' ? 'text-emerald-500' :
              trend === 'down' ? 'text-rose-500' : styles.textPrimary}`}
            title={value.startsWith(currency) ? value : `${currency}${value}`}
          >
            {value}
          </h3>
        )}
      </div>
      <div className={`p-2.5 rounded-lg bg-gray-500/10 ${styles.textSecondary} flex-shrink-0 ${isRTL ? 'mr-3' : 'ml-3'}`}>
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

const GalleryView = ({ trades, isRTL: ignoredIsRTL, t, onEdit, styles, currency }) => {
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
            alt="Full Screen"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

const ConnectionsView = ({ t, styles, isRTL, lang, manualUrl, setManualUrl, isColmexConnected, setIsColmexConnected, isSyncing, onSyncTrades, onResetColmexData, setActiveTab, username, journalType = 'stocks' }) => {
  const [logs, setLogs] = React.useState(colmexService.getLogs());
  const [stats, setStats] = React.useState(() => JSON.parse(localStorage.getItem(`colmex_stats_${journalType}`) || '{"totalSynced":0}'));
  const [accounts, setAccounts] = React.useState([]);
  const [syncError, setSyncError] = React.useState(null);
  const [isAddingAccount, setIsAddingAccount] = React.useState(false);
  const [showSecret, setShowSecret] = React.useState(false);
  const [isRealAccount, setIsRealAccount] = React.useState(false);
  const [syncStartDate, setSyncStartDate] = React.useState(() => {
    const ignoreBefore = localStorage.getItem(`colmex_ignore_before_${journalType}`);
    if (ignoreBefore) return new Date(ignoreBefore).toISOString().split('T')[0];
    
    const saved = localStorage.getItem(`colmex_last_manual_date_${journalType}`);
    if (saved) return saved;

    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [syncEndDate, setSyncEndDate] = React.useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Listen for reset events to update the date box
  React.useEffect(() => {
    const handleReset = () => {
      const ignoreBefore = localStorage.getItem(`colmex_ignore_before_${journalType}`);
      if (ignoreBefore) setSyncStartDate(new Date(ignoreBefore).toISOString().split('T')[0]);
    };
    window.addEventListener(`colmex_reset_${journalType}`, handleReset);
    return () => window.removeEventListener(`colmex_reset_${journalType}`, handleReset);
  }, [journalType]);
  const [detectedCode, setDetectedCode] = React.useState(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code') || colmexService.extractCodeFromUrl(window.location.href);
    if (code) {
      setDetectedCode(code);
      // Clear the URL parameters without refreshing to prevent the link from persisting
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const handleLogsUpdate = () => setLogs(colmexService.getLogs());
    const handleStatsUpdate = () => setStats(JSON.parse(localStorage.getItem('colmex_stats') || '{"totalSynced":0}'));

    window.addEventListener('colmex_logs_updated', handleLogsUpdate);
    window.addEventListener('colmex_stats_updated', handleStatsUpdate);

    if (isColmexConnected) {
      colmexService.getAccounts().then(setAccounts).catch(err => setSyncError(err.message));
    }

    return () => {
      window.removeEventListener('colmex_logs_updated', handleLogsUpdate);
      window.removeEventListener('colmex_stats_updated', handleStatsUpdate);
    };
  }, [isColmexConnected]);

  const handleSync = async () => {
    setSyncError(null);
    try {
      // Create local start midnight time
      const startParts = syncStartDate.split('-');
      const localStartDate = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0);
      
      // Create local end time (end of day)
      const endParts = syncEndDate.split('-');
      const localEndDate = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59);
      
      await onSyncTrades(false, localStartDate.toISOString(), isRealAccount, localEndDate.toISOString());
    } catch (err) {
      setSyncError(err.message || (lang === 'he' ? 'שגיאה בסנכרון הנתונים' : 'Error syncing data'));
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Join Colmex Link - Placed at Top for visibility */}
      <a 
        href="https://lp-colmexpro.com/service/?affiliateid=41318" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex flex-col sm:flex-row items-center gap-3 text-[11px] text-blue-400/90 hover:text-blue-400 transition-all p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 group"
      >
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform shrink-0">
          <ExternalLink size={14} />
        </div>
        <span className="text-center sm:text-right">
          {lang === 'he' 
            ? 'עדיין אין לך חשבון בקולמקס? תוכל לפתוח אחד כאן ולהתחיל לסנכרן את העסקאות שלך באופן אוטומטי ליומן.'
            : 'Don\'t have a Colmex account yet? Open one here and start syncing your trades automatically.'}
        </span>
      </a>
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 ${styles.bgCard} rounded-xl border ${styles.border}`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${isColmexConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'}`}>
            <RefreshCw size={24} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${styles.textPrimary}`}>
              {lang === 'he' ? 'סנכרון קולמקס פרו' : 'Colmex Pro Sync'}
            </h2>
            <p className={`text-xs ${styles.textSecondary}`}>
              {isColmexConnected ? (lang === 'he' ? 'מחובר ומסונכרן' : 'Connected & Synced') : (lang === 'he' ? 'ממתין לחיבור' : 'Waiting for connection')}
            </p>
          </div>
        </div>
        <div>
          {isColmexConnected && (
            <button
              onClick={() => {
                const confirmMsg = lang === 'he' ? 'האם אתה בטוח שברצונך לנתק את החשבון וכל החיבורים הפעילים?' : 'Are you sure you want to disconnect your account and all active connections?';
                if (window.confirm(confirmMsg)) {
                  colmexService.logout(username);
                  if (setIsColmexConnected) setIsColmexConnected(false);
                  setAccounts([]);
                  setDetectedCode(null);
                }
              }}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg font-bold text-sm transition-all border border-rose-500/20"
            >
              {lang === 'he' ? 'נתק חשבון' : 'Disconnect'}
            </button>
          )}
        </div>
      </div>

      {syncError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-sm font-bold animate-in fade-in duration-300">
          {syncError}
        </div>
      )}

      {/* Connection Logic Area */}
      <div className={`${styles.bgCard} p-6 rounded-xl border ${styles.border} shadow-lg`}>
        {isAddingAccount ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-2 gap-2">
              <h3 className={`text-lg font-bold ${styles.textPrimary}`}>
                {lang === 'he' ? 'חיבור חשבון ידני' : 'Manual Account Sync'}
              </h3>
              <button
                onClick={() => colmexService.initiateLogin()}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                {lang === 'he' ? 'פתח דף התחברות לקבלת קישור' : 'Open Login Page to get link'} <Globe size={12} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={`text-xs font-bold ${styles.textSecondary} uppercase tracking-wider`}>{lang === 'he' ? 'מזהה חשבון / כינוי' : 'Account ID / Nickname'}</label>
                <input
                  id="manual-account-id"
                  type="text"
                  placeholder={lang === 'he' ? 'למשל: חשבון דמו' : 'e.g. My Demo'}
                  className={`w-full p-3 ${styles.inputBg} border ${styles.border} rounded-lg text-white font-bold outline-none`}
                />
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-bold ${styles.textSecondary} uppercase tracking-wider`}>{lang === 'he' ? 'קישור סנכרון' : 'Sync URL'}</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={manualUrl || ""}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className={`w-full p-3 pl-10 ${styles.inputBg} border ${styles.border} rounded-lg text-white font-mono text-xs outline-none`}
                  />
                  <button onClick={() => setShowSecret(!showSecret)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const idVal = document.getElementById('manual-account-id')?.value;
                  if (!manualUrl) return alert("Please enter URL");
                  const code = colmexService.extractCodeFromUrl(manualUrl);
                  if (code) {
                    colmexService.exchangeCodeForToken(code, null, username).then(() => {
                      setIsAddingAccount(false);
                      if (setIsColmexConnected) setIsColmexConnected(true);
                      colmexService.getAccounts().then(accs => {
                        if (accs && accs.length > 0) {
                          setAccounts(accs);
                        } else if (idVal) {
                          setAccounts([{ id: idVal, name: idVal, accountName: idVal }]);
                        }
                      });
                    }).catch(err => alert("Error: " + err.message));
                  } else {
                    alert("Invalid URL");
                  }
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg"
              >
                {lang === 'he' ? 'סיום חיבור' : 'FINALIZE LINK'}
              </button>
              <button onClick={() => setIsAddingAccount(false)} className={`px-6 py-3 ${styles.bgCard} border ${styles.border} ${styles.textSecondary} rounded-lg font-bold`}>
                {lang === 'he' ? 'ביטול' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : detectedCode ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500">
              <ShieldCheck size={48} />
            </div>
            <h3 className={`text-xl font-bold ${styles.textPrimary}`}>
              {lang === 'he' ? 'קישור זוהה!' : 'Link Detected!'}
            </h3>
            <p className={`text-sm ${styles.textSecondary} max-w-xs`}>
              {lang === 'he' ? 'זוהתה בקשת התחברות מוצלחת. אנא אשר את הסנכרון.' : 'Successful login detected. Please confirm sync.'}
            </p>
            <button
              onClick={() => {
                colmexService.exchangeCodeForToken(detectedCode, null, username).then(() => {
                  setDetectedCode(null);
                  if (setIsColmexConnected) setIsColmexConnected(true);
                  colmexService.getAccounts().then(setAccounts);
                });
              }}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20"
            >
              {lang === 'he' ? 'אשר וסנכרן' : 'CONFIRM & SYNC'}
            </button>
          </div>
        ) : !isColmexConnected ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-6 bg-slate-800/50 rounded-full text-slate-600">
              <div className="relative">
                <WifiOff size={48} />
                <Globe size={20} className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className={`text-lg font-bold ${styles.textPrimary}`}>{lang === 'he' ? 'המערכת אינה מחוברת' : 'System Not Connected'}</h3>
              <p className={`text-sm ${styles.textSecondary} max-w-xs`}>{lang === 'he' ? 'חבר את חשבון הקולמקס שלך לסנכרון אוטומטי' : 'Connect your Colmex account for automatic sync'}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <button
                onClick={() => colmexService.initiateLogin()}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                {lang === 'he' ? 'התחבר לקולמקס' : 'Login to Colmex'}
              </button>
              <button
                onClick={() => {
                  setIsAddingAccount(true);
                  setManualUrl("");
                }}
                className={`flex-1 py-4 ${styles.bgCard} border ${styles.border} ${styles.textSecondary} rounded-xl font-bold hover:text-white transition-colors`}
              >
                {lang === 'he' ? 'חיבור ידני' : 'Manual Link'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-700/50 pb-4">
              <h3 className={`font-bold ${styles.textPrimary} flex items-center gap-2`}>
                <ShieldCheck size={18} className="text-emerald-500" /> {lang === 'he' ? 'חשבונות פעילים' : 'Active Accounts'}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsAddingAccount(true);
                    setManualUrl("");
                  }}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded"
                >
                  <Plus size={14} /> {lang === 'he' ? 'הוסף חשבון' : 'Add Account'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`text-[10px] uppercase tracking-widest ${styles.textSecondary} border-b ${styles.border}`}>
                    <th className="text-right py-2">{lang === 'he' ? 'מזהה' : 'ID'}</th>
                    <th className="text-right py-2">{lang === 'he' ? 'שם' : 'Name'}</th>
                    <th className="text-left py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {accounts && accounts.length > 0 ? accounts.map(acc => (
                    <tr key={acc.id} className="text-sm">
                      <td className="py-3 font-mono text-xs text-right">{colmexService.maskId(acc.id)}</td>
                      <td className={`py-3 font-bold ${styles.textPrimary} text-right`}>{acc.accountName || acc.name || 'Master Account'}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => setAccounts(curr => curr.filter(a => a.id !== acc.id))} className="text-rose-500/50 hover:text-rose-500 p-1">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr className="text-sm opacity-80">
                      <td className="py-3 font-mono text-xs text-right">{colmexService.maskId('CLM-MASTER')}</td>
                      <td className={`py-3 font-bold ${styles.textPrimary} text-right`}>{lang === 'he' ? 'חשבון מאסטר' : 'Master Account'}</td>
                      <td className="py-3 text-right"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Activity Logs */}
      <div className={`${styles.bgCard} rounded-xl border ${styles.border} overflow-hidden`}>
        <div className={`px-4 py-3 bg-black/20 border-b ${styles.border} flex flex-col gap-4`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-blue-500" />
              <span className={`text-xs font-bold ${styles.textSecondary} uppercase tracking-wider`}>
                {lang === 'he' ? 'יומן סנכרון' : 'Sync Log'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onResetColmexData}
                className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors group"
                title={lang === 'he' ? 'איפוס נתוני ברוקר' : 'Reset Broker Data'}
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors group"
                title={lang === 'he' ? 'סנכרן עכשיו' : 'Sync Now'}
              >
                <RefreshCw size={14} className={`${isSyncing ? 'animate-spin text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto bg-black/10 p-2 rounded-lg sm:bg-transparent sm:p-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <div className="flex flex-col w-full sm:w-auto">
                <span className="text-[9px] text-slate-500 font-bold uppercase mb-1 sm:hidden">{lang === 'he' ? 'עד תאריך' : 'To Date'}</span>
                <input 
                  type="date"
                  value={syncEndDate}
                  onChange={(e) => setSyncEndDate(e.target.value)}
                  className={`w-full sm:w-auto bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1 text-[10px] ${styles.textPrimary} focus:border-blue-500/50 outline-none transition-all`}
                />
              </div>
              
              <span className="hidden sm:block text-[10px] text-slate-500 font-bold uppercase">{lang === 'he' ? 'עד' : 'To:'}</span>
              
              <div className="flex flex-col w-full sm:w-auto">
                <span className="text-[9px] text-slate-500 font-bold uppercase mb-1 sm:hidden">{lang === 'he' ? 'סנכרן מ' : 'Sync From'}</span>
                <input 
                  type="date"
                  value={syncStartDate}
                  onChange={(e) => {
                    setSyncStartDate(e.target.value);
                    localStorage.setItem(`colmex_last_manual_date_${journalType}`, e.target.value);
                  }}
                  className={`w-full sm:w-auto bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1 text-[10px] ${styles.textPrimary} focus:border-blue-500/50 outline-none transition-all`}
                />
              </div>
              <span className="hidden sm:block text-[10px] text-slate-500 font-bold uppercase">{lang === 'he' ? 'סנכרן מ' : 'Sync from:'}</span>
            </div>
          </div>
        </div>


        <div className="p-4 h-48 overflow-y-auto font-mono text-[11px] bg-black/10">
          {(logs || []).length === 0 ? (
            <div className={`h-full flex items-center justify-center ${styles.textSecondary} opacity-30`}>
              {lang === 'he' ? 'אין פעילות רשומה' : 'No activity logged'}
            </div>
          ) : (
            <div className="space-y-1.5">
              {(logs || []).map((log, idx) => (
                <div key={`${log.id}-${idx}`} className="flex gap-3 border-b border-gray-800/30 pb-1.5 last:border-0 hover:bg-white/5 transition-colors p-1 rounded">
                  <span className="text-blue-400 font-bold shrink-0">[{log.time}]</span>
                  <span className={`${log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : styles.textSecondary}`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end p-2">
        <button onClick={() => setActiveTab('journal')} className={`px-6 py-2 ${styles.bgCard} border ${styles.border} ${styles.textSecondary} rounded-lg font-bold hover:text-white transition-all shadow-md`}>
          {t('close')}
        </button>
      </div>
    </div>
  );
};


const SettingsView = ({ settings, setSettings, t, styles, isRTL, lang, setLang, onClose, onExport, onImport, onPrint, fileRef, onLogout }) => {
  return (
    <div className={`w-full ${styles.bgCard} rounded-xl p-6 border ${styles.border} shadow-lg relative`}>

      <h2 className={`text-xl font-bold ${styles.textPrimary} mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Settings className="text-blue-500" size={20} /> {t('settings')}
      </h2>

      <div className="space-y-3">

        {/* Language */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${styles.inputBg} border ${styles.border} ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className={`font-bold ${styles.textPrimary} text-sm flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Languages size={16} /> {t('language')}
            </h3>
          </div>
          <div className="flex gap-1.5 bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => setLang('he')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${lang === 'he' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              עברית
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${lang === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              English
            </button>
          </div>
        </div>

        {/* Currency */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${styles.inputBg} border ${styles.border} ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className={`font-bold ${styles.textPrimary} text-sm flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Coins size={16} /> {t('currency')}
            </h3>
          </div>
          <div className="flex gap-2">
            {['$', '€', '₪'].map(cur => (
              <button
                key={cur}
                onClick={() => setSettings({ ...settings, currency: cur })}
                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${settings.currency === cur ? 'bg-blue-600 text-white shadow-lg scale-105' : `${styles.bgCard} ${styles.textSecondary} hover:bg-gray-500/20`}`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${styles.inputBg} border ${styles.border} ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className={`font-bold ${styles.textPrimary} text-sm flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Palette size={16} /> {t('theme')}
            </h3>
          </div>
          <div className="flex gap-1.5 bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => setSettings({ ...settings, theme: 'dark' })}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${settings.theme === 'dark' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              {t('themeDark')}
            </button>
            <button
              onClick={() => setSettings({ ...settings, theme: 'light' })}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${settings.theme === 'light' ? 'bg-white text-gray-900 shadow' : 'text-slate-400 hover:text-white'}`}
            >
              {t('themeLight')}
            </button>
          </div>
        </div>

        {/* Data Management (Import / Export) */}
        <div className={`flex flex-col gap-3 p-3 rounded-lg ${styles.inputBg} border ${styles.border}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Database size={16} className="text-blue-500" />
            <h3 className={`font-bold ${styles.textPrimary} text-sm`}>{t('dataManagement')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onExport}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all border ${styles.border}`}
            >
              <FileDown size={16} />
              <span className="text-xs font-bold">{t('exportBtn')}</span>
            </button>
            <button
              onClick={onImport}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg`}
            >
              <FileUp size={16} />
              <span className="text-xs font-bold">{t('importBtn')}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-bold text-sm transition-colors`}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const CalendarView = ({ trades, isRTL, t, onDayClick, styles, currency, lang }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('monthly');

  // Default to today's date
  const getTodayDateStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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
  const monthName = currentDate.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthData = useMemo(() => {
    const dailyMap = {};
    let totalPnl = 0;
    let totalTrades = 0;
    let wins = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let maxDay = { pnl: -Infinity, date: '' };
    let minDay = { pnl: Infinity, date: '' };
    const weeklyMap = {};

    trades.forEach(trade => {
      const d = new Date(trade.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!dailyMap[day]) dailyMap[day] = { pnl: 0, count: 0 };
        dailyMap[day].pnl += trade.pnl;
        dailyMap[day].count += 1;

        totalPnl += trade.pnl;
        totalTrades += 1;
        if (trade.pnl > 0) {
          wins += 1;
          grossProfit += trade.pnl;
        } else {
          grossLoss += trade.pnl;
        }

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const weekNum = Math.ceil((day + firstDayOfMonth) / 7);
        if (!weeklyMap[weekNum]) weeklyMap[weekNum] = 0;
        weeklyMap[weekNum] += trade.pnl;
      }
    });

    Object.keys(dailyMap).forEach(day => {
      const val = dailyMap[day].pnl;
      if (val > maxDay.pnl) maxDay = { pnl: val, date: `${day}/${month + 1}` };
      if (val < minDay.pnl) minDay = { pnl: val, date: `${day}/${month + 1}` };
    });

    const activeDays = Object.keys(dailyMap).length;
    const avgDaily = activeDays > 0 ? totalPnl / activeDays : 0;

    let bestWeek = { pnl: -Infinity, week: 0, trades: 0, wins: 0, startDate: '', endDate: '' };
    Object.keys(weeklyMap).forEach(w => {
      if (weeklyMap[w] > bestWeek.pnl) {
        // Calculate week dates
        const weekNum = parseInt(w);
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const startDay = (weekNum - 1) * 7 - firstDayOfMonth + 1;
        const endDay = Math.min(startDay + 6, days);

        // Count trades and wins for this week
        let weekTrades = 0;
        let weekWins = 0;
        trades.forEach(trade => {
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
          endDate: `${endDay}/${month + 1}`
        };
      }
    });

    return {
      dailyMap, totalPnl, grossProfit, grossLoss, totalTrades,
      winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
      worstDay: minDay.pnl !== Infinity ? minDay : { pnl: 0, date: '-' },
      maxDay: maxDay.pnl !== -Infinity ? maxDay : { pnl: 0, date: '-' },
      avgDaily,
      bestWeek: bestWeek.pnl !== -Infinity ? bestWeek : { pnl: 0, week: '-' }
    };
  }, [trades, month, year]);

  const weekDays = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];
  const weekDaysShort = lang === 'he' ? weekDays : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekDaysFull = lang === 'he' ? weekDays : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const renderSidebar = () => {
    return (
      <div className={`flex flex-col gap-4 p-4 ${styles.bgCard} bg-opacity-50 rounded-lg border ${styles.border} h-full ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="mb-2">
          <label className={`text-xs font-bold ${styles.textSecondary} uppercase block mb-2`}>{t('calStatsTitle')}</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className={`w-full ${styles.inputBg} border ${styles.border} ${styles.textPrimary} text-sm rounded-md p-2 outline-none`}
          >
            <option value="monthly">{t('viewMonthlyStats')}</option>
            <option value="weekly">{t('viewWeeklyStats')}</option>
            <option value="daily">{t('viewDailyStats')}</option>
          </select>
        </div>

        <div className="space-y-4">
          {viewMode === 'monthly' && (
            <>
              <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                <div className={`text-xs ${styles.textSecondary}`}>{t('netPnl')}</div>
                <div className={`text-xl font-bold ${monthData.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {currency}{formatNumber(monthData.totalPnl)}
                </div>
              </div>

              <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                <div className={`text-xs ${styles.textSecondary}`}>{t('totalTrades')}</div>
                <div className={`text-xl font-bold ${styles.textPrimary}`}>{monthData.totalTrades}</div>
              </div>

              <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                <div className={`text-xs ${styles.textSecondary}`}>{t('winRate')}</div>
                <div className={`text-xl font-bold text-blue-500`}>{monthData.winRate.toFixed(1)}%</div>
              </div>

              <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                <div className={`text-xs ${styles.textSecondary}`}>{t('bestDay')} ({monthData.maxDay.date})</div>
                <div className="text-lg font-bold text-emerald-500">
                  {monthData.maxDay.pnl > 0 ? '+' : ''}{currency}{formatNumber(monthData.maxDay.pnl)}
                </div>
              </div>

              <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                <div className={`text-xs ${styles.textSecondary}`}>{t('worstDay')} ({monthData.worstDay.date})</div>
                <div className="text-lg font-bold text-rose-500">
                  {monthData.worstDay.pnl > 0 ? '+' : ''}{currency}{formatNumber(monthData.worstDay.pnl)}
                </div>
              </div>
            </>
          )}

          {viewMode === 'daily' && (
            <>
              {/* Selected Date Display */}
              {selectedCalendarDate && (
                <div className={`${styles.bgCard} p-4 rounded border ${styles.border} mb-4`}>
                  <div className={`text-xs ${styles.textSecondary} font-bold mb-1`}>
                    {lang === 'he' ? 'תאריך נבחר' : 'Selected Date'}
                  </div>
                  <div className={`text-lg font-bold ${styles.textPrimary}`}>
                    {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              )}

              {selectedCalendarDate ? (() => {
                // Calculate stats for selected day
                const dayTrades = trades.filter(t => t.date === selectedCalendarDate);
                const dailyPnl = dayTrades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);
                const wins = dayTrades.filter(t => (parseFloat(t.pnl) || 0) > 0).length;
                const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;
                const avgR = dayTrades.length > 0
                  ? dayTrades.reduce((acc, t) => acc + (parseFloat(t.rMultiple) || 0), 0) / dayTrades.length
                  : 0;

                return (
                  <>
                    <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                      <div className={`text-xs ${styles.textSecondary}`}>
                        {lang === 'he' ? 'רווח/הפסד יומי' : 'Daily P/L'}
                      </div>
                      <div className={`text-xl font-bold ${dailyPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {dailyPnl > 0 ? '+' : ''}{currency}{formatNumber(dailyPnl)}
                      </div>
                    </div>

                    <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                      <div className={`text-xs ${styles.textSecondary}`}>
                        {lang === 'he' ? 'עסקאות' : 'Trades'}
                      </div>
                      <div className={`text-xl font-bold ${styles.textPrimary}`}>{dayTrades.length}</div>
                    </div>

                    <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                      <div className={`text-xs ${styles.textSecondary}`}>
                        {lang === 'he' ? 'אחוז הצלחה' : 'Win Rate'}
                      </div>
                      <div className="text-xl font-bold text-blue-500">{winRate.toFixed(1)}%</div>
                    </div>

                    <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                      <div className={`text-xs ${styles.textSecondary}`}>
                        {lang === 'he' ? 'ממוצע R' : 'Avg R'}
                      </div>
                      <div className="text-xl font-bold text-blue-400">{avgR.toFixed(2)}R</div>
                    </div>
                  </>
                );
              })() : (
                <div className={`${styles.bgCard} p-4 rounded border ${styles.border} text-center`}>
                  <div className={`text-sm ${styles.textSecondary}`}>
                    {lang === 'he' ? 'לחץ על יום בלוח השנה לצפייה בנתונים' : 'Click on a day in the calendar to view data'}
                  </div>
                </div>
              )}
            </>
          )}

          {viewMode === 'weekly' && (
            <>
              {/* Best Week - Clean Boxes */}
              <div className={`${styles.bgCard} p-4 rounded border ${styles.border}`}>
                <div className={`text-sm font-bold ${styles.textPrimary} mb-4`}>
                  {t('bestWeek')}
                </div>

                {/* Stats Grid - Single Column */}
                <div className="space-y-3">
                  {/* Date */}
                  <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                    <div className="flex justify-between items-center">
                      <div className={`text-sm ${styles.textSecondary} font-bold`}>
                        {lang === 'he' ? 'תאריך' : 'Date'}
                      </div>
                      <div className={`text-xs ${styles.textSecondary}`}>
                        {monthData.bestWeek.startDate} - {monthData.bestWeek.endDate}
                      </div>
                    </div>
                  </div>

                  {/* P/L */}
                  <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                    <div className={`text-xs ${styles.textSecondary} mb-1`}>
                      {lang === 'he' ? 'רווח/הפסד' : 'P/L'}
                    </div>
                    <div className={`text-lg font-bold ${monthData.bestWeek.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {monthData.bestWeek.pnl > 0 ? '+' : ''}{currency}{formatNumber(monthData.bestWeek.pnl)}
                    </div>
                  </div>

                  {/* Trades */}
                  <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                    <div className={`text-xs ${styles.textSecondary} mb-1`}>
                      {lang === 'he' ? 'עסקאות' : 'Trades'}
                    </div>
                    <div className={`text-lg font-bold ${styles.textPrimary}`}>
                      {monthData.bestWeek.trades}
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className={`${styles.bgCard} p-3 rounded border ${styles.border}`}>
                    <div className={`text-xs ${styles.textSecondary} mb-1`}>
                      {lang === 'he' ? 'אחוז הצלחה' : 'Win Rate'}
                    </div>
                    <div className={`text-lg font-bold ${styles.textPrimary}`}>
                      {monthData.bestWeek.trades > 0
                        ? ((monthData.bestWeek.wins / monthData.bestWeek.trades) * 100).toFixed(1)
                        : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.bgCard} rounded-xl shadow-xl border ${styles.border} overflow-hidden flex flex-col md:flex-row`}>
      <div className={`w-full md:w-64 border-b md:border-b-0 ${isRTL ? 'md:border-l md:order-last' : 'md:border-r'} ${styles.border} ${styles.bgCard}`}>
        {renderSidebar()}
      </div>

      <div className="flex-1 p-6">
        <div className={`flex justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className={`text-2xl font-bold ${styles.textPrimary} capitalize tracking-wide`}>{monthName}</h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className={`p-2 hover:${styles.hoverBg} rounded-lg ${styles.textSecondary} transition-colors`}><ChevronLeft size={24} /></button>
            <button onClick={nextMonth} className={`p-2 hover:${styles.hoverBg} rounded-lg ${styles.textSecondary} transition-colors`}><ChevronRight size={24} /></button>
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
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

            // Check if this is today
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;

            // Background overlay color based on P/L or today
            const overlayBg =
              data && data.pnl > 0 ? 'bg-emerald-500/15' :
                data && data.pnl < 0 ? 'bg-rose-500/15' :
                  isToday && !data ? 'bg-slate-600/40' :
                    '';

            return (
              <div
                key={dayNum}
                onClick={() => setSelectedCalendarDate(dateStr)}
                className={`${styles.bgCard} min-h-[100px] p-2 flex flex-col justify-between cursor-pointer transition-colors relative group border-t ${styles.border} border-opacity-30 overflow-hidden`}
              >
                {/* ✅ Background overlay layer that won't be overridden */}
                {overlayBg && (
                  <div className={`absolute inset-0 ${overlayBg} pointer-events-none`} />
                )}

                {/* ✅ All content above the overlay */}
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <span className={`text-sm font-bold ${styles.textSecondary} group-hover:text-blue-500`}>{dayNum}</span>

                  {data && (
                    <div className="text-right">
                      <div className={`text-[8px] md:text-[10px] ${styles.textSecondary} font-bold mb-0.5 leading-none`}>
                        {data.count} {t('stat_trades')}
                      </div>
                      <div className={`font-black text-[9px] md:text-sm ${data.pnl > 0 ? 'text-emerald-500' : 'text-rose-500'} leading-none`}>
                        {data.pnl > 0 ? '+' : ''}{formatCompactCalendar(data.pnl)}
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
            return [...Array(trailing)].map((_, i) => (
              <div
                key={`trailing-${i}`}
                className={`${styles.bgCard} min-h-[100px] border-t ${styles.border} border-opacity-30`}
              />
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

const TradeForm = ({ isOpen, onClose, onSave, editingTrade, existingStrategies, t, isRTL, styles, lang }) => {
  const [marketType, setMarketType] = useState('stocks'); // 'stocks' or 'futures'
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    symbol: '',
    type: 'Long',
    strategy: '',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    quantity: '',
    fees: 0,
    notes: '',
    tags: '',
    image: '',
    tradeNumber: '',
    mental: '',
    entryParts: [],
    exitParts: []
  });

  const [showEntryParts, setShowEntryParts] = useState(false);
  const [showExitParts, setShowExitParts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingTrade) {
        setFormData({
          ...editingTrade,
          entryParts: editingTrade.entryParts || [],
          exitParts: editingTrade.exitParts || []
        });

        // Auto-infer quantity if missing for imported trades
        if (!editingTrade.quantity && editingTrade.pnl && editingTrade.entryPrice && editingTrade.exitPrice) {
          const diff = Math.abs(parseFloat(editingTrade.entryPrice) - parseFloat(editingTrade.exitPrice));
          if (diff > 0) {
            const inferred = Math.round(Math.abs(parseFloat(editingTrade.pnl) + (parseFloat(editingTrade.fees) || 0)) / diff);
            if (inferred > 0) {
              setFormData(prev => ({ ...prev, quantity: inferred.toString() }));
            }
          }
        }

        if (editingTrade.entryParts?.length > 0) setShowEntryParts(true);
        if (editingTrade.exitParts?.length > 0) setShowExitParts(true);
      } else {
        // Load draft for new trade
        const savedDraft = localStorage.getItem('stocksTradeDraft');
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            setFormData(draft);
            if (draft.entryParts?.length > 0) setShowEntryParts(true);
            if (draft.exitParts?.length > 0) setShowExitParts(true);
          } catch (e) {
            console.error("Failed to parse stocks draft", e);
          }
        } else {
          setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            symbol: '', entryPrice: '', exitPrice: '', stopLoss: '', quantity: '', fees: 0, notes: '', tags: '', image: '', tradeNumber: '',
            mental: '', entryParts: [], exitParts: []
          }));
          setShowEntryParts(false);
          setShowExitParts(false);
        }
      }
    }
  }, [editingTrade, isOpen]);

  // Save draft whenever formData changes (only for NEW trades)
  useEffect(() => {
    if (isOpen && !editingTrade) {
      localStorage.setItem('stocksTradeDraft', JSON.stringify(formData));
    }
  }, [formData, isOpen, editingTrade]);

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
        newData.quantity = entryRes.total.toString();
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        alert("File too large. Please use a smaller image or a URL.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: editingTrade ? editingTrade.id : Date.now().toString(),
      ...calculateMetrics(formData)
    });

    // Clear draft if it was a new trade
    if (!editingTrade) {
      localStorage.removeItem('stocksTradeDraft');
    }

    onClose();
  };

  if (!isOpen) return null;

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
                  className={`w-full p-2 text-xs ${styles.inputBg} border ${styles.border} rounded-lg text-white outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t('quantity')}
                  value={formatNumberWithCommas(part.quantity)}
                  onChange={(e) => handlePartChange(type, index, 'quantity', parseNumberFromCommas(e.target.value))}
                  className={`w-full p-2 text-xs ${styles.inputBg} border ${styles.border} rounded-lg text-white outline-none focus:ring-1 focus:ring-blue-500`}
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${styles.bgCard} rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border ${styles.border} ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`flex justify-between items-center p-6 border-b ${styles.border} sticky top-0 ${styles.bgCard} z-10`}>
          <h2 className={`text-xl font-bold ${styles.textPrimary}`}>
            {editingTrade ? t('editTrade') : t('newTrade')}
          </h2>
          <button onClick={onClose} className={`${styles.textSecondary} hover:text-blue-500 transition-colors`}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t('date')}</label>
            <input required type="date" name="date" value={formData.date} onChange={handleChange} className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`} />
          </div>
          <div>
            <label className={`block text-xs font-bold ${styles.textSecondary} ${lang === 'he' ? '' : 'uppercase'} mb-1`}>
              {marketType === 'futures' ? (lang === 'he' ? 'ימים' : 'DAYS') : t('time')}
            </label>
            {marketType === 'futures' ? (
              <select name="time" className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}>
                <option value="">{lang === 'he' ? 'בחר יום...' : 'Select day...'}</option>
                <option value="sunday">{lang === 'he' ? 'יום ראשון' : 'Sunday'}</option>
                <option value="monday">{lang === 'he' ? 'יום שני' : 'Monday'}</option>
                <option value="tuesday">{lang === 'he' ? 'יום שלישי' : 'Tuesday'}</option>
                <option value="wednesday">{lang === 'he' ? 'יום רביעי' : 'Wednesday'}</option>
                <option value="thursday">{lang === 'he' ? 'יום חמישי' : 'Thursday'}</option>
                <option value="friday">{lang === 'he' ? 'יום שישי' : 'Friday'}</option>
              </select>
            ) : (
              <input type="time" name="time" value={formData.time} onChange={handleChange} className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`} />
            )}
          </div>

          <div className="md:col-span-1">
            <label className={`block text-xs font-bold ${styles.textSecondary} ${lang === 'he' ? '' : 'uppercase'} mb-1`}>
              {marketType === 'futures' ? (lang === 'he' ? 'מספר חוזים' : 'NUMBER OF CONTRACTS') : t('symbol')}
            </label>
            <input required type="text" name="symbol" placeholder={marketType === 'futures' ? (lang === 'he' ? 'מספר החוזים' : 'Number of contracts') : t('phSymbolExample')} value={formData.symbol} onChange={(e) => handleChange({ target: { name: 'symbol', value: e.target.value.toUpperCase() } })} className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary} font-bold`} />
          </div>

          <div>
            <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t('type')}</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFormData({ ...formData, type: 'Long' })} className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${formData.type === 'Long' ? 'bg-emerald-600 text-white shadow-lg' : `${styles.inputBg} ${styles.textSecondary} hover:bg-gray-500/20`}`}>{t('long')}</button>
              <button type="button" onClick={() => setFormData({ ...formData, type: 'Short' })} className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${formData.type === 'Short' ? 'bg-rose-600 text-white shadow-lg' : `${styles.inputBg} ${styles.textSecondary} hover:bg-gray-500/20`}`}>{t('short')}</button>
            </div>
          </div>

          {/* Futures-specific fields */}
          {marketType === 'futures' && (
            <>
              <div>
                <label className={`block text-xs font-bold ${styles.textSecondary} ${lang === 'he' ? '' : 'uppercase'} mb-1`}>
                  {lang === 'he' ? 'סוג חוזה' : 'CONTRACT TYPE'}
                </label>
                <select name="contractType" value={formData.contractType} onChange={handleChange} className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}>
                  <option value="micro">{lang === 'he' ? 'חוזה מיקרו' : 'Micro Contract'}</option>
                  <option value="mini">{lang === 'he' ? 'חוזה מיני' : 'Mini Contract'}</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold ${styles.textSecondary} ${lang === 'he' ? '' : 'uppercase'} mb-1`}>
                  {lang === 'he' ? 'סימול החוזה' : 'CONTRACT SYMBOL'}
                </label>
                <input type="text" name="contractSymbol" value={formData.contractSymbol} onChange={handleChange} placeholder={lang === 'he' ? 'YM, NQ, ES...' : 'YM, NQ, ES...'} className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary} font-bold`} />
              </div>

              <div>
                <label className={`block text-xs font-bold ${styles.textSecondary} ${lang === 'he' ? '' : 'uppercase'} mb-1`}>
                  {lang === 'he' ? 'אינטרוול זמן' : 'TIME FRAME'}
                </label>
                <select name="timeInterval" value={formData.timeInterval} onChange={handleChange} className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}>
                  <option value="">{lang === 'he' ? 'בחר אינטרוול...' : 'Select interval...'}</option>
                  <option value="1s">1s</option><option value="5s">5s</option><option value="15s">15s</option>
                  <option value="1m">1m</option><option value="5m">5m</option><option value="15m">15m</option>
                  <option value="1H">1H</option><option value="4H">4H</option><option value="1D">1D</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold ${styles.textSecondary} ${lang === 'he' ? '' : 'uppercase'} mb-1`}>
                  {lang === 'he' ? 'ערך נקודה' : 'POINT VALUE'}
                </label>
                <input type="number" step="0.01" name="pointValue" value={formData.pointValue} onChange={handleChange} placeholder="50, 20, 5..." className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`} />
              </div>

              <div>
                <label className={`block text-xs font-bold ${styles.textSecondary} ${lang === 'he' ? '' : 'uppercase'} mb-1`}>
                  {lang === 'he' ? 'סשן' : 'SESSION'}
                </label>
                <select name="session" value={formData.session} onChange={handleChange} className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}>
                  <option value="">Select...</option><option value="asia">Asia</option><option value="london">London</option>
                  <option value="am">AM</option><option value="pm">PM</option>
                </select>
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t('strategy')}</label>
            <input
              type="text"
              name="strategy"
              list="strategies-list"
              value={formData.strategy}
              onChange={handleChange}
              placeholder={t('phStrategy')}
              className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
            />
            <datalist id="strategies-list">
              {existingStrategies.map((s, i) => (
                <option key={i} value={s} />
              ))}
            </datalist>
          </div>


          <div className="md:col-span-2">
            <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t('quantity')}</label>
            <input
              required
              readOnly={showEntryParts}
              type="text"
              name="quantity"
              placeholder={showEntryParts ? t('totalQty') : ''}
              value={formatNumberWithCommas(formData.quantity)}
              onChange={(e) => {
                const rawValue = parseNumberFromCommas(e.target.value);
                if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                  setFormData(prev => ({ ...prev, quantity: rawValue }));
                }
              }}
              className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary} ${showEntryParts ? 'opacity-70 bg-slate-800' : ''}`}
            />
          </div>

          {/* Entry & Exit Grouping for Desktop */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Entry Section Container */}
            <div className="space-y-4">
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

              {showEntryParts && renderPartSection('entry')}
            </div>

            {/* Exit Section Container */}
            <div className="space-y-4">
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

              {showExitParts && renderPartSection('exit')}
            </div>

            {/* Fees & Stop Loss Row - Responsive Order */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="order-1 md:order-2">
                <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t('stopLoss')}</label>
                <input
                  required
                  type="text"
                  name="stopLoss"
                  value={formatNumberWithCommas(formData.stopLoss)}
                  onChange={(e) => {
                    const rawValue = parseNumberFromCommas(e.target.value);
                    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                      setFormData(prev => ({ ...prev, stopLoss: rawValue }));
                    }
                  }}
                  className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                />
              </div>

              <div className="order-2 md:order-1">
                <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t('fees')}</label>
                <input
                  type="text"
                  name="fees"
                  value={formatNumberWithCommas(formData.fees)}
                  onChange={(e) => {
                    const rawValue = parseNumberFromCommas(e.target.value);
                    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                      setFormData(prev => ({ ...prev, fees: rawValue }));
                    }
                  }}
                  className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}
                />
              </div>
            </div>
          </div>



          <div className="md:col-span-2">
            <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t('uploadImage')}</label>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                name="image"
                placeholder={t('phImageUrl')}
                value={formData.image}
                onChange={handleChange}
                className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary} text-xs`}
              />
              <div className="flex items-center gap-2">
                <label className={`cursor-pointer ${styles.hoverBg} border ${styles.border} ${styles.textPrimary} px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors`}>
                  <Upload size={14} /> {t('chooseFile')}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <span className={`text-[10px] ${styles.textSecondary}`}>{t('max2mbLocal')}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t('tradeNumber')}</label>
            <input type="text" name="tradeNumber" placeholder={t('phTradeNumber')} value={formData.tradeNumber} onChange={handleChange} className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary} font-mono`} />
          </div>

          <div>
            <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t('tags')}</label>
            <input type="text" name="tags" placeholder={t('phTags')} value={formData.tags} onChange={handleChange} className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`} />
          </div>

          {/* Mental State - 3 Dots */}
          <div className="flex flex-col items-center">
            <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-3`}>{t('mental')}</label>
            <div className="flex gap-4 justify-center">
              {[
                { value: 'green', color: 'bg-emerald-500', label: t('mentalGreen') },
                { value: 'yellow', color: 'bg-yellow-500', label: t('mentalYellow') },
                { value: 'red', color: 'bg-red-500', label: t('mentalRed') }
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
            <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-1`}>{t('notes')}</label>
            <textarea name="notes" rows="3" value={formData.notes} onChange={handleChange} className={`w-full p-2.5 ${styles.inputBg} border ${styles.border} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${styles.textPrimary}`}></textarea>
          </div>

          <div className="col-span-1 md:col-span-2 flex gap-4 mt-2">
            <button type="button" onClick={onClose} className={`w-full py-3 px-4 bg-gray-500/10 hover:bg-gray-500/20 ${styles.textPrimary} rounded-lg font-bold transition-colors`}>
              {t('cancel')}
            </button>
            <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30">
              <Save size={18} />
              {editingTrade ? t('update') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function StocksApp({ username: propUsername, onLogout: propOnLogout, onSwitchJournal, lang: propLang, onLangChange }) {
  const [user, setUser] = useState(propUsername || null);
  const [hydrated, setHydrated] = useState(false);
  const [trades, setTrades] = useState([]);
  const [startingCapital, setStartingCapital] = useState(0);
  const [settings, setSettings] = useState({ currency: "$", theme: "dark", fontSize: 14 });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('smartJournal_stocks_activeTab') || 'journal';
  });

  useEffect(() => {
    localStorage.setItem('smartJournal_stocks_activeTab', activeTab);
  }, [activeTab]);

  const [currentDateFilter, setCurrentDateFilter] = useState(new Date());
  const [timeViewMode, setTimeViewMode] = useState('month'); // day/week/month/year/all
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('smartJournal_lang') || propLang || "he";
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPlatform, setImportPlatform] = useState('ibkr');

  useEffect(() => {
    if (propLang && propLang !== lang) {
      setLang(propLang);
    }
  }, [propLang]);

  useEffect(() => {
    localStorage.setItem('smartJournal_lang', lang);
    if (onLangChange) onLangChange(lang);
  }, [lang, onLangChange]);

  const t = (key) => TRANSLATIONS[lang]?.[key] || key;
  const styles = getThemeStyles(settings.theme);
  const isRTL = false;
  const locale = (lang === 'he' ? 'he-IL' : 'en-US');

  const [filter, setFilter] = useState({ symbol: '', strategy: 'All', type: 'All' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [selectedTradeIds, setSelectedTradeIds] = useState(new Set());
  const [viewingNotes, setViewingNotes] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState(null);
  const [showPercentage, setShowPercentage] = useState(false);
  const [analyticsTableView, setAnalyticsTableView] = useState('strategy'); // strategy / day / hour
  const [goals, setGoals] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });

  const handleExportTrades = () => {
    if (trades.length === 0) {
      alert(t('noTradesToExport'));
      return;
    }
    const filename = `stocks_trades_${new Date().toISOString().split('T')[0]}.xlsx`;
    const success = excelService.exportToExcel(trades, filename);
    if (success) {
      console.log("✅ Export successful");
    }
  };

  const handleImportTrades = async (file) => {
    try {
      const importedTrades = await excelService.parseExcel(file, importPlatform, 'stocks');
      if (importedTrades && importedTrades.length > 0) {
        // Calculate new trades outside of the setter to avoid side-effects inside pure function
        const existingIds = new Set(trades.map(t => t.id));
        const uniqueNewTrades = importedTrades.filter(t => !existingIds.has(t.id));

        if (uniqueNewTrades.length === 0) {
          alert(lang === 'he' ? "אין עסקאות למשיכה" : "No trades to import");
          setIsImportModalOpen(false);
          return;
        }

        const newTrades = [...trades, ...uniqueNewTrades];
        setTrades(newTrades);

        // Sync with cloud (Full backup) - AFTER state update
        if (user) {
          tradeService.updateProfile(user, { stocks_data: newTrades });

          // Push individual trades to relay sync for other devices
          uniqueNewTrades.forEach(trade => {
            tradeService.pushTrade(user, 'stocks', trade);
          });
        }

        setTimeout(() => {
          alert(lang === 'he'
            ? `סכום עסקאות נוסף: ${uniqueNewTrades.length}`
            : `Amount of trades added: ${uniqueNewTrades.length}`);
        }, 100);

        setIsImportModalOpen(false);
      } else {
        alert(lang === 'he' ? "אין עסקאות למשיכה" : "No trades to import");
        setIsImportModalOpen(false);
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert(lang === 'he' ? "הייבוא נכשל. וודא שבחרת את הפלטפורמה הנכונה והקובץ תקין." : "Import failed. Make sure you selected the correct platform and the file is valid.");
    }
  };

  const handleUpdateGoals = (newGoalsOrUpdater) => {
    const nextGoals = typeof newGoalsOrUpdater === 'function' ? newGoalsOrUpdater(goals) : newGoalsOrUpdater;
    setGoals(nextGoals);
    if (user) {
      tradeService.pushGoals(user, 'stocks', nextGoals);
    }
  };

  const handleLogin = (username) => {
    setUser(username);
    // Load user specific data
    const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');
    const userData = users[username] || {};
    setTrades(userData.trades || []);
    if (userData.settings) setSettings(userData.settings);
    if (userData.startingCapital) setStartingCapital(userData.startingCapital);
    if (userData.goals) setGoals(userData.goals);
  };

  const [analyticsRange, setAnalyticsRange] = useState('1M');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [chunkBuffers, setChunkBuffers] = useState({});
  const [manualUrl, setManualUrl] = useState("");
  const [isColmexConnected, setIsColmexConnected] = useState(() => !!localStorage.getItem('colmex_access_token'));
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-sync connection status with localStorage
  useEffect(() => {
    const checkConnection = () => {
      const token = localStorage.getItem('colmex_access_token');
      setIsColmexConnected(!!token);
    };
    checkConnection();

    // Also listen for potential changes if needed (though mostly local)
    window.addEventListener('storage', checkConnection);
    window.addEventListener('colmex_connection_changed', checkConnection);
    return () => {
      window.removeEventListener('storage', checkConnection);
      window.removeEventListener('colmex_connection_changed', checkConnection);
    };
  }, []);

  const handleSyncTrades = async (silent = false, customDate = null, customIsReal = null, customToDate = null) => {
    if (isSyncing) return;
    if (!silent) setIsSyncing(true);

    const performSyncCall = async (date, toDate = null) => {
      const token = localStorage.getItem('colmex_access_token');
      if (!token) return [];
      
      let finalDate = date;
      const ignoreBefore = localStorage.getItem('colmex_ignore_before_stocks');
      
      // Use robust date comparison
      if (ignoreBefore && new Date(finalDate).getTime() < new Date(ignoreBefore).getTime()) {
        // Only enforce the limit for background/automatic syncs (silent or no custom date)
        if (silent || !customDate) {
          finalDate = ignoreBefore;
        }
      }

      const options = {
        isReal: customIsReal !== null ? customIsReal : (user?.toLowerCase().includes('real') || false),
        fromDate: finalDate,
        toDate: toDate || customToDate
      };
      return await colmexService.syncTrades(token, user, options);
    };

    try {
      let syncedTrades = [];
      
      // If manual sync (not silent) and no custom date, do chunked 90-day sync
      if (!silent && !customDate) {
        console.log("🚀 Starting Chunked Initial Sync (90 Days)...");
        const chunkDates = [
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        ];

        for (let i = 0; i < chunkDates.length; i++) {
          if (i > 0) {
            console.log(`Waiting for chunk ${i+1}...`);
            await new Promise(r => setTimeout(r, 2000)); 
          }
          const chunkRes = await performSyncCall(chunkDates[i]);
          if (chunkRes && chunkRes.length > 0) {
            syncedTrades = [...syncedTrades, ...chunkRes];
          }
        }
      } else {
        const targetDate = customDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        syncedTrades = await performSyncCall(targetDate);
      }
      
      if (syncedTrades && syncedTrades.length > 0) {
        let actuallyAdded = 0;

        setTrades(prev => {
          const newTrades = [...prev];
          const ignoreBefore = localStorage.getItem('colmex_ignore_before_stocks');
          syncedTrades.forEach(st => {
            // Hard filter: Skip trades older than ignore limit during automatic/background syncs
            if (!customDate && ignoreBefore && new Date(st.date || st.executionTime) < new Date(ignoreBefore)) {
              return;
            }

            const isStock = !st.market || st.market === 'stocks';
            const existingIndex = newTrades.findIndex(t => String(t.id) === String(st.id));
            
            if (existingIndex === -1) {
              // If it's a stock, add to local state and count
              if (isStock) {
                newTrades.push(st);
                actuallyAdded++;
              }
              // Only push to DB if it's a stock (prevent cross-journal "revivals")
              if (user && isStock) tradeService.pushTrade(user, 'stocks', st);
            } else if (isStock) {
              // Update existing trade (only for stocks in this app)
              const existing = newTrades[existingIndex];
              const hasParts = (existing.entryParts && existing.entryParts.length > 0) || (existing.exitParts && existing.exitParts.length > 0);
              const newHasParts = (st.entryParts && st.entryParts.length > 0) || (st.exitParts && st.exitParts.length > 0);
              
              if (!hasParts && newHasParts) {
                newTrades[existingIndex] = { ...existing, ...st };
                actuallyAdded++; 
                if (user) tradeService.pushTrade(user, 'stocks', newTrades[existingIndex]);
              }
            }
          });
          
          if (!silent && actuallyAdded > 0) {
            alert(lang === 'he' ? `סנכרון הושלם! נוספו ${actuallyAdded} עסקאות חדשות ליומן.` : `Sync complete! Added ${actuallyAdded} new trades.`);
          } else if (!silent && actuallyAdded === 0 && !customDate) {
            // Only show "No new trades" alert for full sync, not for specific date range (unless specifically requested)
            alert(lang === 'he' ? 'לא נמצאו עסקאות חדשות (ייתכן שהן כבר קיימות ביומן).' : 'No new trades found (they might already exist in the journal).');
          }
          return newTrades;
        });
      } else {
        if (!silent) alert(lang === 'he' ? 'לא נמצאו עסקאות סגורות חדשות לסנכרון.' : 'No new closed trades found to sync.');
      }
    } catch (err) {
      if (!silent) alert('Sync Error: ' + err.message);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  const handleResetColmexData = () => {
    if (window.confirm(lang === 'he' ? 'פעולה זו תמחק את כל העסקאות שיובאו מקולמקס ותאפס את הזיכרון. עסקאות ידניות לא יימחקו. להמשיך?' : 'This will delete all trades imported from Colmex and reset the memory. Manual trades will not be affected. Continue?')) {
      const colmexTrades = trades.filter(t => t.strategy === 'Colmex Sync');
      const manualTrades = trades.filter(t => t.strategy !== 'Colmex Sync');
      
      setTrades(manualTrades);
      
      // Clear cache and set ignore boundary
      const ignoreTimestamp = new Date().toISOString();
      localStorage.removeItem('colmex_stats_stocks');
      localStorage.removeItem('colmex_activity_logs');
      localStorage.setItem('colmex_ignore_before_stocks', ignoreTimestamp);
      window.dispatchEvent(new Event('colmex_stats_updated'));
      window.dispatchEvent(new Event('colmex_logs_updated'));
      window.dispatchEvent(new Event('colmex_reset_stocks'));
      
      if (user) {
        tradeService.updateProfile(user, { 
          stocks_data: manualTrades,
          stocks_ignore_before: ignoreTimestamp
        });
        colmexTrades.forEach(tradeObj => {
          tradeService.pushTrade(user, 'stocks', { ...tradeObj, deleted: true, market: 'stocks' });
        });
        tradeService.pushColmexReset(user, ignoreTimestamp, 'stocks');
      }
      
      alert(lang === 'he' ? `נמחקו ${colmexTrades.length} עסקאות. הזיכרון אופס בהצלחה.` : `Deleted ${colmexTrades.length} trades. Memory reset successfully.`);
    }
  };

  // --- Background Sync Logic (Automatic) ---
  const [detectedCode, setDetectedCode] = React.useState(null);

  React.useEffect(() => {
    // Detect code from URL on mount (Success screen logic)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code') || colmexService.extractCodeFromUrl(window.location.href);
    if (code) {
      setDetectedCode(code);
    }

    if (!isColmexConnected || !user) return;

    // 1. Initial sync on mount
    handleSyncTrades(true);

    // 2. Periodic sync every 1 minute (Last 24 hours only for speed)
    const interval = setInterval(() => {
      console.log('🔄 Automatic Background Sync (Stocks)...');
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      handleSyncTrades(true, last24h);
    }, 1 * 60 * 1000);

    // 3. Sync on window focus (when user returns to the app)
    const handleFocus = () => {
      console.log('Focus detected, syncing Colmex...');
      handleSyncTrades(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isColmexConnected, user, isSyncing]);

  useEffect(() => {
    const token = localStorage.getItem('colmex_access_token');
    if (token) {
      setIsColmexConnected(true);
    }
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    if (user) {
      const dataToSave = {
        trades,
        settings,
        startingCapital,
        goals,
        lang
      };
      tradeService.updateProfile(user, { stocks_data: dataToSave });
    }

    if (propOnLogout) {
      propOnLogout();
    }
    setShowLogoutConfirm(false);
  };

  useEffect(() => {
    if (propUsername) {
      setUser(propUsername);
    }
  }, [propUsername]);

  // 1. Initial Load from Local DB & Register Device (Run once on mount/user change)
  useEffect(() => {
    if (!propUsername) return;
    setHydrated(false);

    localDbService.loadUserData(propUsername, 'stocks').then(data => {
      if (data) {
        setTrades(Array.isArray(data.trades) ? data.trades : []);
        if (data.settings) setSettings(data.settings);
        if (data.startingCapital) setStartingCapital(data.startingCapital);
        if (data.goals) setGoals(data.goals);
        if (data.lang) setLang(data.lang);
      }
      setHydrated(true);
      // After local hydration, check cloud for Colmex connection if local is empty
      if (!localStorage.getItem('colmex_access_token')) {
        colmexService.syncWithCloud(propUsername).then(connected => {
          if (connected) setIsColmexConnected(true);
        });
      }
    }).catch(error => {
      console.error('Failed to load local stocks data:', error);
      setHydrated(true);
    });

    tradeService.registerDevice(propUsername);
  }, [propUsername]); // Run ONLY when user changes

  // 2. Periodic Pull from Relay Sync Queue
  useEffect(() => {
    if (!propUsername) return;
    const syncInterval = setInterval(async () => {
      const items = await tradeService.pullItems(propUsername, 'stocks');
      if (items && items.length > 0) {
        console.log(`📦 Received ${items.length} sync items`);

        for (const item of items) {
          if (item.item_type === 'trade') {
            const syncedTrade = item.payload;
            
            // RELAY SYNC: Do NOT filter by IgnoreBefore here.
            // If another device sent this trade, we want it, regardless of date.
            // The filter should only apply to direct Colmex API pulls.
            
            setTrades(prev => {
              let newTrades = [...prev];
              if (syncedTrade.deleted) {
                newTrades = newTrades.filter(t => String(t.id) !== String(syncedTrade.id));
              } else {
                const exists = newTrades.findIndex(t => String(t.id) === String(syncedTrade.id));
                if (exists >= 0) {
                  newTrades[exists] = { ...newTrades[exists], ...syncedTrade };
                } else {
                  newTrades.push(syncedTrade);
                }
              }
              return newTrades;
            });
          }

          if (item.item_type === 'goals') {
            const syncedGoals = item.payload;
            console.log("🎯 Received goals sync (Stocks):", syncedGoals);
            setGoals(syncedGoals);
          }

          if (item.item_type === 'capital') {
            const syncedCapital = item.payload.startingCapital;
            console.log("💰 Received capital sync (Stocks):", syncedCapital);
            setStartingCapital(syncedCapital);
          }

          if (item.item_type === 'colmex_status') {
            const { connected } = item.payload;
            console.log("🔄 Received Colmex status sync:", connected ? "Connected" : "Disconnected");
            if (!connected) {
              localStorage.removeItem('colmex_access_token');
              localStorage.removeItem('colmex_refresh_token');
              setIsColmexConnected(false);
              colmexService.addLog('החיבור נותק ממכשיר אחר.', 'info');
            }
          }

          if (item.item_type === 'colmex_reset') {
            const { ignoreBefore, journalType } = item.payload;
            if (ignoreBefore && journalType === 'stocks') {
              console.log("🔄 Received Colmex Reset sync for Stocks. Ignoring trades before:", ignoreBefore);
              localStorage.setItem('colmex_ignore_before_stocks', ignoreBefore);
              
              localStorage.removeItem('colmex_stats_stocks');
              localStorage.removeItem('colmex_activity_logs');
              window.dispatchEvent(new Event('colmex_stats_updated'));
              window.dispatchEvent(new Event('colmex_logs_updated'));
              window.dispatchEvent(new Event('colmex_reset_stocks'));
            }
          }

          if (item.item_type === 'colmex_tokens') {
            const tokens = item.payload;
            console.log("🔄 Received fresh Colmex tokens from another device");
            if (tokens.access_token) {
              localStorage.setItem('colmex_access_token', tokens.access_token);
              if (tokens.refresh_token) {
                localStorage.setItem('colmex_refresh_token', tokens.refresh_token);
              }
              setIsColmexConnected(true);
              colmexService.addLog('פרטי החיבור עודכנו ממכשיר אחר.', 'info');
            }
          }

          if (item.item_type === 'image_chunk') {
            const { tradeId, imageId, chunk, index, total } = item.payload;
            setChunkBuffers(prev => {
              const buffer = prev[imageId] || { chunks: [], count: 0, total };
              if (!buffer.chunks[index]) {
                buffer.chunks[index] = chunk;
                buffer.count++;
              }

              if (buffer.count === total) {
                const fullBase64 = buffer.chunks.join('');
                console.log(`✅ Image ${imageId} reassembled for trade ${tradeId}`);
                setTrades(tList => tList.map(t => String(t.id) === String(tradeId) ? { ...t, image: fullBase64 } : t));
                const next = { ...prev };
                delete next[imageId];
                return next;
              }
              return { ...prev, [imageId]: buffer };
            });
          }

          tradeService.acknowledgeItem(item.id, tradeService.getDeviceId());
        }
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [propUsername]);

  // 3. Periodic Cloud Backup (Full State Mirror)
  useEffect(() => {
    if (!propUsername) return;
    const backupInterval = setInterval(async () => {
      const dataToSave = {
        trades,
        settings,
        startingCapital,
        goals,
        lang
      };
      console.log("☁️ Periodic Cloud Backup (Stocks)...");
      try {
        await tradeService.updateProfile(propUsername, { stocks_data: dataToSave });
      } catch (e) {
        console.error("Backup failed:", e);
      }
    }, 15000); // Backup every 15 seconds (less aggressive)

    return () => clearInterval(backupInterval);
  }, [propUsername, trades, settings, startingCapital, goals, lang]);

  // Save to Local DB whenever trades change
  useEffect(() => {
    if (!user || !hydrated) return;

    const dataToSave = {
      trades,
      settings,
      startingCapital,
      goals,
      lang
    };

    // 1. Local Save
    localDbService.saveUserData(user, 'stocks', dataToSave).catch(error => {
      console.error('Failed to save local stocks data:', error);
    });
  }, [trades, settings, startingCapital, goals, user, hydrated, lang]);

  // Initial Load (Check if user was logged in is tricky without session, so we force login)

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'he' : 'en');
  };

  const uniqueStrategies = useMemo(() => {
    const strats = new Set(trades.map(t => t.strategy).filter(Boolean));
    return Array.from(strats).sort();
  }, [trades]);

  const handleSaveTrade = (trade) => {
    const tradeWithMarket = { ...trade, market: 'stocks' };
    if (editingTrade) {
      setTrades(prev => prev.map(t => t.id === tradeWithMarket.id ? tradeWithMarket : t));
    } else {
      setTrades(prev => [...prev, tradeWithMarket]);
    }

    // Push to relay sync cloud
    if (user) {
      tradeService.pushTrade(user, 'stocks', tradeWithMarket);
      if (tradeWithMarket.image && tradeWithMarket.image.length > 1000) {
        tradeService.pushImage(user, 'stocks', tradeWithMarket.id, tradeWithMarket.image);
      }
    }

    setEditingTrade(null);
  };

  const handleDeleteTrade = (id) => {
    setTradeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedTradeIds.size === 0) return;
    if (window.confirm(lang === 'he' ? `האם למחוק ${selectedTradeIds.size} עסקאות?` : `Delete ${selectedTradeIds.size} trades?`)) {
      const idsToDeleteArray = Array.from(selectedTradeIds);

      const updatedTrades = trades.filter(t => !selectedTradeIds.has(String(t.id)));
      setTrades(updatedTrades);

      if (user) {
        // Update cloud backup
        tradeService.updateProfile(user, { stocks_data: updatedTrades });

        // Push delete signals
        idsToDeleteArray.forEach(id => {
          const tradeObj = trades.find(t => String(t.id) === String(id));
          if (tradeObj) {
            tradeService.pushTrade(user, 'stocks', { ...tradeObj, deleted: true, market: 'stocks' });
          }
        });
      }

      setSelectedTradeIds(new Set());
    }
  };

  const toggleSelectTrade = (id) => {
    const tradeId = String(id);
    setSelectedTradeIds(prev => {
      const next = new Set(prev);
      if (next.has(tradeId)) next.delete(tradeId);
      else next.add(tradeId);
      return next;
    });
  };

  const toggleSelectAll = (filteredList) => {
    if (selectedTradeIds.size === filteredList.length) {
      setSelectedTradeIds(new Set());
    } else {
      setSelectedTradeIds(new Set(filteredList.map(t => String(t.id))));
    }
  };

  const confirmDelete = () => {
    const id = tradeToDelete;
    const targetId = String(id);
    const tradeObj = trades.find(t => String(t.id) === targetId);

    if (user && tradeObj) {
      // Push delete signal to relay sync cloud
      tradeService.pushTrade(user, 'stocks', { ...tradeObj, deleted: true, market: 'stocks' });
    }

    setTrades(prev => prev.filter(t => String(t.id) !== targetId));

    if (selectedTradeId && String(selectedTradeId) === targetId) {
      setSelectedTradeId(null);
    }

    setDeleteConfirmOpen(false);
    setTradeToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setTradeToDelete(null);
  };




  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setIsModalOpen(true);
  };

  const handleSelectTrade = (id) => {
    if (selectedTradeId === id) setSelectedTradeId(null);
    else setSelectedTradeId(id);
  };

  const handleShareClick = () => {
    if (!selectedTradeId) {
      alert(t('selectTradeWarning'));
      return;
    }
    setShareModalOpen(true);
  };

  // ... Date Nav logic same as before ...
  const handleDateNavigate = (direction) => {
    const newDate = new Date(currentDateFilter);
    if (timeViewMode === 'day') newDate.setDate(newDate.getDate() + direction);
    else if (timeViewMode === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    else if (timeViewMode === 'month') newDate.setMonth(newDate.getMonth() + direction);
    else if (timeViewMode === 'year') newDate.setFullYear(newDate.getFullYear() + direction);
    setCurrentDateFilter(newDate);
  };

  const handleCalendarDayClick = (dateStr) => {
    const parts = dateStr.split('-');
    const newDate = new Date(parts[0], parts[1] - 1, parts[2]);
    setCurrentDateFilter(newDate);
    setTimeViewMode('day');
    setActiveTab('journal');
  };

  const getDateRangeLabel = () => {
    if (timeViewMode === 'all') return t('viewAll');

    if (timeViewMode === 'week') {
      const start = new Date(currentDateFilter);
      start.setDate(currentDateFilter.getDate() - currentDateFilter.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      if (lang === 'he') {
        const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
        return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
      }
    }

    if (lang === 'he' && timeViewMode === 'day') {
      const days = ['יום א\'', 'יום ב\'', 'יום ג\'', 'יום ד\'', 'יום ה\'', 'יום ו\'', 'שבת'];
      const months = ['ינו\'', 'פבר\'', 'מרץ', 'אפר\'', 'מאי', 'יוני', 'יולי', 'אוג\'', 'ספט\'', 'אוק\'', 'נוב\'', 'דצמ\''];
      const dayName = days[currentDateFilter.getDay()];
      const day = currentDateFilter.getDate();
      const monthName = months[currentDateFilter.getMonth()];
      const year = currentDateFilter.getFullYear();
      return `${dayName}, ${day} ${monthName} ${year}`;
    }

    if (lang !== 'he' && timeViewMode === 'day') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = days[currentDateFilter.getDay()];
      const day = currentDateFilter.getDate();
      const monthName = months[currentDateFilter.getMonth()];
      const year = currentDateFilter.getFullYear();
      return `${dayName}, ${monthName} ${day}, ${year}`;
    }

    const optionsFull = { year: 'numeric', month: 'long', day: 'numeric' };
    if (timeViewMode === 'year') return currentDateFilter.toLocaleDateString(locale, { year: 'numeric' });
    if (timeViewMode === 'month') return currentDateFilter.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    return currentDateFilter.toLocaleDateString(locale, optionsFull);
  };
  const handleExportData = () => {
    const dataStr = JSON.stringify(trades);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `S_Trader_Backup_${user}.json`);
    linkElement.click();
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTrades = JSON.parse(e.target.result);
        if (Array.isArray(importedTrades)) {
          if (confirm("Overwrite data?")) {
            setTrades(importedTrades);
            alert(t('dataRestored'));
          }
        } else { alert(t('dataError')); }
      } catch (error) { alert(t('dataError')); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter Logic (Same as before)
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      const tradeDate = new Date(t.date);
      const filterDate = currentDateFilter;
      let matchDate = true;
      if (timeViewMode === 'day') {
        // Compare YYYY-MM-DD strings to avoid TZ issues
        const fDateStr = filterDate.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
        matchDate = t.date === fDateStr;
      } else if (timeViewMode === 'month') {
        matchDate = tradeDate.getMonth() === filterDate.getMonth() && tradeDate.getFullYear() === filterDate.getFullYear();
      } else if (timeViewMode === 'year') {
        matchDate = tradeDate.getFullYear() === filterDate.getFullYear();
      } else if (timeViewMode === 'week') {
        const oneJan = new Date(filterDate.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((filterDate - oneJan) / (24 * 60 * 60 * 1000));
        const resultWeek = Math.ceil((filterDate.getDay() + 1 + numberOfDays) / 7);

        const tradeOneJan = new Date(tradeDate.getFullYear(), 0, 1);
        const tradeDays = Math.floor((tradeDate - tradeOneJan) / (24 * 60 * 60 * 1000));
        const tradeWeek = Math.ceil((tradeDate.getDay() + 1 + tradeDays) / 7);

        matchDate = resultWeek === tradeWeek && tradeDate.getFullYear() === filterDate.getFullYear();
      } else if (timeViewMode === 'all') {
        matchDate = true;
      }

      const matchSymbol = t.symbol.includes(filter.symbol.toUpperCase());
      const matchStrategy = filter.strategy === 'All' || t.strategy === filter.strategy;
      const matchType = filter.type === 'All' || t.type === filter.type;
      return matchDate && matchSymbol && matchStrategy && matchType;
    }).sort((a, b) => {
      const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
      const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
      return dateB - dateA;
    });
  }, [trades, filter, currentDateFilter, timeViewMode]);

  // Analytics Range Helper
  const getAnalyticsStartDate = (range) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    switch (range) {
      case '1W':
        start.setDate(now.getDate() - 7);
        return start;

      case '1M':
        start.setMonth(now.getMonth() - 1);
        return start;

      case '3M':
        start.setMonth(now.getMonth() - 3);
        return start;

      case '6M':
        start.setMonth(now.getMonth() - 6);
        return start;

      case 'YTD':
        return new Date(now.getFullYear(), 0, 1);

      case '1Y':
        start.setFullYear(now.getFullYear() - 1);
        return start;

      case 'ALL':
      default:
        return null;
    }
  };

  // Analytics trades filtered by analyticsRange
  const analyticsTrades = useMemo(() => {
    const startDate = getAnalyticsStartDate(analyticsRange);
    if (!startDate) return trades; // ALL

    return trades.filter(t => {
      const d = new Date((t.date || '') + 'T00:00:00');
      return !isNaN(d) && d >= startDate;
    });
  }, [trades, analyticsRange]);

  // Stats Logic (Same)
  const stats = useMemo(() => {
    const totalTrades = filteredTrades.length;
    const wins = filteredTrades.filter(t => t.pnl > 0);
    const losses = filteredTrades.filter(t => t.pnl <= 0);
    const totalPnl = filteredTrades.reduce((acc, t) => acc + t.pnl, 0);
    const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = losses.reduce((acc, t) => acc + t.pnl, 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const avgR = totalTrades > 0 ? filteredTrades.reduce((acc, t) => acc + parseFloat(t.rMultiple), 0) / totalTrades : 0;

    let runningBalance = startingCapital;
    const sortedForChart = [...filteredTrades].sort((a, b) => {
      const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
      const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
      return dateA - dateB;
    });

    let runningPnL = 0;
    const equityData = [];
    equityData.push({ trade: 0, date: 'Start', equity: startingCapital, percent: 0, pnl: 0, cumulativePnl: 0 });

    sortedForChart.forEach((t, index) => {
      const pnl = parseFloat(t.pnl) || 0;
      runningBalance += pnl;
      runningPnL += pnl;
      const percent = startingCapital > 0 ? ((runningBalance - startingCapital) / startingCapital) * 100 : 0;
      equityData.push({ trade: index + 1, date: t.date, equity: runningBalance, percent: percent, pnl: pnl, cumulativePnl: runningPnL });
    });

    // Period stats calculation for chart header
    const dateObj = new Date(currentDateFilter);
    const currentDayStr = dateObj.toISOString().split('T')[0];
    const currentYear = dateObj.getFullYear();
    const currentMonth = dateObj.getMonth();

    const weekStart = new Date(dateObj);
    const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Israeli week (Sat-Fri): Sat=0 days back, Sun=1 day back, Mon=2 days back, etc.
    const diff = (dayOfWeek + 1) % 7;
    weekStart.setDate(dateObj.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let dayPnl = 0, weekPnl = 0, monthPnl = 0, yearPnl = 0;

    trades.forEach(t => {
      const tPnl = parseFloat(t.pnl) || 0;
      const tDate = new Date(t.date + 'T00:00:00');

      if (t.date === currentDayStr) dayPnl += tPnl;
      if (tDate >= weekStart && tDate <= weekEnd) weekPnl += tPnl;
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) monthPnl += tPnl;
      if (tDate.getFullYear() === currentYear) yearPnl += tPnl;
    });

    const periodStats = { dayPnl, weekPnl, monthPnl, yearPnl };

    // Strategies and Charts logic omitted for brevity, assumed same structure
    const groupPerformance = (keyFn) => {
      const groups = {};
      filteredTrades.forEach(t => {
        const key = keyFn(t);
        if (!groups[key]) groups[key] = { name: key, pnl: 0, count: 0, wins: 0, totalR: 0 };
        groups[key].pnl += t.pnl;
        groups[key].count += 1;
        if (t.pnl > 0) groups[key].wins += 1;
        groups[key].totalR += parseFloat(t.rMultiple || 0);
      });
      return Object.values(groups).map(g => ({
        ...g,
        winRate: g.count > 0 ? (g.wins / g.count) * 100 : 0,
        avgR: g.count > 0 ? g.totalR / g.count : 0
      }));
    };
    const strategyData = groupPerformance(t => t.strategy || 'Unknown').sort((a, b) => b.winRate - a.winRate);
    const daySorter = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
    const dayData = groupPerformance(t => getDayOfWeek(t.date)).sort((a, b) => daySorter[a.name] - daySorter[b.name]);
    const hourDataRaw = groupPerformance(t => getHourBucket(t.time));
    const hourData = hourDataRaw.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    const formattedHourData = hourData.map(h => ({ ...h, displayName: `${h.name}:00 - ${h.name + 1}:00` }));

    // Best Performers Calculation for new table
    const findBest = (arr) => {
      if (arr.length === 0) return { name: '-', pnl: 0, winRate: 0, count: 0, avgR: 0 };
      // Sort by WinRate desc, then PnL desc
      return arr.sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.pnl - a.pnl;
      })[0];
    };

    const bestStrat = findBest(strategyData);
    const bestDay = findBest(dayData);
    const bestHour = findBest(formattedHourData);

    // Calculate weekly best performers only from the filtered set (which respects the date filters anyway)
    // BUT the user specifically asked for "Weekly Top Performers" in summary, regardless of filter view.
    // So we calculate weekly bests based on ALL trades for THIS week.
    const { start, end } = getWeekDates();
    const allTradesThisWeek = trades.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const groupPerformanceWeekly = (keyFn) => {
      const groups = {};
      allTradesThisWeek.forEach(t => {
        const key = keyFn(t);
        if (!groups[key]) groups[key] = { name: key, pnl: 0, count: 0, wins: 0, totalR: 0 };
        groups[key].pnl += t.pnl;
        groups[key].count += 1;
        if (t.pnl > 0) groups[key].wins += 1;
        groups[key].totalR += parseFloat(t.rMultiple || 0);
      });

      return Object.values(groups)
        .filter(g => g.count >= MIN_TRADES_FOR_STATS) // Filter by min trades
        .map(g => ({
          ...g,
          winRate: g.count > 0 ? (g.wins / g.count) * 100 : 0,
          avgR: g.count > 0 ? g.totalR / g.count : 0
        }));
    };

    const weeklyStrategies = groupPerformanceWeekly(t => t.strategy || 'Unknown');
    const weeklyDays = groupPerformanceWeekly(t => getDayOfWeek(t.date));
    const weeklyHoursRaw = groupPerformanceWeekly(t => getHourBucket(t.time));

    const weeklyBestStrat = findBest(weeklyStrategies);
    const weeklyBestDay = findBest(weeklyDays);
    const weeklyBestHour = findBest(weeklyHoursRaw);

    return {
      totalTrades,
      winCount: wins.length,
      lossCount: losses.length,
      totalPnl,
      grossProfit,
      grossLoss,
      winRate,
      avgR,
      currentEquity: startingCapital + totalPnl,
      equityData,
      strategyData,
      dayData,
      hourData: formattedHourData,
      weeklyBestStrat,
      weeklyBestDay,
      weeklyBestHour,
      periodStats
    };
  }, [filteredTrades, startingCapital, trades, currentDateFilter]); // Added trades dependency for weekly calc

  // Analytics Stats - Based on analyticsTrades (filtered by range)
  const analyticsStats = useMemo(() => {
    const totalTrades = analyticsTrades.length;
    const wins = analyticsTrades.filter(t => t.pnl > 0);
    const losses = analyticsTrades.filter(t => t.pnl <= 0);
    const totalPnl = analyticsTrades.reduce((acc, t) => acc + t.pnl, 0);
    const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = losses.reduce((acc, t) => acc + t.pnl, 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const avgR = totalTrades > 0 ? analyticsTrades.reduce((acc, t) => acc + parseFloat(t.rMultiple), 0) / totalTrades : 0;

    const isAllRange = analyticsRange === 'ALL';
    let runningBalance = isAllRange ? startingCapital : 0;
    const sortedForChart = [...analyticsTrades].sort((a, b) => {
      const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
      const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
      return dateA - dateB;
    });

    const equityData = [];
    const startLabel = lang === 'he' ? 'התחלה' : 'Start';
    equityData.push({
      trade: 0,
      date: startLabel,
      time: '',
      dateTime: startLabel,
      equity: runningBalance,
      percent: 0,
      pnl: 0
    });

    sortedForChart.forEach((t, index) => {
      const pnl = parseFloat(t.pnl) || 0;
      runningBalance += pnl;
      // Percent is always calculated relative to startingCapital for ROI
      const currentAbsoluteEquity = isAllRange ? runningBalance : runningBalance + startingCapital;
      const percent = startingCapital > 0 ? ((currentAbsoluteEquity - startingCapital) / startingCapital) * 100 : 0;
      equityData.push({
        trade: index + 1,
        date: t.date,
        time: t.time || '',
        dateTime: `${t.date} ${t.time || ''}`,
        equity: runningBalance,
        percent: percent,
        pnl: pnl
      });
    });

    // Period stats calculation for chart header
    const dateObj = new Date(currentDateFilter);
    const currentDayStr = dateObj.toISOString().split('T')[0];
    const currentYear = dateObj.getFullYear();
    const currentMonth = dateObj.getMonth();

    const weekStart = new Date(dateObj);
    weekStart.setDate(dateObj.getDate() - dateObj.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let dayPnl = 0, weekPnl = 0, monthPnl = 0, yearPnl = 0;

    analyticsTrades.forEach(t => {
      const tPnl = parseFloat(t.pnl) || 0;
      const tDate = new Date(t.date + 'T00:00:00');

      if (t.date === currentDayStr) dayPnl += tPnl;
      if (tDate >= weekStart && tDate <= weekEnd) weekPnl += tPnl;
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) monthPnl += tPnl;
      if (tDate.getFullYear() === currentYear) yearPnl += tPnl;
    });

    const periodStats = { dayPnl, weekPnl, monthPnl, yearPnl };

    // Strategies and Charts logic
    const groupPerformance = (keyFn) => {
      const groups = {};
      analyticsTrades.forEach(t => {
        const key = keyFn(t);
        if (!groups[key]) groups[key] = { name: key, pnl: 0, count: 0, wins: 0, totalR: 0 };
        groups[key].pnl += t.pnl;
        groups[key].count += 1;
        if (t.pnl > 0) groups[key].wins += 1;
        groups[key].totalR += parseFloat(t.rMultiple || 0);
      });
      return Object.values(groups).map(g => ({
        ...g,
        winRate: g.count > 0 ? (g.wins / g.count) * 100 : 0,
        avgR: g.count > 0 ? g.totalR / g.count : 0
      }));
    };
    const strategyData = groupPerformance(t => t.strategy || 'Unknown').sort((a, b) => b.winRate - a.winRate);
    const daySorter = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
    const dayData = groupPerformance(t => getDayOfWeek(t.date)).sort((a, b) => daySorter[a.name] - daySorter[b.name]);
    const hourDataRaw = groupPerformance(t => getHourBucket(t.time));
    const hourData = hourDataRaw.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    const formattedHourData = hourData.map(h => ({ ...h, displayName: `${h.name}:00 - ${h.name + 1}:00` }));

    // Best Performers Calculation
    const findBest = (arr) => {
      if (arr.length === 0) return { name: '-', pnl: 0, winRate: 0, count: 0, avgR: 0 };
      return arr.sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.pnl - a.pnl;
      })[0];
    };

    const bestStrat = findBest(strategyData);
    const bestDay = findBest(dayData);
    const bestHour = findBest(formattedHourData);

    // Calculate weekly best performers from analyticsTrades for THIS week
    const { start, end } = getWeekDates();
    const allTradesThisWeek = analyticsTrades.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const groupPerformanceWeekly = (keyFn) => {
      const groups = {};
      allTradesThisWeek.forEach(t => {
        const key = keyFn(t);
        if (!groups[key]) groups[key] = { name: key, pnl: 0, count: 0, wins: 0, totalR: 0 };
        groups[key].pnl += t.pnl;
        groups[key].count += 1;
        if (t.pnl > 0) groups[key].wins += 1;
        groups[key].totalR += parseFloat(t.rMultiple || 0);
      });

      return Object.values(groups)
        .filter(g => g.count >= MIN_TRADES_FOR_STATS)
        .map(g => ({
          ...g,
          winRate: g.count > 0 ? (g.wins / g.count) * 100 : 0,
          avgR: g.count > 0 ? g.totalR / g.count : 0
        }));
    };

    const weeklyStrategies = groupPerformanceWeekly(t => t.strategy || 'Unknown');
    const weeklyDays = groupPerformanceWeekly(t => getDayOfWeek(t.date));
    const weeklyHoursRaw = groupPerformanceWeekly(t => getHourBucket(t.time));

    const weeklyBestStrat = findBest(weeklyStrategies);
    const weeklyBestDay = findBest(weeklyDays);
    const weeklyBestHour = findBest(weeklyHoursRaw);

    return {
      totalTrades,
      winCount: wins.length,
      lossCount: losses.length,
      totalPnl,
      grossProfit,
      grossLoss,
      winRate,
      avgR,
      currentEquity: startingCapital + totalPnl,
      equityData,
      strategyData,
      dayData,
      hourData: formattedHourData,
      weeklyBestStrat,
      weeklyBestDay,
      weeklyBestHour,
      periodStats
    };
  }, [analyticsTrades, startingCapital, currentDateFilter]);

  if (!user) {
    return <AuthSystem onLogin={handleLogin} t={t} isRTL={isRTL} />;
  }

  // Determine which stats to show at the top based on active tab
  const activeStats = activeTab === 'analytics' ? analyticsStats : stats;

  const whatsappMessage = encodeURIComponent("היי הגעתי דרך היומן מסחר ויש לי שאלה");

  return (
    <div className={`min-h-screen ${styles.bgMain} ${styles.textPrimary} font-sans transition-colors duration-300 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'} style={{ fontSize: `${settings.fontSize}px` }}>
      <header className={`${styles.bgHeader} border-b ${styles.border} sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-lg`}>
        <div className="flex items-center gap-3">
          {/* Market Type Selector (UI only) */}

          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <BarChart2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t('appTitle')}</h1>
            <p className="text-xs text-emerald-400 tracking-wide">לימודי מסחר ושוק ההון</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-all shadow-lg"
            title={t('logout')}
          >
            <LogOut size={18} />
            <span className="hidden md:inline text-sm">{t('logout')}</span>
          </button>
        </div>
      </header>

      <main className="p-6 w-full mx-auto space-y-8 pb-32">

        {/* Welcome Message */}
        <div className="text-center py-6">
          <style>
            {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&family=Rubik:wght@600;700;900&display=swap');`}
          </style>
          <h2 className={`text-3xl md:text-4xl font-bold ${styles.textPrimary} mb-2 tracking-tight`} style={{ fontFamily: "'Inter', 'Rubik', sans-serif" }}>
            {t('mainTitle')}
          </h2>
          <p className={`text-base md:text-lg ${styles.textSecondary} opacity-70 font-medium`}>{t('slogan')}</p>
        </div>

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard title={t('netPnl')} value={`${settings.currency}${formatNumber(activeStats.totalPnl)}`} icon={DollarSign} trend={activeStats.totalPnl > 0 ? 'up' : activeStats.totalPnl < 0 ? 'down' : 'neutral'} isRTL={isRTL} styles={styles} />
          <MetricCard title={t('winRate')} value={`${formatNumber(activeStats.winRate)}%`} subValue={`${activeStats.winCount} W - ${activeStats.lossCount} L`} icon={Target} trend={activeStats.winRate > 50 ? 'up' : 'neutral'} isRTL={isRTL} styles={styles} />
          <MetricCard title={t('equity')} value={`${settings.currency}${formatNumber(activeStats.currentEquity)}`} icon={TrendingUp} trend={'neutral'} isRTL={isRTL} styles={styles} />
          <MetricCard title={t('avgR')} value={`${formatNumber(activeStats.avgR)}R`} icon={Activity} trend={activeStats.avgR >= 0 ? 'up' : 'down'} isRTL={isRTL} styles={styles} />

          <MetricCard title={t('grossProfit')} value={`${settings.currency}${formatNumber(activeStats.grossProfit)}`} icon={TrendingUp} trend={'up'} isRTL={isRTL} styles={styles} />
          <MetricCard title={t('grossLoss')} value={`${settings.currency}${formatNumber(Math.abs(activeStats.grossLoss))}`} icon={TrendingDown} trend={'down'} isRTL={isRTL} styles={styles} />
          <MetricCard title={t('startCap')} value={startingCapital} isInput={true} inputValue={startingCapital} currency={settings.currency} onInputChange={async (e) => {
            const val = parseFloat(e.target.value) || 0;
            setStartingCapital(val);
            if (user && hydrated) {
              const dataToSave = {
                trades,
                settings,
                startingCapital: val,
                goals,
                lang
              };
              // Save to both Local DB and Cloud immediately
              await localDbService.saveUserData(user, 'stocks', dataToSave);
              await tradeService.updateProfile(user, { stocks_data: dataToSave });
              // Push to other device relay
              tradeService.pushCapital(user, 'stocks', val);
            }
          }} icon={DollarSign} trend={'neutral'} isRTL={isRTL} styles={styles} />

          <div className={`${styles.bgCard} rounded-xl p-5 border ${styles.border} ${styles.shadow} flex flex-col justify-between h-32 ${isRTL ? 'text-right' : ''}`}>
            <div className="flex-1 flex flex-col justify-center">
              <div className={`flex justify-between items-center mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className={`${styles.textSecondary} text-xs font-bold uppercase`}>{t('winsCount')}</span>
                <span className="text-xl font-bold text-emerald-500">{activeStats.winCount}</span>
              </div>
              <div className={`w-full h-px ${styles.border} my-1`}></div>
              <div className={`flex justify-between items-center mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className={`${styles.textSecondary} text-xs font-bold uppercase`}>{t('lossesCount')}</span>
                <span className="text-xl font-bold text-rose-500">{activeStats.lossCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`flex justify-between md:justify-start gap-1 md:gap-4 border-b ${styles.border} overflow-x-auto scrollbar-hide`}>
          {[
            { id: 'journal', icon: List, label: t('tradeLog') },
            { id: 'gallery', icon: Grid, label: t('gallery') },
            { id: 'calendar', icon: CalendarIcon, label: t('calendar') },
            { id: 'analytics', icon: PieIcon, label: t('analytics') },
            { id: 'mental', icon: Activity, label: t('mentalTab') },
            { id: 'goals', icon: Trophy, label: t('goalsTab') },
            { id: 'connections', icon: ShieldCheck, label: lang === 'he' ? 'קולמקס פרו' : 'Colmex Pro' },
            { id: 'settings', icon: Settings, label: t('settings') }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-3 px-1 font-bold flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors relative whitespace-nowrap flex-shrink-0 transition-all ${activeTab === tab.id ? 'text-blue-500' : `${styles.textSecondary} hover:${styles.textPrimary}`
              }`}>
              <tab.icon size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="text-[8px] md:text-sm">{tab.label}</span>
              {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>}
            </button>
          ))}
        </div>


        {activeTab === 'connections' && (
          <ConnectionsView
            t={t}
            styles={styles}
            isRTL={isRTL}
            lang={lang}
            manualUrl={manualUrl}
            setManualUrl={setManualUrl}
            isColmexConnected={isColmexConnected}
            setIsColmexConnected={setIsColmexConnected}
            isSyncing={isSyncing}
            onSyncTrades={handleSyncTrades}
            onResetColmexData={handleResetColmexData}
            setActiveTab={setActiveTab}
            username={user}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
            t={t}
            styles={styles}
            isRTL={isRTL}
            lang={lang}
            setLang={setLang}
            onClose={() => setActiveTab('journal')}
            onExport={handleExportTrades}
            onImport={() => setIsImportModalOpen(true)}
            onPrint={() => window.print()}
            onLogout={propOnLogout}
          />
        )}

        {isImportModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className={`${styles.bgCard} w-full max-w-md rounded-2xl p-6 border ${styles.border} shadow-2xl overflow-hidden relative`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-bold ${styles.textPrimary} flex items-center gap-2`}>
                  <FileUp className="text-blue-500" /> {t('importTitle')}
                </h2>
                <button onClick={() => setIsImportModalOpen(false)} className={`${styles.textSecondary} hover:text-white p-1`}>
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={`block text-xs font-bold ${styles.textSecondary} uppercase mb-2`}>
                    {t('selectPlatform')}
                  </label>
                  <select
                    value={importPlatform}
                    onChange={(e) => setImportPlatform(e.target.value)}
                    className={`w-full p-3 ${styles.inputBg} border ${styles.border} rounded-xl ${styles.textPrimary} font-bold outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="ibkr">{t('brokerIBKR')}</option>
                  </select>
                </div>

                <div className="relative group">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleImportTrades(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full py-8 border-2 border-dashed ${styles.border} rounded-2xl flex flex-col items-center justify-center gap-3 group-hover:border-blue-500 group-hover:bg-blue-500/5 transition-all`}>
                    <div className="bg-blue-500/10 p-4 rounded-full text-blue-500 group-hover:scale-110 transition-transform">
                      <Upload size={32} />
                    </div>
                    <p className={`text-sm font-bold ${styles.textSecondary}`}>
                      {isRTL ? 'גרור קובץ לכאן או לחץ לבחירה' : 'Drag file here or click to select'}
                    </p>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">XLSX, XLS, CSV</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className={`w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors`}
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className={`${styles.bgCard} rounded-xl shadow-lg border ${styles.border} overflow-hidden`}>
            {/* ... Journal Toolbar & Table (Updated styles) ... */}
            <div className={`p-4 border-b ${styles.border} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 flex-nowrap">
                {/* 1. View Mode Selection */}
                <div className="shrink-0">
                  <select value={timeViewMode} onChange={(e) => setTimeViewMode(e.target.value)} className={`${styles.inputBg} border ${styles.border} ${styles.textPrimary} text-[12px] rounded-lg px-3 h-10 outline-none focus:border-emerald-500 font-bold cursor-pointer min-w-[85px]`}>
                    <option value="day">{t('viewDay')}</option>
                    <option value="week">{t('viewWeek')}</option>
                    <option value="month">{t('viewMonth')}</option>
                    <option value="year">{t('viewYear')}</option>
                    <option value="all">{t('viewAll')}</option>
                  </select>
                </div>

                {/* 2. Date Display Box (with hidden input) */}
                <div className={`relative flex items-center ${styles.inputBg} rounded-lg h-10 px-3 border ${styles.border} cursor-pointer group hover:border-emerald-500 transition-colors shrink-0 min-w-[140px]`}>
                  <CalendarDays size={16} className="text-emerald-500 mr-2 ml-2" />
                  <span className={`font-bold ${styles.textPrimary} text-[12px] whitespace-nowrap`}>{getDateRangeLabel()}</span>
                  <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={currentDateFilter.toISOString().split('T')[0]} onChange={(e) => { if (e.target.value) { setCurrentDateFilter(new Date(e.target.value)); setTimeViewMode('day'); } }} />
                </div>

                {/* 3. Navigation Arrows - Shrunk and parallel */}
                <div className={`flex items-center ${styles.inputBg} rounded-lg border ${styles.border} overflow-hidden h-10 shrink-0`}>
                  <button onClick={() => handleDateNavigate(-1)} className={`h-full px-2.5 hover:${styles.hoverBg} ${styles.textSecondary} border-r ${styles.border} transition-colors flex items-center justify-center`}>
                    {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                  </button>
                  <button onClick={() => handleDateNavigate(1)} className={`h-full px-2.5 hover:${styles.hoverBg} ${styles.textSecondary} transition-colors flex items-center justify-center`}>
                    {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">

                <button onClick={() => { setEditingTrade(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all shadow-md hover:shadow-emerald-600/20 transform active:scale-95 uppercase tracking-wider justify-center w-full md:w-auto">
                  <Plus size={18} /> {t('addTrade')}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className={`${styles.inputBg} ${styles.textSecondary} text-xs uppercase font-bold tracking-wider`}>
                  <tr>

                    <th className={`p-4 border-b ${styles.border} ${isRTL ? 'text-right' : 'text-left'}`}>{t('date')}</th>
                    <th className={`p-4 border-b ${styles.border} text-center whitespace-nowrap`}>{t('mental')}</th>
                    <th className={`p-4 border-b ${styles.border} ${isRTL ? 'text-right' : 'text-left'}`}>{t('symbol')}</th>
                    <th className={`p-4 border-b ${styles.border} ${isRTL ? 'text-right' : 'text-left'}`}>{t('position')}</th>
                    <th className={`p-4 border-b ${styles.border} ${isRTL ? 'text-right' : 'text-left'}`}>{t('strategy')}</th>
                    <th className={`p-4 border-b ${styles.border} ${isRTL ? 'text-left' : 'text-right'}`}>{t('pnl')}</th>
                    <th className={`p-4 text-center border-b ${styles.border}`}>{t('r')}</th>
                    <th className={`p-4 text-center border-b ${styles.border}`}>{t('notes')}</th>
                    <th className={`p-4 text-center border-b ${styles.border} whitespace-nowrap`}>{t('screenshot')}</th>
                    <th className={`p-4 text-center border-b ${styles.border}`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${styles.border}`}>
                  {filteredTrades.map(trade => (
                    <tr
                      key={trade.id}
                      className={`hover:${styles.hoverBg} transition-colors text-sm group ${selectedTradeIds.has(String(trade.id)) ? 'bg-blue-500/10' : ''}`}
                    >

                      <td className={`p-4 ${styles.textSecondary}`}>
                        <div className="flex flex-col">
                          <span className="font-medium whitespace-nowrap text-[13px]">{trade.date}</span>
                          <span className="text-[11px] opacity-60">{trade.time}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {trade.mental && (
                          <div className={`w-4 h-4 rounded-full mx-auto ${trade.mental === 'green' ? 'bg-emerald-500' :
                            trade.mental === 'yellow' ? 'bg-yellow-500' :
                              trade.mental === 'red' ? 'bg-red-500' : 'bg-slate-600'
                            }`} title={
                              trade.mental === 'green' ? t('mentalGreen') :
                                trade.mental === 'yellow' ? t('mentalYellow') :
                                  trade.mental === 'red' ? t('mentalRed') : ''
                            }></div>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap"><span className={`font-bold ${styles.textPrimary}`}>{trade.symbol}</span></td>
                      <td className="p-4 whitespace-nowrap"><span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${trade.type === 'Long' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>{t(trade.type.toLowerCase())}</span></td>
                      <td className={`p-4 ${styles.textSecondary} font-medium whitespace-nowrap`}>{trade.strategy}</td>
                      <td className={`p-4 font-bold font-mono ${isRTL ? 'text-left' : 'text-right'} ${trade.pnl > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{trade.pnl > 0 ? '+' : ''}{formatNumber(trade.pnl)}</td>
                      <td className={`p-4 text-center ${styles.textSecondary} font-mono`}>
                        {(() => {
                          // Calculate R/R ratio from trade data
                          if (trade.entry && trade.exit && trade.stopLoss) {
                            const risk = Math.abs(trade.entry - trade.stopLoss);
                            const reward = Math.abs(trade.exit - trade.entry);
                            if (risk > 0) {
                              const ratio = (reward / risk).toFixed(1);
                              return `1:${ratio}`;
                            }
                          }
                          // Fallback: show from stored data if available
                          if (trade.riskRewardRatio && trade.riskRewardRatio !== '0:0') {
                            return trade.riskRewardRatio;
                          }
                          // Last fallback
                          return trade.rMultiple ? `${trade.rMultiple}R` : '-';
                        })()}
                      </td>
                      <td className={`p-4 text-center ${styles.textSecondary}`}>
                        {trade.notes && <button onClick={(e) => { e.stopPropagation(); setViewingNotes(trade.notes); }} className={`p-1.5 hover:${styles.hoverBg} rounded text-yellow-400 transition-colors`}><StickyNote size={18} /></button>}
                      </td>
                      <td className={`p-4 text-center ${styles.textSecondary}`}>
                        {trade.image && <button onClick={(e) => { e.stopPropagation(); setActiveTab("gallery"); }} className="inline-block p-1 bg-slate-500/20 rounded hover:bg-slate-500/40 transition-colors text-blue-400" type="button"><ImageIcon size={16} /></button>}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleEditTrade(trade); }} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteTrade(trade.id);
                            }}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTrades.length === 0 && <div className={`p-12 text-center ${styles.textSecondary} flex flex-col items-center`}><List size={48} className="mb-4 opacity-20" /><p>{t('noTrades')}</p></div>}
            </div>
          </div>
        )}

        {/* ... Other Tabs (Gallery, Calendar, Analytics) would use similar dynamic styles ... */}
        {activeTab === 'gallery' && <GalleryView trades={filteredTrades} isRTL={isRTL} t={t} onEdit={handleEditTrade} styles={styles} currency={settings.currency} />}
        {activeTab === 'calendar' && <CalendarView trades={trades} isRTL={isRTL} t={t} onDayClick={handleCalendarDayClick} styles={styles} currency={settings.currency} lang={lang} />}
        {activeTab === 'goals' && <GoalsView trades={trades} goals={goals} setGoals={handleUpdateGoals} t={t} styles={styles} isRTL={isRTL} currency={settings.currency} lang={lang} />}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 gap-6 pb-12">
            <div className={`${styles.bgCard} p-6 rounded-xl shadow-lg border ${styles.border}`}>
              <div className="mb-6">
                <h3 className={`text-sm font-bold ${styles.textSecondary} uppercase`}>{analyticsRange === 'ALL' ? (lang === 'he' ? 'גרף שווי התיק' : 'Portfolio Value Chart') : t('equityCurve')}</h3>
              </div>


              {/* Analytics Range Buttons */}
              <div className="flex justify-start items-center gap-2 mb-6 bg-slate-900/30 p-1.5 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                  {[
                    { id: '1W', label: '1W' },
                    { id: '1M', label: '1M' },
                    { id: '3M', label: '3M' },
                    { id: '6M', label: '6M' },
                    { id: 'YTD', label: 'YTD' },
                    { id: '1Y', label: '1Y' },
                    { id: 'ALL', label: 'ALL' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAnalyticsRange(r.id)}
                      className={`px-1.5 py-1 md:px-4 md:py-2 rounded-lg text-[9px] md:text-xs font-bold transition-all border whitespace-nowrap
                        ${analyticsRange === r.id
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : `${styles.inputBg} ${styles.textSecondary} border-slate-700 hover:bg-slate-700/40`
                        }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>



              {/* Chart container with horizontal scroll on mobile */}
              <div className="overflow-x-auto scrollbar-hide">
                <div className={`h-80 w-full md:w-full border ${styles.border} rounded-lg bg-gradient-to-br ${settings.theme === 'light' ? 'from-gray-50 to-white' : 'from-slate-900/50 to-slate-800/30'} shadow-inner outline-none relative`} style={{ minWidth: '600px', userSelect: 'none' }} dir="ltr">
                  {/* Y-Axis Mode Dropdown */}
                  <div className="absolute top-2 left-6 z-50">
                    <DropdownComponent
                      currency={settings.currency}
                      showPercentage={showPercentage}
                      setShowPercentage={setShowPercentage}
                    />
                  </div>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {(() => {
                      const lastPoint = analyticsStats.equityData[analyticsStats.equityData.length - 1];
                      const currentValue = showPercentage ? lastPoint?.percent : lastPoint?.equity;
                      const isPositive = currentValue >= (showPercentage ? 0 : (analyticsRange === 'ALL' ? startingCapital : 0));
                      const chartColor = isPositive ? '#10b981' : '#ef4444';

                      return (
                        <AreaChart key={analyticsRange} data={analyticsStats.equityData} margin={{ top: 35, right: 30, left: 10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="colorValueStocks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={settings.theme === 'light' ? '#e5e7eb' : '#334155'} opacity={0.1} />

                          <XAxis
                            dataKey="trade"
                            padding={{ left: 10, right: 10 }}
                            stroke={settings.theme === 'light' ? '#6b7280' : '#64748b'}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke={settings.theme === 'light' ? '#6b7280' : '#64748b'}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => showPercentage ? `${val.toFixed(1)}%` : formatCompactNumber(val)}
                          />
                          <Tooltip
                            cursor={false}
                            contentStyle={{ backgroundColor: settings.theme === 'light' ? '#fff' : '#1e293b', borderRadius: '8px', border: '1px solid #475569' }}
                            formatter={(val) => showPercentage ? [`${val.toFixed(2)}%`, t('equityCurvePercent')] : [`${settings.currency}${formatNumber(val)}`, analyticsRange === 'ALL' ? t('equity') : t('pnl')]}
                            labelFormatter={(label, payload) => {
                              if (!payload || payload.length === 0) return label;
                              const data = payload[0].payload;
                              if (data.date === 'Start' || data.date === 'התחלה') return data.date;
                              return `${data.date} ${data.time}`;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey={showPercentage ? "percent" : "equity"}
                            stroke={chartColor}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValueStocks)"
                            animationDuration={1500}
                          />
                        </AreaChart>
                      );
                    })()}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>


            {/* Analytics Performance Section */}
            <AnalyticsPerformanceSection
              analyticsStats={analyticsStats}
              filteredTrades={analyticsTrades}
              minTrades={1}
              currencySymbol={settings.currency}
              t={t}
            />


          </div>
        )}

        {activeTab === "mental" && (() => {
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
              const pnl = parseFloat(trade.pnl) || 0;
              mentalStats[mental].totalPnl += pnl;
              if (pnl > 0) mentalStats[mental].wins++;
            }
          });

          const totalWithMental = mentalStats.green.count + mentalStats.yellow.count + mentalStats.red.count;

          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className={`text-3xl font-bold ${styles.textPrimary} mb-2 whitespace-nowrap`}>{t("mentalStats")}</h2>
                <p className={styles.textSecondary}>
                  {lang === 'he' ? "נתח את המצב המנטלי שלך במהלך המסחר" : "Analyze your mental state during trading"}
                </p>
              </div>

              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { key: 'green', title: t("disciplinedTrades"), color: "bg-emerald-500", border: "border-emerald-500/30", barColor: "bg-emerald-500", textColor: "text-emerald-400", label: t("mentalGreen") },
                    { key: 'yellow', title: t("randomTrades"), color: "bg-yellow-500", border: "border-yellow-500/30", barColor: "bg-yellow-500", textColor: "text-yellow-400", label: t("mentalYellow") },
                    { key: 'red', title: t("emotionalTrades"), color: "bg-red-500", border: "border-red-500/30", barColor: "bg-red-500", textColor: "text-red-400", label: t("mentalRed") }
                  ].map(card => {
                    const stats = mentalStats[card.key];
                    const wr = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0;
                    const percentage = totalWithMental > 0 ? (stats.count / totalWithMental) * 100 : 0;
                    return (
                      <div key={card.key} className={`${styles.bgCard} rounded-xl shadow-lg border-2 ${card.border} p-6 transition-transform hover:scale-[1.02]`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-lg font-bold ${styles.textPrimary}`}>{card.title}</h3>
                          <div className={`w-7 h-7 rounded-full ${card.color} shadow-lg shadow-${card.color.split('-')[1]}-500/20`}></div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className={`text-sm ${styles.textSecondary}`}>{t("totalTrades")}</p>
                            <p className={`text-2xl font-bold ${styles.textPrimary}`}>{stats.count}</p>
                          </div>
                          <div>
                            <p className={`text-sm ${styles.textSecondary}`}>{t("winRate")}</p>
                            <p className={`text-xl font-bold ${wr > 50 ? 'text-emerald-500' : 'text-rose-500'}`}>{wr.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className={`text-sm ${styles.textSecondary}`}>{t("netPnl")}</p>
                            <p className={`text-xl font-bold ${stats.totalPnl > 0 ? 'text-emerald-500' : stats.totalPnl < 0 ? 'text-rose-500' : styles.textPrimary}`}>
                              {stats.totalPnl > 0 ? '+' : ''}{settings.currency}{formatNumber(stats.totalPnl)}
                            </p>
                          </div>

                          {/* Progress Bar Section */}
                          <div className="pt-4 border-t border-slate-700/50">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className={`text-xs font-bold ${card.textColor} uppercase tracking-wider`}>{card.label}</span>
                              <span className={`text-xs font-bold ${styles.textPrimary}`}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                              <div
                                className={`h-full ${card.barColor} transition-all duration-500 shadow-lg shadow-${card.barColor.split('-')[1]}-500/20`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            </div>
          );
        })()}

      </main>

      <TradeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTrade} editingTrade={editingTrade} existingStrategies={uniqueStrategies} t={t} isRTL={isRTL} styles={styles} lang={lang} />
      <NoteViewerModal
        isOpen={!!viewingNotes}
        onClose={() => setViewingNotes(null)}
        notes={viewingNotes}
        styles={styles}
        t={t}
        isRTL={lang === 'he'}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        trade={trades.find(t => t.id === selectedTradeId)}
        t={t}
        styles={styles}
        currency={settings.currency}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className={`${styles.bgCard} rounded-2xl shadow-2xl border ${styles.border} max-w-md w-full p-8 md:p-10 transform transition-all relative overflow-hidden`}>
            {/* Content Section */}
            <div className="flex flex-col items-center mb-8 w-full">
              {/* Icon Circle - Made smaller */}
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 shadow-inner">
                <Trash2 size={24} className="text-red-500" />
              </div>

              {/* Text Content Centered */}
              <div className="text-center">
                <h3 className={`text-xl md:text-2xl font-black ${styles.textPrimary} leading-tight mb-3`}>
                  {t('deleteConfirm')}
                </h3>
                <p className={`${styles.textSecondary} text-sm md:text-md opacity-60 font-medium max-w-[280px] mx-auto`}>
                  {lang === 'he'
                    ? 'פעולה זו תמחק את העסקה לצמיתות ולא ניתן יהיה לשחזר אותה'
                    : 'This action will permanently delete the trade and cannot be undone.'}
                </p>
              </div>
            </div>

            {/* Buttons Section */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={cancelDelete}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${styles.inputBg} ${styles.textPrimary} hover:${styles.hoverBg} border ${styles.border} text-sm md:text-lg shadow-lg`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 text-sm md:text-lg"
              >
                {lang === 'he' ? 'מחק' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className={`${styles.bgCard} rounded-2xl shadow-2xl border ${styles.border} max-w-md w-full p-8 md:p-10 transform transition-all relative overflow-hidden`}>
            {/* Content Section */}
            <div className="flex flex-col items-center mb-10 w-full relative">
              {/* Text block (Centered in the modal) */}
              <div className="text-center w-full px-2 md:px-0">
                <h3 className={`text-xl md:text-xl font-black ${styles.textPrimary} leading-tight whitespace-pre-line`}>
                  {t('logoutTitle')}
                </h3>
                <p className={`${styles.textSecondary} text-sm md:text-lg opacity-50 mt-2 font-medium`}>
                  {t('logoutWarning')}
                </p>
              </div>
            </div>

            {/* Buttons Section */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-8 py-3 rounded-xl font-bold transition-all bg-[#2a313d] hover:bg-[#3d4a5d] text-white text-md md:text-lg shadow-lg border border-white/5"
              >
                {t('no')}
              </button>
              <button
                onClick={confirmLogout}
                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 text-md md:text-lg"
              >
                {t('yes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Floating Button - Enhanced with Official Icon */}
      {!isModalOpen && !shareModalOpen && (
        <a
          href={`https://wa.me/972547899848?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed bottom-8 ${isRTL ? 'left-8' : 'right-8'} z-50 group`}
          title={t('contactWhatsapp')}
        >
          <div className="relative flex items-center justify-center w-16 h-16">
            {/* Ping Animation Ring */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping duration-[1500ms]"></span>

            {/* Main Button */}
            <div className="relative w-16 h-16 bg-[#25D366] hover:bg-[#20ba5a] rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.5)] flex items-center justify-center text-white transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6">
              {/* Official WhatsApp SVG Icon */}
              <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor" className="drop-shadow-sm">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>

            {/* Tooltip */}
            <span className={`
                  absolute ${isRTL ? 'left-20' : 'right-20'} 
                  bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-xl
                  whitespace-nowrap opacity-0 group-hover:opacity-100 
                  transition-all duration-300 transform translate-y-2 group-hover:translate-y-0
                  pointer-events-none border border-slate-700
              `}>
              {t('contactWhatsapp')}
            </span>
          </div>
        </a>
      )}
    </div >
  );
}