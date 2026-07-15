// src/lib/emailService.ts
// ─── Real Email OTP via EmailJS (free, no backend required) ───
import emailjs from '@emailjs/browser';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string;

/** Sends a 6-digit OTP to the student's email via EmailJS */
export async function sendOtpEmail(
  toEmail: string,
  toName: string,
  otpCode: string,
  purpose: 'registration' | 'login' = 'login'
): Promise<void> {
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email:  toEmail,
      to_name:   toName,
      otp_code:  otpCode,
      purpose:   purpose === 'registration' ? 'Account Registration' : 'Login Verification',
      app_name:  'EduNetwork',
    },
    PUBLIC_KEY
  );
}
