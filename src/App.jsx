import React, { useState, useEffect } from 'react';
import { BarChart2, Eye, EyeOff, Coins, TrendingUp, Globe, ChevronDown } from 'lucide-react';
import FuturesApp from './apps/FuturesApp';
import StocksApp from './StocksApp';
import { sendVerificationEmail, generateVerificationCode } from './emailConfig';
import { saveUserAccount, loadUserAccount } from './firebaseConfig';

// Translation function
const TRANSLATIONS = {
    en: {
        appTitle: "S Trader",
        subtitle: "Trading & Capital Markets Education",
        loginTitle: "Login to S Trader",
        registerTitle: "Create Account",
        forgotPass: "Forgot Password?",
        username: "Username",
        password: "Password",
        securityQuestion: "Security Question",
        securityAnswer: "Your Answer",
        loginBtn: "Enter Journal",
        registerBtn: "Register",
        recoverBtn: "Recover Account",
        backToLogin: "Back to Login",
        resetPass: "Reset Password",
        newPass: "New Password",
        rememberMe: "Remember Me",
        questionPlaceholder: "e.g., What is your mother's maiden name?",
        answerPlaceholder: "Your answer",
        userExists: "Username already exists",
        userNotFound: "User does not exist. Please register first.",
        wrongPassword: "Incorrect password",
        wrongAnswer: "Incorrect answer to security question",
        fillAllFields: "Please fill all fields",
        passwordReset: "Password reset successfully! Please login.",
        chooseRecoveryMethod: "Choose recovery method",
        recoverWithQuestion: "Recover with Security Question",
        recoverWithPhone: "Recover with Personal Code",
        recoverWithAdmin: "Recover with Admin Code",
        securityQuestion1: "What was your first teacher's name?",
        securityQuestion2: "In which city were you born?",
        securityQuestion3: "What was the name of your first pet?",
        answerLabel: "Answer",
        personalCodeLabel: "Personal Code (4 digits)",
        mobilePhoneNumber: "Mobile Phone Number",
        enterPhone: "Enter phone number",
        enterPersonalCode: "Enter personal code",
        enterAdminCode: "Enter admin code",
        phoneOrUsername: "Phone or Username",
        recoverWithEmail: "Recover with Email",
        email: "Email Address",
        enterEmail: "Enter email address",
        selectJournal: "Select Journal",
        futuresJournal: "Futures Journal",
        stocksJournal: "Stocks Journal",
        logout: "Logout",
        switchJournal: "Switch Journal",
        hello: "Hello",
        futuresTrading: "Futures Trading",
        stocksTrading: "Stock Trading",
        stocks: "Stocks",
        futures: "Futures",
        personalCodeDigitError: "Personal code must be 4 digits",
        invalidAdminCode: "Invalid admin code",
        wrongPhone: "Wrong phone number",
        wrongEmail: "This email address is not recognized in our system",
        wrongPersonalCode: "Wrong personal code",
        wrongSecurityQuestion: "Wrong security question",
        codeSent: "Verification code sent to",
        invalidVerificationCode: "Invalid verification code",
        verifyCode: "Verify Code",
        enterCodeSent: "Enter the 4-digit code sent to your email",
        usernameEnglishOnly: "Username must contain only English letters and numbers",
        noSpaces: "Username and password cannot contain spaces",
        registrationSuccess: "Registration completed successfully!",
        forgotUsername: "Forgot Username?",
        enterEmailForUsername: "Enter your email for username recovery",
        noAccount: "Don't have an account?",
        signUp: "Sign Up",
        newUsernameLabel: "New Username",
        updateAndLogin: "Update and Login",
        usernameUpdated: "Username updated successfully!",
        enterNewUsername: "Enter new username",
        currentUsernameIs: "Your current username is",
    },
    he: {
        appTitle: "S Trader",
        subtitle: "לימודי מסחר ושוק ההון",
        loginTitle: "התחברות ליומן מסחר",
        registerTitle: "יצירת חשבון",
        forgotPass: "שכחתי סיסמא?",
        username: "שם משתמש",
        password: "סיסמא",
        securityQuestion: "שאלת אבטחה",
        securityAnswer: "התשובה שלך",
        loginBtn: "כנס ליומן",
        registerBtn: "הרשמה",
        recoverBtn: "שחזר חשבון",
        backToLogin: "חזרה",
        resetPass: "אפס סיסמא",
        newPass: "סיסמא חדשה",
        rememberMe: "זכור אותי",
        questionPlaceholder: "לדוגמה: מה שם הבית של אמא שלך?",
        answerPlaceholder: "התשובה שלך",
        userExists: "שם המשתמש כבר קיים",
        userNotFound: "משתמש לא קיים אנא הירשם תחילה",
        wrongPassword: "סיסמה שגויה",
        wrongAnswer: "תשובה שגויה לשאלת האבטחה",
        fillAllFields: "נא למלא את כל השדות",
        passwordReset: "הסיסמה אופסה בהצלחה אנא התחבר",
        chooseRecoveryMethod: "בחר שיטת שחזור",
        recoverWithQuestion: "שחזור באמצעות שאלת אבטחה",
        recoverWithPhone: "שחזור באמצעות קוד אישי",
        recoverWithAdmin: "שחזור באמצעות קוד מנהל",
        securityQuestion1: "מה שם המורה הראשון שלך?",
        securityQuestion2: "באיזו עיר נולדת?",
        securityQuestion3: "מה שם חיית המחמד הראשונה שלך?",
        answerLabel: "תשובה",
        personalCodeLabel: "קוד אישי (4 ספרות)",
        mobilePhoneNumber: "מספר טלפון נייד",
        enterPhone: "הזן מספר טלפון",
        enterPersonalCode: "הזן קוד אישי",
        enterAdminCode: "הזן קוד מנהל",
        phoneOrUsername: "טלפון או שם משתמש",
        recoverWithEmail: "שחזור באמצעות מייל",
        email: "כתובת מייל",
        enterEmail: "הזן כתובת מייל",
        selectJournal: "בחר יומן",
        futuresJournal: "יומן חוזים עתידיים",
        stocksJournal: "יומן מניות",
        logout: "התנתק",
        switchJournal: "החלף יומן",
        hello: "שלום",
        futuresTrading: "מסחר בחוזים עתידיים",
        stocksTrading: "מסחר במניות",
        stocks: "מניות",
        futures: "חוזים",
        personalCodeDigitError: "הקוד האישי חייב להיות 4 ספרות",
        invalidAdminCode: "קוד מנהל שגוי",
        wrongEmail: "כתובת מייל זו אינה מוכרת במערכת",
        wrongPhone: "קוד אישי שגוי",
        wrongPersonalCode: "קוד אישי שגוי",
        wrongSecurityQuestion: "שאלת אבטחה שגויה",
        codeSent: "קוד אימות נשלח ל-",
        invalidVerificationCode: "קוד אימות שגוי",
        verifyCode: "אימות קוד",
        enterCodeSent: "הזן את קוד בן 4 הספרות שנשלח למייל שלך",
        usernameEnglishOnly: "שם המשתמש חייב להכיל רק אותיות באנגלית ומספרים",
        noSpaces: "שם המשתמש והסיסמה לא יכולים להכיל רווחים",
        registrationSuccess: "ההרשמה הושלמה בהצלחה",
        forgotUsername: "שכחתי שם משתמש?",
        enterEmailForUsername: "הזן את המייל שלך לשחזור שם המשתמש",
        noAccount: "אין לך חשבון?",
        signUp: "להרשמה",
        newUsernameLabel: "שם משתמש חדש",
        updateAndLogin: "עדכן והתחבר",
        usernameUpdated: "שם המשתמש עודכן בהצלחה",
        enterNewUsername: "הזן שם משתמש חדש",
        currentUsernameIs: "שם המשתמש הנוכחי הוא",
    }
};

