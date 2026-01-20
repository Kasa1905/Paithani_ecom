/**
 * OTP SERVICE - Email and Phone OTP generation and verification
 * 
 * Supports:
 * - Email OTP (Nodemailer SMTP)
 * - Phone OTP (stub - to be implemented with SMS provider)
 */
import { createTransport } from 'nodemailer';
import bcrypt from 'bcryptjs';

/**
 * Generate a 6-digit OTP
 * @returns 6-digit OTP string
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calculate OTP expiration time (10 minutes from now)
 * @returns Date object representing expiration time
 */
export function getOTPExpirationTime(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10); // OTP valid for 10 minutes
  return now;
}

/**
 * Check if OTP has expired
 * @param expiresAt - OTP expiration timestamp
 * @returns true if OTP has expired
 */
export function isOTPExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
}

/**
 * Verify OTP - check if provided OTP matches and is not expired
 * @param providedOTP - OTP entered by user
 * @param storedOTP - OTP stored in database
 * @param expiresAt - OTP expiration time
 * @returns Object with valid flag and optional error message
 */
export function verifyOTP(providedOTP: string, storedOTP: string, expiresAt: Date | null | undefined): { valid: boolean; error?: string } {
  if (!storedOTP) {
    return { valid: false, error: 'OTP not found. Please request a new OTP.' };
  }

  if (isOTPExpired(expiresAt)) {
    return { valid: false, error: 'OTP has expired. Please request a new OTP.' };
  }

  // If stored OTP looks like a bcrypt hash, compare using bcrypt
  const isBcryptHash = typeof storedOTP === 'string' && storedOTP.startsWith('$2');
  if (isBcryptHash) {
    const match = bcrypt.compareSync(providedOTP.trim(), storedOTP);
    return match ? { valid: true } : { valid: false, error: 'Incorrect OTP. Please try again.' };
  }

  // Fallback: plain text comparison (backward compatibility)
  if (providedOTP.trim() !== storedOTP.trim()) {
    return { valid: false, error: 'Incorrect OTP. Please try again.' };
  }
  return { valid: true };
}

/**
 * Hash an OTP using bcrypt
 */
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/**
 * Send OTP via Email
 * 
 * STUBBED - Implement with email service (Nodemailer, SendGrid, etc.)
 * 
 * @param email - User's email address
 * @param otp - 6-digit OTP to send
 * @returns Promise that resolves to success status
 */
export async function sendEmailOTP(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const from = process.env.EMAIL_FROM;

    if (!host || !port || !user || !pass || !from) {
      console.error('[OTP-EMAIL ERROR] Missing SMTP environment variables');
      return { success: false, error: 'Email service not configured' };
    }

    const transporter = createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Verify your email - Paithani Ecommerce',
      text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
      html: `<p>Your OTP is: <strong>${otp}</strong></p><p>It is valid for 10 minutes.</p>`,
    });

    return { success: true };
  } catch (error) {
    console.error('[OTP-EMAIL ERROR]', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send OTP email' 
    };
  }
}

/**
 * Send OTP via SMS (Phone)
 * 
 * STUBBED - To be implemented with SMS provider (Twilio, AWS SNS, etc.)
 * 
 * @param phoneNumber - User's phone number
 * @param otp - 6-digit OTP to send
 * @returns Promise that resolves to success status
 */
export async function sendPhoneOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement with SMS service provider
    console.log(`[OTP-PHONE] STUB - Would send OTP ${otp} to ${phoneNumber}`);

    // In production, implement with Twilio or similar:
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: `Your OTP is: ${otp}. Valid for 10 minutes.`,
    //   from: '+1234567890',
    //   to: phoneNumber
    // });

    return { 
      success: false, 
      error: 'Phone OTP not yet configured. Please use email verification.' 
    };
  } catch (error) {
    console.error('[OTP-PHONE ERROR]', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send OTP via phone' 
    };
  }
}
