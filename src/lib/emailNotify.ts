const EMAILJS_PUBLIC_KEY = 'hwf8F1DzCXwIPTXcw';
const EMAILJS_SERVICE_ID = 'service_bweqzbo';
const EMAILJS_TEMPLATE_ID = 'template_r4mqxk9';

export async function notifySignup(userEmail: string) {
  try {
    await fetch('https://api.emailjs.com/api/v1.6/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          user_email: userEmail,
          signup_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          message: `New JEEMirror signup: ${userEmail}`,
        },
      }),
    });
    console.log('Signup notification sent');
  } catch (err) {
    console.error('Failed to send signup notification:', err);
  }
}