const INITIAL_SETTINGS = {
    currency: '$',
    theme: 'dark',
    fontSize: 14
};

// Simple password hashing (for demo - in production use bcrypt)
const hashPassword = (password) => {
    if (!password) return '';
    return btoa(password); // Base64 encoding (NOT secure for production!)
};

// Centralized Auth Component
const CentralAuth = ({ onLogin, lang: initialLang = 'he' }) => {
    const [lang, setLang] = useState(initialLang);
    const t = (key) => TRANSLATIONS[lang]?.[key] || key;
    const isRTL = lang === 'he';

    const [view, setView] = useState('login');
    const [selectedJournal, setSelectedJournal] = useState(() => {
        return localStorage.getItem('smartJournal_lastJournal') || 'futures';
    }); // Load last used journal from storage or default to futures
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        securityQuestion: '',
        securityAnswer: '',
        newPass: '',
        phoneNumber: '',
        email: '',
        personalCode: '',
        verificationCode: '',
        newUsername: ''
    });
    const [isUsernameFound, setIsUsernameFound] = useState(false);
    const [originalUsername, setOriginalUsername] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [recoveryMethod, setRecoveryMethod] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [sentVerificationCode, setSentVerificationCode] = useState(''); // Store sent code
    const [isEmailSending, setIsEmailSending] = useState(false); // Loading state
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(0); // Countdown timer in seconds

    // Save selected journal to storage whenever it changes
    useEffect(() => {
        localStorage.setItem('smartJournal_lastJournal', selectedJournal);
    }, [selectedJournal]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const savedCreds = localStorage.getItem('smartJournal_creds');
        if (savedCreds) {
            const { username, password } = JSON.parse(savedCreds);
            setFormData(prev => ({ ...prev, username, password }));
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');

        if (!users[formData.username]) {
            setError(t('userNotFound'));
            return;
        }

        if (!formData.password) {
            setError(t('fillAllFields'));
            return;
        }

        if (formData.username.includes(' ') || formData.password.includes(' ')) {
            setError(t('noSpaces'));
            return;
        }

        const user = users[formData.username];
        let cloudUser = null;

        // Try to load from cloud if locally not consistent or for double check
        setIsLoading(true);
        try {
            cloudUser = await loadUserAccount(formData.username);
        } catch (e) {
            console.warn("Cloud auth check failed", e);
        }
        setIsLoading(false);

        const activeUser = cloudUser || user;

        if (!activeUser) {
            setError(t('userNotFound'));
            return;
        }

        const hashedInput = hashPassword(formData.password);
        if (hashedInput !== activeUser.password) {
            setError(t('wrongPassword'));
            return;
        }

        // Sync to local if found on cloud but not local
        if (cloudUser && !users[formData.username]) {
            users[formData.username] = cloudUser;
            localStorage.setItem('smartJournal_users', JSON.stringify(users));
        }

        if (rememberMe) {
            localStorage.setItem('smartJournal_creds', JSON.stringify({
                username: formData.username,
                password: formData.password
            }));
        } else {
            localStorage.removeItem('smartJournal_creds');
        }
        onLogin(formData.username, selectedJournal);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.username || !formData.password || !formData.email || !formData.personalCode) {
            setError(t('fillAllFields'));
            return;
        }

        if (formData.username.includes(' ') || formData.password.includes(' ')) {
            setError(t('noSpaces'));
            return;
        }

        // Check if username contains only English letters and numbers
        if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
            setError(t('usernameEnglishOnly'));
            return;
        }

        if (!/^\d{4}$/.test(formData.personalCode)) {
            setError(t('personalCodeDigitError'));
            return;
        }

        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');
        if (users[formData.username]) {
            setError(t('userExists'));
            return;
        }

        const newUser = {
            username: formData.username,
            password: hashPassword(formData.password),
            email: formData.email.toLowerCase(),
            personalCode: hashPassword(formData.personalCode),
            trades: [],
            settings: INITIAL_SETTINGS,
            registrationDate: new Date().toISOString()
        };

        users[formData.username] = newUser;
        localStorage.setItem('smartJournal_users', JSON.stringify(users));

        // Sync to cloud
        setIsLoading(true);
        saveUserAccount(formData.username, newUser).finally(() => {
            setIsLoading(false);
        });

        // Show success message and redirect to login
        setSuccess(t('registrationSuccess'));
        setTimeout(() => {
            setView('login');
            setFormData({ username: '', password: '', securityQuestion: '', securityAnswer: '', newPass: '', phoneNumber: '', email: '', personalCode: '', verificationCode: '' });
            setSuccess('');
        }, 2000);
    };

    const handleRecover = async (e) => {
        e.preventDefault();
        setError('');

        const ADMIN_CODE = '2468';
        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');

        if (view === 'recover_admin') {
            if (!formData.username || !formData.personalCode) {
                setError(t('fillAllFields'));
                return;
            }

            if (formData.personalCode !== ADMIN_CODE) {
                setError(t('invalidAdminCode'));
                return;
            }

            let foundUser = users[formData.username];
            if (!foundUser) {
                foundUser = Object.values(users).find(u => u.phoneNumber === formData.username);
                if (foundUser) {
                    setFormData({ ...formData, username: foundUser.username });
                }
            }

            if (!foundUser) {
                setError(t('userNotFound'));
                return;
            }

            setView('reset_password');
            return;
        }

        if (view === 'recover_phone') {
            if (!formData.username || !formData.personalCode) {
                setError(t('fillAllFields'));
                return;
            }

            const user = users[formData.username];
            if (!user) {
                setError(t('userNotFound'));
                return;
            }

            const hashedCode = hashPassword(formData.personalCode);
            if (hashedCode !== user.personalCode) {
                setError(t('wrongPersonalCode'));
                return;
            }

            setView('reset_password');
            return;
        }

        if (view === 'recover_email') {
            if (!formData.username || !formData.email) {
                setError(t('fillAllFields'));
                return;
            }

            const user = users[formData.username];
            if (!user) {
                setError(t('userNotFound'));
                return;
            }

            if (user.email !== formData.email.toLowerCase()) {
                setError(t('wrongEmail'));
                return;
            }

            // Generate and send verification code
            setIsEmailSending(true);
            const code = generateVerificationCode();
            setSentVerificationCode(code);

            const emailResult = await sendVerificationEmail(formData.email, code);
            setIsEmailSending(false);

            if (emailResult.success) {
                setSuccess(`${t('codeSent')} ${formData.email}`);
                setTimer(360); // Start 6-minute timer
                setTimeout(() => {
                    setView('verify_email_code');
                    setSuccess('');
                }, 1500);
            } else {
                setError(isRTL ? `שליחת המייל נכשלה: ${emailResult.message}` : `Email sending failed: ${emailResult.message}`);
            }
            return;
        }

        if (view === 'verify_email_code') {
            if (formData.verificationCode === sentVerificationCode) {
                setView('reset_password');
            } else {
                setError(t('invalidVerificationCode'));
            }
            return;
        }

        if (!formData.username || !formData.securityQuestion || !formData.securityAnswer) {
            setError(t('fillAllFields'));
            return;
        }

        const user = users[formData.username];
        if (!user) {
            setError(t('userNotFound'));
            return;
        }

        if (formData.securityQuestion !== user.securityQuestion) {
            setError(t('wrongSecurityQuestion'));
            return;
        }

        const hashedAnswer = hashPassword(formData.securityAnswer.toLowerCase());
        if (hashedAnswer !== user.securityAnswer) {
            setError(t('wrongAnswer'));
            return;
        }

        setView('reset_password');
    };

    const handleRecoverUsername = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.email) {
            setError(t('fillAllFields'));
            return;
        }

        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');
        const userList = Object.values(users);
        const foundUser = userList.find(u => u.email === formData.email.toLowerCase());

        if (foundUser) {
            setOriginalUsername(foundUser.username);
            setIsUsernameFound(true);
            setSuccess('');
        } else {
            setError(t('wrongEmail'));
        }
    };

    const handleUpdateUsername = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.newUsername) {
            setError(t('fillAllFields'));
            return;
        }

        if (formData.newUsername.includes(' ')) {
            setError(t('noSpaces'));
            return;
        }

        if (!/^[a-zA-Z0-9]+$/.test(formData.newUsername)) {
            setError(t('usernameEnglishOnly'));
            return;
        }

        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');

        if (users[formData.newUsername] && formData.newUsername !== originalUsername) {
            setError(t('userExists'));
            return;
        }

        // Update the user key and data
        const userData = users[originalUsername];
        delete users[originalUsername];
        userData.username = formData.newUsername;
        users[formData.newUsername] = userData;

        localStorage.setItem('smartJournal_users', JSON.stringify(users));

        // Auto-fill for login
        setFormData(prev => ({ ...prev, username: formData.newUsername, email: '' }));
        setSuccess(t('usernameUpdated'));

        setTimeout(() => {
            setView('login');
            setIsUsernameFound(false);
            setSuccess('');
        }, 2000);
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.newPass) {
            setError(t('fillAllFields'));
            return;
        }

        if (formData.newPass.includes(' ')) {
            setError(t('noSpaces'));
            return;
        }

        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');
        users[formData.username].password = hashPassword(formData.newPass);
        localStorage.setItem('smartJournal_users', JSON.stringify(users));

        setSuccess(t('passwordReset'));
        setTimeout(() => {
            setView('login');
            setFormData({ username: '', password: '', securityQuestion: '', securityAnswer: '', newPass: '', phoneNumber: '', email: '', personalCode: '' });
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans" dir="ltr">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700 relative">
                {/* Language Dropdown - Top Right */}
                <div className="absolute top-4 right-4">
                    <button
                        type="button"
                        onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all text-sm font-bold flex items-center gap-1"
                    >
                        {lang === 'he' ? 'עברית' : 'English'}
                        <ChevronDown size={16} className={`transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {langDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 bg-slate-700 rounded-lg shadow-xl border border-slate-600 overflow-hidden z-50 min-w-[120px]">
                            <button
                                type="button"
                                onClick={() => {
                                    setLang('en');
                                    setLangDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-600 transition-colors ${lang === 'en' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300'}`}
                            >
                                English
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLang('he');
                                    setLangDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-600 transition-colors ${lang === 'he' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300'}`}
                            >
                                עברית
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-center mb-6">
                    <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                        <BarChart2 size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t('appTitle')}</h1>
                    <p className="text-emerald-500 font-bold mt-1 tracking-wide text-base">לימודי מסחר ושוק ההון</p>
                </div>

                {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm text-center" dir={isRTL ? 'rtl' : 'ltr'}>{error}</div>}
                {success && <div className="bg-green-500/20 text-green-200 p-3 rounded-lg mb-4 text-sm text-center" dir={isRTL ? 'rtl' : 'ltr'}>{success}</div>}

                {view === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-3">{t('loginTitle')}</h2>

                        {/* Journal Selection Toggle - iOS Style */}
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <span className={`text-xs font-bold transition-colors ${selectedJournal === 'stocks' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                <TrendingUp size={14} className="inline mr-1" />
                                {t('stocks')}
                            </span>
                            <div
                                className={`relative w-14 h-7 rounded-full transition-colors duration-300 cursor-pointer ${selectedJournal === 'futures' ? 'bg-blue-600' : 'bg-emerald-600'}`}
                                onClick={() => setSelectedJournal(selectedJournal === 'stocks' ? 'futures' : 'stocks')}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${selectedJournal === 'futures' ? 'translate-x-7' : 'translate-x-0'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setIsDragging(true);
                                        setDragStartX(e.clientX);
                                    }}
                                    onMouseMove={(e) => {
                                        if (isDragging) {
                                            const diff = e.clientX - dragStartX;
                                            if (diff > 15 && selectedJournal === 'stocks') {
                                                setSelectedJournal('futures');
                                                setIsDragging(false);
                                            } else if (diff < -15 && selectedJournal === 'futures') {
                                                setSelectedJournal('stocks');
                                                setIsDragging(false);
                                            }
                                        }
                                    }}
                                    onMouseUp={() => setIsDragging(false)}
                                    onMouseLeave={() => setIsDragging(false)}
                                    onTouchStart={(e) => {
                                        e.stopPropagation();
                                        setIsDragging(true);
                                        setDragStartX(e.touches[0].clientX);
                                    }}
                                    onTouchMove={(e) => {
                                        if (isDragging) {
                                            const diff = e.touches[0].clientX - dragStartX;
                                            if (diff > 15 && selectedJournal === 'stocks') {
                                                setSelectedJournal('futures');
                                                setIsDragging(false);
                                            } else if (diff < -15 && selectedJournal === 'futures') {
                                                setSelectedJournal('stocks');
                                                setIsDragging(false);
                                            }
                                        }
                                    }}
                                    onTouchEnd={() => setIsDragging(false)}
                                />
                            </div>
                            <span className={`text-xs font-bold transition-colors ${selectedJournal === 'futures' ? 'text-blue-400' : 'text-slate-500'}`}>
                                <Coins size={14} className="inline mr-1" />
                                {t('futures')}
                            </span>
                        </div>
                        <input
                            required
                            type="text"
                            placeholder={t('username')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                placeholder={t('password')}
                                className="w-full p-3 pr-10 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <label htmlFor="rememberMe" className="text-slate-300 text-sm cursor-pointer select-none">{t('rememberMe')}</label>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                        >
                            {t('loginBtn')}
                        </button>

                        <div className="flex flex-col gap-4 mt-6">
                            <div className={`flex justify-center items-center gap-4 text-xs text-slate-400`} dir={isRTL ? 'rtl' : 'ltr'}>
                                <button type="button" onClick={() => setView('recover')} className="hover:text-white transition-colors">{t('forgotPass')}</button>
                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                <button type="button" onClick={() => setView('recover_username')} className="hover:text-white transition-colors">{t('forgotUsername')}</button>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
                                <span className="text-slate-400 text-xs">{t('noAccount')} </span>
                                <button
                                    type="button"
                                    onClick={() => setView('register')}
                                    className="text-blue-400 hover:text-blue-300 font-bold text-xs mx-1"
                                >
                                    {t('signUp')}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {view === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('registerTitle')}</h2>
                        <input required type="text" placeholder={t('username')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                        <input required type="password" placeholder={t('password')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        <input required type="email" placeholder={t('email')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <input required type="text" placeholder={t('personalCodeLabel')} maxLength="4" pattern="\d{4}" className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.personalCode} onChange={e => setFormData({ ...formData, personalCode: e.target.value })} />
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg">{t('registerBtn')}</button>
                        <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); setFormData({ username: '', password: '', securityQuestion: '', securityAnswer: '', newPass: '', phoneNumber: '', email: '', personalCode: '', verificationCode: '' }); }} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'recover' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('chooseRecoveryMethod')}</h2>
                        <button onClick={() => setView('recover_phone')} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all">{t('recoverWithPhone')}</button>
                        <button onClick={() => setView('recover_admin')} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all">{t('recoverWithAdmin')}</button>
                        <button onClick={() => setView('recover_email')} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all">{t('recoverWithEmail')}</button>
                        <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); setFormData(prev => ({ ...prev, email: '' })); }} className="w-full text-slate-400 hover:text-white text-sm mt-4">{t('backToLogin')}</button>
                    </div>
                )}

                {view === 'recover_username' && (
                    <form onSubmit={isUsernameFound ? handleUpdateUsername : handleRecoverUsername} className="space-y-4">
                        {!isUsernameFound ? (
                            <>
                                <p className="text-slate-400 text-sm text-center mb-4">{t('enterEmailForUsername')}</p>
                                <input
                                    required
                                    type="email"
                                    placeholder={t('email')}
                                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg">{t('recoverBtn')}</button>
                            </>
                        ) : (
                            <>
                                <input
                                    required
                                    type="text"
                                    placeholder={t('enterNewUsername')}
                                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                                    value={formData.newUsername}
                                    onChange={e => setFormData({ ...formData, newUsername: e.target.value })}
                                />
                                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg">{t('updateAndLogin')}</button>
                            </>
                        )}
                        <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); setIsUsernameFound(false); setFormData(prev => ({ ...prev, email: '', newUsername: '' })); }} className="w-full text-slate-400 hover:text-white text-sm mt-4">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'recover_question' && (
                    <form onSubmit={handleRecover} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('recoverWithQuestion')}</h2>
                        <input required type="text" placeholder={t('username')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                        <select required className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none text-left" value={formData.securityQuestion} onChange={e => setFormData({ ...formData, securityQuestion: e.target.value })}>
                            <option value="">{t('securityQuestion')}</option>
                            <option value="q1">{t('securityQuestion1')}</option>
                            <option value="q2">{t('securityQuestion2')}</option>
                            <option value="q3">{t('securityQuestion3')}</option>
                        </select>
                        <input required type="text" placeholder={t('answerLabel')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.securityAnswer} onChange={e => setFormData({ ...formData, securityAnswer: e.target.value })} />
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg">{t('recoverBtn')}</button>
                        <button type="button" onClick={() => { setView('recover'); setError(''); setSuccess(''); }} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'recover_phone' && (
                    <form onSubmit={handleRecover} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('recoverWithPhone')}</h2>
                        <input required type="text" placeholder={t('username')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                        <input required type="text" placeholder={t('enterPersonalCode')} maxLength="4" pattern="\d{4}" className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.personalCode} onChange={e => setFormData({ ...formData, personalCode: e.target.value })} />
                        <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg">{t('recoverBtn')}</button>
                        <button type="button" onClick={() => { setView('recover'); setError(''); setSuccess(''); }} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'recover_admin' && (
                    <form onSubmit={handleRecover} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('recoverWithAdmin')}</h2>
                        <input required type="text" placeholder={t('phoneOrUsername')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                        <input required type="text" placeholder={t('enterAdminCode')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.personalCode} onChange={e => setFormData({ ...formData, personalCode: e.target.value })} />
                        <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg">{t('recoverBtn')}</button>
                        <button type="button" onClick={() => { setView('recover'); setError(''); setSuccess(''); }} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'recover_email' && (
                    <form onSubmit={handleRecover} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('recoverWithEmail')}</h2>
                        <input required type="text" placeholder={t('username')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                        <input required type="email" placeholder={t('enterEmail')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg">{t('recoverBtn')}</button>
                        <button type="button" onClick={() => { setView('recover'); setError(''); setSuccess(''); }} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'verify_email_code' && (
                    <form onSubmit={handleRecover} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('verifyCode')}</h2>
                        <p className="text-slate-400 text-center text-sm mb-4">
                            {t('enterCodeSent')}
                        </p>
                        <input
                            required
                            type="text"
                            placeholder={lang === 'he' ? 'הזן את הקוד אימות' : 'Enter verification code'}
                            maxLength="4"
                            className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg text-white text-center text-lg placeholder:text-base tracking-widest focus:border-blue-500 outline-none"
                            value={formData.verificationCode}
                            onChange={e => setFormData({ ...formData, verificationCode: e.target.value.replace(/\D/g, '') })}
                        />
                        {timer > 0 && (
                            <div className="text-center text-xs text-slate-500 mt-2">
                                {lang === 'he' ? `הקוד יפוג בעוד: ${formatTimer(timer)}` : `Code expires in: ${formatTimer(timer)}`}
                            </div>
                        )}
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg mt-4">
                            {t('verifyCode')}
                        </button>
                        <button type="button" onClick={() => { setView('recover_email'); setError(''); setSuccess(''); }} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'reset_password' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('resetPass')}</h2>
                        <input required type="password" placeholder={t('newPass')} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none" value={formData.newPass} onChange={e => setFormData({ ...formData, newPass: e.target.value })} />
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg">{t('resetPass')}</button>
                    </form>
                )}
            </div>
        </div>
    );
};

// Journal Selection Component
const JournalSelection = ({ username, onSelectJournal, onLogout, lang = 'he' }) => {
    const t = (key) => TRANSLATIONS[lang][key] || key;

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700">
                <div className="text-center mb-8">
                    <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <BarChart2 className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('appTitle')}</h1>
                    <p className="text-slate-400 mb-4">
                        {t('hello')}, {username}!
                    </p>
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-8">{t('selectJournal')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Futures Journal */}
                    <button
                        onClick={() => onSelectJournal('futures')}
                        className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white p-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                    >
                        <Coins size={48} className="mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">{t('futuresJournal')}</h3>
                        <p className="text-blue-100 text-sm">
                            {t('futuresTrading')}
                        </p>
                    </button>

                    {/* Stocks Journal */}
                    <button
                        onClick={() => onSelectJournal('stocks')}
                        className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white p-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
                    >
                        <TrendingUp size={48} className="mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">{t('stocksJournal')}</h3>
                        <p className="text-emerald-100 text-sm">
                            {t('stocksTrading')}
                        </p>
                    </button>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full mt-8 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
                >
                    {t('logout')}
                </button>
            </div>
        </div>
    );
};

// --- Splash Screen Component ---
const SplashScreen = () => {
    return (
        <div className="fixed inset-0 bg-[#0b1527] flex items-center justify-center z-[9999]">
            <div className="animate-pulse transition-all duration-1000">
                <img
                    src="./logo_new.png"
                    alt="יומן מסחר"
                    className="max-w-[80vw] max-h-[80vh] object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>
        </div>
    );
};

// Main App Component
export default function App() {
    const [showSplash, setShowSplash] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedJournal, setSelectedJournal] = useState(null);
    const [lang, setLang] = useState('he');

    useEffect(() => {
        const timer = setTimeout(() => {
            const splash = document.getElementById('initial-splash');
            if (splash) {
                splash.classList.add('fade-out');
                setTimeout(() => {
                    splash.remove();
                }, 500);
            }
        }, 4000); // 4 seconds delay
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = (username, journal, language) => {
        if (language) {
            setLang(language);
            return; // Just change language, don't login
        }
        setUser(username);
        setSelectedJournal(journal);
    };

    const handleLogout = () => {
        setUser(null);
        setSelectedJournal(null);
    };

    const handleSelectJournal = (journal) => {
        setSelectedJournal(journal);
    };

    const handleSwitchJournal = () => {
        setSelectedJournal(null);
    };

    // Show login screen
    if (!user) {
        return <CentralAuth onLogin={handleLogin} lang={lang} />;
    }

    // Show selected journal directly (no separate selection screen)
    if (selectedJournal === 'futures') {
        return <FuturesApp username={user} onLogout={handleLogout} onSwitchJournal={handleSwitchJournal} />;
    }

    if (selectedJournal === 'stocks') {
        return <StocksApp username={user} onLogout={handleLogout} onSwitchJournal={handleSwitchJournal} />;
    }

    return null;
}
