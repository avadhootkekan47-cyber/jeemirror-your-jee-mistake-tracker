// EmailJS configuration for signup notifications
// To set up:
// 1. Create a free account at https://www.emailjs.com
// 2. Add an email service (e.g., Gmail) and get your Service ID
// 3. Create a template with variables: {{user_email}}, {{signup_time}}, {{to_email}}
// 4. Replace the values below with your actual IDs

const EMAILJS_PUBLIC_KEY = 'hwf8F1DzCXwIPTXcw';
const EMAILJS_SERVICE_ID = 'service_bweqzbo';
const EMAILJS_TEMPLATE_ID = 'template_r4mqxk9';
const ADMIN_EMAIL = 'cellux.official@gmail.com';

export async function notifySignup(userEmail: string) {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    console.warn('EmailJS not configured — skipping signup notification');
    return;
  }

  try {
    await fetch('https://api.emailjs.com/api/v1.6/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: ADMIN_EMAIL,
          user_email: userEmail,
          signup_time: new Date().toLocaleString(),
          message: `New JEEMirror signup: ${userEmail} at ${new Date().toLocaleString()}`,
        },
      }),
    });
    console.log('Signup notification sent');
  } catch (err) {
    console.error('Failed to send signup notification:', err);
  }
}
