// EmailJS Configuration
export const EMAILJS_CONFIG = {
    serviceId: 'service_rv8lvqd',
    templateId: 'template_9p792mz',
    publicKey: 'yfk17t7I6U4elJk6X'
};

// Email sending function
import emailjs from '@emailjs/browser';

    export const sendVerificationEmail = async (email, code, username = 'S Trader User') => {
    try {
        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            {
                "to_email": email,
                "to email": email,
                "verification_code": code,
                "code": code,
                "user_name": username,
                "username": username
            },
            EMAILJS_CONFIG.publicKey
        );

        console.log('Email sent successfully:', response);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Email sending failed:', error);
        return {
            success: false,
            message: error?.text || error?.message || 'Send failed'
        };
    }
};

// Generate random 4-digit code
export const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
