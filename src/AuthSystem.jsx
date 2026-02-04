import React, { useState, useEffect } from 'react';
import { BarChart2, Mail, Loader } from 'lucide-react';
import { sendVerificationEmail, generateVerificationCode } from './emailConfig';

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
        password: "Password (Optional)",
        email: "Email",
        loginBtn: "Enter Journal",
        registerBtn: "Register",
        recoverBtn: "Recover Account",
        backToLogin: "Back to Login",
        enterCode: "Enter Verification Code",
        verifyBtn: "Verify & Proceed",
        newPass: "New Password",
        resetPass: "Reset Password",
        recoverySent: "Verification code sent to your email",
        sendingEmail: "Sending email...",
        rememberMe: "Remember Me",
        cancel: "Cancel",
        emailSent: "Email sent successfully!",
        emailFailed: "Failed to send email. Please try again.",
        invalidCode: "Invalid verification code",
        passwordReset: "Password reset successfully! Please login."
    },
    he: {
        appTitle: "S Trader",
        subtitle: "לימודי מסחר ושוק ההון",
        loginTitle: "התחברות ל-S Trader",
        registerTitle: "יצירת חשבון",
        forgotPass: "שכחתי סיסמא?",
        username: "שם משתמש",
        password: "סיסמא (אופציונלי)",
        email: "מייל",
        loginBtn: "כנס ליומן",
        registerBtn: "הרשמה",
        recoverBtn: "שחזר חשבון",
        backToLogin: "חזרה להתחברות",
        enterCode: "הזן קוד אימות",
        verifyBtn: "אמת והמשך",
        newPass: "סיסמא חדשה",
        resetPass: "אפס סיסמא",
        recoverySent: "קוד אימות נשלח למייל שלך",
        sendingEmail: "שולח מייל...",
        rememberMe: "זכור אותי",
        cancel: "ביטול",
        emailSent: "המייל נשלח בהצלחה!",
        emailFailed: "שליחת המייל נכשלה. נסה שוב.",
        invalidCode: "קוד אימות שגוי",
        passwordReset: "הסיסמה אופסה בהצלחה! אנא התחבר."
    }
};

// Simple password hashing (for demo - in production use bcrypt)
const hashPassword = (password) => {
    if (!password) return '';
    return btoa(password); // Base64 encoding (NOT secure for production!)
};

// --- Main Component ---

