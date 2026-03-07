const EMAILJS_PUBLIC_KEY = 'hwf8F1DzCXwIPTXcw';
const EMAILJS_SERVICE_ID = 'service_bweqzbo';
const EMAILJS_TEMPLATE_ID = 'template_r4mqxk9';

declare global {
  interface Window {
    emailjs: {
      init: (publicKey: string) => void;
      send: (serviceId: string, templateId: string, templateParams: Record<string, string>) => Promise<{ status: number; text: string }>;
    };
  }
}

let initialized = false;

export async function notifySignup(userEmail: string, userName?: string, planType?: string, paymentId?: string) {
  try {
    if (!window.emailjs) {
      console.warn('EmailJS SDK not loaded');
      return;
    }
    if (!initialized) {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
      initialized = true;
    }
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      user_email: userEmail,
      user_name: userName || 'Unknown',
      plan_type: planType || 'trial',
      payment_id: paymentId || 'N/A',
      signup_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      message: `New JEEMirror signup: ${userName || userEmail} (${userEmail}) — Plan: ${planType || 'trial'}${paymentId ? ` — Payment: ${paymentId}` : ''}`,
    });
    console.log('Signup notification sent');
  } catch (err) {
    console.error('Failed to send signup notification:', err);
  }
}
