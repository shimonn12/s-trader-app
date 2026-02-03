import React, { useState, useEffect } from 'react';
import { BarChart2, Eye, EyeOff } from 'lucide-react';

// --- Constants & Translations ---

const INITIAL_SETTINGS = {
    currency: '$',
    theme: 'dark',
    fontSize: 14
};

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
        recoverWithPhone: "Recover with Phone + Personal Code",
        recoverWithAdmin: "Recover with Admin Code",
        recoverWithEmail: "Recover with Email",
        securityQuestion1: "What was your first teacher's name?",
        securityQuestion2: "In which city were you born?",
        securityQuestion3: "What was the name of your first pet?",
        answerLabel: "Answer",
        personalCodeLabel: "Personal Code (4 digits)",
        mobilePhoneNumber: "Mobile Phone Number",
        email: "Email Address",
        enterPhone: "Enter phone number",
        enterEmail: "Enter email address",
        enterPersonalCode: "Enter personal code",
        enterAdminCode: "Enter admin code",
        phoneOrUsername: "Phone or Username",
        noSpaces: "Username and password cannot contain spaces"
    },
    he: {
        appTitle: "S Trader",
        subtitle: "לימודי מסחר ושוק ההון",
        loginTitle: "התחברות ל-S Trader",
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
        userNotFound: "משתמש לא קיים. אנא הירשם תחילה.",
        wrongPassword: "סיסמה שגויה",
        wrongAnswer: "תשובה שגויה לשאלת האבטחה",
        fillAllFields: "נא למלא את כל השדות",
        passwordReset: "הסיסמה אופסה בהצלחה! אנא התחבר.",
        chooseRecoveryMethod: "בחר שיטת שחזור",
        recoverWithQuestion: "שחזור באמצעות שאלת אבטחה",
        recoverWithPhone: "שחזור באמצעות טלפון + קוד אישי",
        recoverWithAdmin: "שחזור באמצעות קוד מנהל",
        recoverWithEmail: "שחזור באמצעות מייל",
        securityQuestion1: "מה שם המורה הראשון שלך?",
        securityQuestion2: "באיזו עיר נולדת?",
        securityQuestion3: "מה שם חיית המחמד הראשונה שלך?",
        answerLabel: "תשובה",
        personalCodeLabel: "קוד אישי (4 ספרות)",
        mobilePhoneNumber: "מספר טלפון נייד",
        email: "כתובת מייל",
        enterPhone: "הזן מספר טלפון",
        enterEmail: "הזן כתובת מייל",
        enterPersonalCode: "הזן קוד אישי",
        enterAdminCode: "הזן קוד מנהל",
        phoneOrUsername: "טלפון או שם משתמש",
        noSpaces: "שם המשתמש והסיסמה לא יכולים להכיל רווחים"
    }
};

// Simple password hashing (for demo - in production use bcrypt)
const hashPassword = (password) => {
    if (!password) return '';
    return btoa(password); // Base64 encoding (NOT secure for production!)
};

// --- Main Component ---

