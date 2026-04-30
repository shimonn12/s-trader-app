import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'
import AuthSystem from './AuthSystem.jsx'

// Test wrapper with language support
function AuthTest() {
    const [lang, setLang] = React.useState('he');
    const isRTL = lang === 'he';

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

    const t = (key) => TRANSLATIONS[lang][key] || key;

    const handleLogin = (username) => {
        alert(`✅ Login successful for: ${username}`);
    };

    return (
        <>
            {/* Language Toggle */}
            <div className="fixed top-4 left-4 z-50 flex gap-2">
                <button
                    onClick={() => setLang('he')}
                    className={`px-3 py-1 rounded text-xs font-bold ${lang === 'he' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                    עברית
                </button>
                <button
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 rounded text-xs font-bold ${lang === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                    English
                </button>
            </div>

            <AuthSystem onLogin={handleLogin} t={t} isRTL={isRTL} />
        </>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthTest />
    </StrictMode>,
)
