import { SmsAdapter, SmsError } from "../types";

export class LocalSmsAdapter implements SmsAdapter {
  async sendOtp(phone: string, code: string): Promise<{ code?: string; identifier: string }> {
    if (process.env.ENV === "production") {
      throw new SmsError(
        "SMS not configured. Local adapter cannot be used in production.",
        "local"
      );
    }

    // In development, return the code so frontend can display it
    return { code, identifier: phone };
  }

  async sendSms(phone: string, message: string): Promise<void> {
    if (process.env.ENV === "production") {
      throw new SmsError(
        "SMS not configured. Local adapter cannot be used in production.",
        "local"
      );
    }

    // In development, just log the message
    console.log(`[Local SMS] To: ${phone}, Message: ${message}`);
  }

  async check(): Promise<boolean> {
    // Local SMS adapter is always "available" in development mode
    // but not suitable for production
    if (process.env.ENV === "production") {
      console.error('[sms] Local SMS adapter not available in production');
      return false;
    }
    
    console.log('[sms] Local SMS adapter ready (development mode)');
    return true;
  }
}