const SimpleAuthSystem = ({ onLogin, t: externalT, lang, isRTL }) => {
    // Use internal translations if lang is provided, otherwise use external t
    const t = lang ? (key) => TRANSLATIONS[lang]?.[key] || key : externalT;

    const [view, setView] = useState('login');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        securityQuestion: '',
        securityAnswer: '',
        newPass: '',
        phoneNumber: '',
        email: '',
        personalCode: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [recoveryMethod, setRecoveryMethod] = useState(''); // 'question', 'phone', 'admin'
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const savedCreds = localStorage.getItem('smartJournal_creds');
        if (savedCreds) {
            const { username, password } = JSON.parse(savedCreds);
            setFormData(prev => ({ ...prev, username, password }));
            setRememberMe(true);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');

        // Check if user exists
        if (!users[formData.username]) {
            setError(t('userNotFound'));
            return;
        }

        // Password is required
        if (!formData.password) {
            setError(t('fillAllFields'));
            return;
        }

        if (formData.username.includes(' ') || formData.password.includes(' ')) {
            setError(t('noSpaces'));
            return;
        }

        // Check password
        const user = users[formData.username];
        const hashedInput = hashPassword(formData.password);
        if (hashedInput !== user.password) {
            setError(t('wrongPassword'));
            return;
        }

        if (rememberMe) {
            localStorage.setItem('smartJournal_creds', JSON.stringify({
                username: formData.username,
                password: formData.password
            }));
        } else {
            localStorage.removeItem('smartJournal_creds');
        }
        onLogin(formData.username);
    };

    const handleRegister = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.username || !formData.password || !formData.securityQuestion || !formData.securityAnswer || !formData.phoneNumber || !formData.email || !formData.personalCode) {
            setError(t('fillAllFields'));
            return;
        }

        if (formData.username.includes(' ') || formData.password.includes(' ')) {
            setError(t('noSpaces'));
            return;
        }

        // Validate personal code is 4 digits
        if (!/^\d{4}$/.test(formData.personalCode)) {
            setError(isRTL ? 'הקוד האישי חייב להיות 4 ספרות' : 'Personal code must be 4 digits');
            return;
        }

        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');
        if (users[formData.username]) {
            setError(t('userExists'));
            return;
        }

        users[formData.username] = {
            username: formData.username,
            password: hashPassword(formData.password),
            securityQuestion: formData.securityQuestion,
            securityAnswer: hashPassword(formData.securityAnswer.toLowerCase()),
            phoneNumber: formData.phoneNumber,
            email: formData.email.toLowerCase(),
            personalCode: hashPassword(formData.personalCode),
            trades: [],
            settings: INITIAL_SETTINGS
        };
        localStorage.setItem('smartJournal_users', JSON.stringify(users));
        onLogin(formData.username);
    };

    const handleRecover = (e) => {
        e.preventDefault();
        setError('');

        const ADMIN_CODE = '2468'; // Admin master code
        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');

        if (view === 'recover_admin') {
            // Admin recovery: username/phone + admin code
            if (!formData.username || !formData.personalCode) {
                setError(t('fillAllFields'));
                return;
            }

            // Check admin code
            if (formData.personalCode !== ADMIN_CODE) {
                setError(isRTL ? 'קוד מנהל שגוי' : 'Invalid admin code');
                return;
            }

            // Find user by username or phone
            let foundUser = users[formData.username];
            if (!foundUser) {
                // Try to find by phone
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
            // Phone + personal code recovery
            if (!formData.username || !formData.phoneNumber || !formData.personalCode) {
                setError(t('fillAllFields'));
                return;
            }

            const user = users[formData.username];
            if (!user) {
                setError(t('userNotFound'));
                return;
            }

            if (user.phoneNumber !== formData.phoneNumber) {
                setError(isRTL ? 'מספר טלפון שגוי' : 'Wrong phone number');
                return;
            }

            const hashedCode = hashPassword(formData.personalCode);
            if (hashedCode !== user.personalCode) {
                setError(isRTL ? 'קוד אישי שגוי' : 'Wrong personal code');
                return;
            }

            setView('reset_password');
            return;
        }

        if (view === 'recover_email') {
            // Email recovery
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
                setError(isRTL ? 'כתובת מייל שגויה' : 'Wrong email address');
                return;
            }

            setView('reset_password');
            return;
        }

        // Security question recovery (recover_question view)
        if (!formData.username || !formData.securityQuestion || !formData.securityAnswer) {
            setError(t('fillAllFields'));
            return;
        }

        const user = users[formData.username];
        if (!user) {
            setError(t('userNotFound'));
            return;
        }

        // Check if selected question matches stored question
        if (formData.securityQuestion !== user.securityQuestion) {
            setError(isRTL ? 'שאלת אבטחה שגויה' : 'Wrong security question');
            return;
        }

        const hashedAnswer = hashPassword(formData.securityAnswer.toLowerCase());
        if (hashedAnswer !== user.securityAnswer) {
            setError(t('wrongAnswer'));
            return;
        }

        setView('reset_password');
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
            setFormData({ username: '', password: '', securityQuestion: '', securityAnswer: '', newPass: '' });
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
                <div className="text-center mb-8">
                    <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                        <BarChart2 size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t('appTitle')}</h1>
                    <p className="text-emerald-500 font-bold mt-1 tracking-wide text-base">לימודי מסחר ושוק ההון</p>
                </div>

                {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
                {success && <div className="bg-green-500/20 text-green-200 p-3 rounded-lg mb-4 text-sm text-center">{success}</div>}

                {view === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('loginTitle')}</h2>
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
                                className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
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
                        <div className="flex justify-between text-sm mt-4">
                            <button type="button" onClick={() => setView('recover')} className="text-slate-400 hover:text-white">{t('forgotPass')}</button>
                            <button type="button" onClick={() => setView('register')} className="text-blue-400 hover:text-blue-300 font-bold">{t('registerBtn')}</button>
                        </div>
                    </form>
                )}

                {view === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('registerTitle')}</h2>
                        <input
                            required
                            type="text"
                            placeholder={t('username')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                        <input
                            required
                            type="password"
                            placeholder={t('password')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />

                        <select
                            required
                            value={formData.securityQuestion}
                            onChange={e => setFormData({ ...formData, securityQuestion: e.target.value })}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                            <option value="">{t('questionPlaceholder')}</option>
                            <option value="teacher">{t('securityQuestion1')}</option>
                            <option value="city">{t('securityQuestion2')}</option>
                            <option value="pet">{t('securityQuestion3')}</option>
                        </select>

                        <input
                            required
                            type="text"
                            placeholder={t('securityAnswer')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.securityAnswer}
                            onChange={e => setFormData({ ...formData, securityAnswer: e.target.value })}
                        />

                        <input
                            required
                            type="tel"
                            placeholder={t('mobilePhoneNumber')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.phoneNumber}
                            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                        />

                        <input
                            required
                            type="email"
                            placeholder={t('email')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />

                        <input
                            required
                            type="text"
                            placeholder={t('personalCodeLabel')}
                            maxLength="4"
                            pattern="\d{4}"
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.personalCode}
                            onChange={e => setFormData({ ...formData, personalCode: e.target.value.replace(/\D/g, '') })}
                        />
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                        >
                            {t('registerBtn')}
                        </button>
                        <button type="button" onClick={() => setView('login')} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'recover' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-6">{t('recoverBtn')}</h2>

                        {/* Recovery Method Selection */}
                        <select
                            value={recoveryMethod}
                            onChange={(e) => {
                                setRecoveryMethod(e.target.value);
                                if (e.target.value === 'question') setView('recover_question');
                                else if (e.target.value === 'phone') setView('recover_phone');
                                else if (e.target.value === 'admin') setView('recover_admin');
                                else if (e.target.value === 'email') setView('recover_email');
                            }}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                            <option value="">{t('chooseRecoveryMethod')}</option>
                            <option value="question">{t('recoverWithQuestion')}</option>
                            <option value="phone">{t('recoverWithPhone')}</option>
                            <option value="admin">{t('recoverWithAdmin')}</option>
                            <option value="email">{t('recoverWithEmail')}</option>
                        </select>

                        <button type="button" onClick={() => setView('login')} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </div>
                )}

                {view === 'recover_question' && (
                    <form onSubmit={handleRecover} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('recoverWithQuestion')}</h2>

                        <input
                            required
                            type="text"
                            placeholder={t('username')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />

                        <select
                            required
                            value={formData.securityQuestion}
                            onChange={e => setFormData({ ...formData, securityQuestion: e.target.value })}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                            <option value="">{t('questionPlaceholder')}</option>
                            <option value="teacher">{t('securityQuestion1')}</option>
                            <option value="city">{t('securityQuestion2')}</option>
                            <option value="pet">{t('securityQuestion3')}</option>
                        </select>

                        <input
                            required
                            type="text"
                            placeholder={t('answerLabel')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.securityAnswer}
                            onChange={e => setFormData({ ...formData, securityAnswer: e.target.value })}
                        />

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                        >
                            {t('recoverBtn')}
                        </button>
                        <button type="button" onClick={() => setView('recover')} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'recover_phone' && (
                    <form onSubmit={handleRecover} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('recoverWithPhone')}</h2>

                        <input
                            required
                            type="text"
                            placeholder={t('username')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />

                        <input
                            required
                            type="tel"
                            placeholder={t('enterPhone')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.phoneNumber}
                            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                        />

                        <input
                            required
                            type="text"
                            placeholder={t('enterPersonalCode')}
                            maxLength="4"
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.personalCode}
                            onChange={e => setFormData({ ...formData, personalCode: e.target.value.replace(/\D/g, '') })}
                        />

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                        >
                            {t('recoverBtn')}
                        </button>
                        <button type="button" onClick={() => setView('recover')} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'recover_admin' && (
                    <form onSubmit={handleRecover} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('recoverWithAdmin')}</h2>

                        <input
                            required
                            type="text"
                            placeholder={t('phoneOrUsername')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />

                        <input
                            required
                            type="text"
                            placeholder={t('enterAdminCode')}
                            maxLength="4"
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.personalCode}
                            onChange={e => setFormData({ ...formData, personalCode: e.target.value.replace(/\D/g, '') })}
                        />

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                        >
                            {t('recoverBtn')}
                        </button>
                        <button type="button" onClick={() => setView('recover')} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'recover_email' && (
                    <form onSubmit={handleRecover} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('recoverWithEmail')}</h2>

                        <input
                            required
                            type="text"
                            placeholder={t('username')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />

                        <input
                            required
                            type="email"
                            placeholder={t('enterEmail')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                        >
                            {t('recoverBtn')}
                        </button>
                        <button type="button" onClick={() => setView('recover')} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'reset_password' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('newPass')}</h2>
                        <input
                            required
                            type="password"
                            placeholder={t('newPass')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.newPass}
                            onChange={e => setFormData({ ...formData, newPass: e.target.value })}
                        />
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                        >
                            {t('resetPass')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setView('login');
                                setError('');
                                setSuccess('');
                            }}
                            className="w-full text-slate-400 hover:text-white text-sm mt-2"
                        >
                            {t('backToLogin')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SimpleAuthSystem;