const AuthSystem = ({ onLogin, t, isRTL }) => {
    const [view, setView] = useState('login');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        code: '',
        newPass: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [generatedCode, setGeneratedCode] = useState('');

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
            setError(isRTL ? 'משתמש לא קיים. אנא הירשם תחילה.' : 'User does not exist. Please register first.');
            return;
        }

        // Password is required
        if (!formData.password) {
            setError(isRTL ? 'נא להזין סיסמה' : 'Please enter password');
            return;
        }

        // Check password
        const user = users[formData.username];
        const hashedInput = hashPassword(formData.password);
        if (hashedInput !== user.password) {
            setError(isRTL ? 'סיסמה שגויה' : 'Incorrect password');
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

    const initiateRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');
        if (users[formData.username]) {
            setError('Username already exists');
            return;
        }

        // Validate email
        if (!formData.email || !formData.email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        setLoading(true);
        const code = generateVerificationCode();
        setGeneratedCode(code);

        // Send email
        const result = await sendVerificationEmail(formData.email, code);

        setLoading(false);

        if (result.success) {
            setSuccess(t('emailSent'));
            setPendingAction('register');
            setView('verify');
        } else {
            setError(t('emailFailed'));
        }
    };

    const initiateRecover = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate email
        if (!formData.email || !formData.email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');
        const userEntry = Object.values(users).find(u => u.email === formData.email);

        if (!userEntry) {
            setError('Email not found');
            return;
        }

        setLoading(true);
        const code = generateVerificationCode();
        setGeneratedCode(code);

        // Send email
        const result = await sendVerificationEmail(formData.email, code);

        setLoading(false);

        if (result.success) {
            setSuccess(t('emailSent'));
            setPendingAction('recover');
            setView('verify');
        } else {
            setError(t('emailFailed'));
        }
    };

    const handleVerifyCode = (e) => {
        e.preventDefault();
        setError('');

        if (formData.code === generatedCode) {
            if (pendingAction === 'register') {
                const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');
                users[formData.username] = {
                    username: formData.username,
                    password: hashPassword(formData.password),
                    email: formData.email,
                    trades: [],
                    settings: INITIAL_SETTINGS
                };
                localStorage.setItem('smartJournal_users', JSON.stringify(users));
                onLogin(formData.username);
            } else if (pendingAction === 'recover') {
                setView('reset_password');
            }
        } else {
            setError(t('invalidCode'));
        }
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        setError('');

        const users = JSON.parse(localStorage.getItem('smartJournal_users') || '{}');
        const userEntry = Object.values(users).find(u => u.email === formData.email);

        if (userEntry) {
            userEntry.password = hashPassword(formData.newPass);
            localStorage.setItem('smartJournal_users', JSON.stringify(users));
            setSuccess(t('passwordReset'));
            setTimeout(() => setView('login'), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
                <div className="text-center mb-8">
                    <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                        <BarChart2 size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t('appTitle')}</h1>
                    <p className="text-emerald-500 font-bold mt-1 tracking-wide text-sm">לימודי מסחר ושוק ההון</p>

                    {/* Hidden Reset Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete ALL users and data?')) {
                                localStorage.removeItem('smartJournal_users');
                                localStorage.removeItem('smartJournal_creds');
                                window.location.reload();
                            }
                        }}
                        className="mt-2 text-xs text-slate-600 hover:text-red-500 transition-colors"
                    >
                        Reset All Data
                    </button>
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
                        <input
                            type="password"
                            placeholder={t('password')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
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
                    <form onSubmit={initiateRegister} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('registerTitle')}</h2>
                        <input
                            required
                            type="text"
                            placeholder={t('username')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                        <div className="relative">
                            <Mail className={`absolute top-3.5 ${isRTL ? 'right-3' : 'left-3'} text-slate-500`} size={18} />
                            <input
                                required
                                type="email"
                                placeholder={t('email')}
                                className={`w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none ${isRTL ? 'pr-10' : 'pl-10'}`}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <input
                            required
                            type="password"
                            placeholder={t('password')}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    {t('sendingEmail')}
                                </>
                            ) : t('registerBtn')}
                        </button>
                        <button type="button" onClick={() => setView('login')} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'recover' && (
                    <form onSubmit={initiateRecover} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('recoverBtn')}</h2>
                        <p className="text-slate-400 text-xs text-center mb-4">Enter your email to receive a verification code.</p>
                        <div className="relative">
                            <Mail className={`absolute top-3.5 ${isRTL ? 'right-3' : 'left-3'} text-slate-500`} size={18} />
                            <input
                                required
                                type="email"
                                placeholder={t('email')}
                                className={`w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none ${isRTL ? 'pr-10' : 'pl-10'}`}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    {t('sendingEmail')}
                                </>
                            ) : t('recoverBtn')}
                        </button>
                        <button type="button" onClick={() => setView('login')} className="w-full text-slate-400 hover:text-white text-sm">{t('backToLogin')}</button>
                    </form>
                )}

                {view === 'verify' && (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center mb-4">{t('enterCode')}</h2>
                        <p className="text-slate-400 text-xs text-center mb-4">{t('recoverySent')}</p>
                        <input
                            required
                            type="text"
                            placeholder="1234"
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none text-center tracking-widest text-xl"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            maxLength={4}
                        />
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                        >
                            {t('verifyBtn')}
                        </button>
                        <button type="button" onClick={() => setView('login')} className="w-full text-slate-400 hover:text-white text-sm">{t('cancel')}</button>
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
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthSystem;
