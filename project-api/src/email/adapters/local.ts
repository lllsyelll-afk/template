import { EmailAdapter } from "../types";

export class LocalEmailAdapter implements EmailAdapter {
  async sendOtp(
    email: string,
    code: string,
  ): Promise<{ code: string; identifier: string }> {
    console.log(`[LocalEmailAdapter] Sending OTP to ${email}: ${code}`);
    // In local/dev mode, return the code so it can be displayed in the UI
    return { code, identifier: email };
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    console.log(`[LocalEmailAdapter] Sending email to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
  }

  async check(): Promise<boolean> {
    // Local email adapter is always "available" in development mode
    // but not suitable for production
    if (process.env.ENV === "production") {
      console.error('[email] Local email adapter not available in production');
      return false;
    }
    
    console.log('[email] Local email adapter ready (development mode)');
    return true;
  }
}
