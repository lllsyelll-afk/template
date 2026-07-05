import { SmsAdapter, SmsError } from "../types";
import { Twilio } from "twilio";

export class TwilioSmsAdapter implements SmsAdapter {
  private client: Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || "";

    if (!accountSid || !authToken) {
      throw new SmsError(
        "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.",
        "twilio"
      );
    }

    this.client = new Twilio(accountSid, authToken);
  }

  async sendOtp(phone: string, code: string): Promise<{ code?: string; identifier: string }> {
    const message = `Your verification code is: ${code}`;
    await this.sendSms(phone, message);
    return { identifier: phone };
  }

  async sendSms(phone: string, message: string): Promise<void> {
    try {
      // Ensure phone number is in E.164 format
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedPhone,
      });

      // Check if the message was sent successfully
      if (result.status !== "queued" && result.status !== "sent") {
        throw new SmsError(
          `Twilio message failed with status: ${result.status}`,
          "twilio",
          result
        );
      }
    } catch (error) {
      if (error instanceof SmsError) throw error;
      
      // Handle Twilio-specific errors
      if (error instanceof Error && error.message.includes("21612")) {
        throw new SmsError(
          "Twilio 'From' number is not a valid SMS-enabled Twilio phone number",
          "twilio",
          error
        );
      }
      
      if (error instanceof Error && error.message.includes("21614")) {
        throw new SmsError(
          "To number is not a valid mobile number",
          "twilio",
          error
        );
      }
      
      throw new SmsError(
        `Failed to send SMS via Twilio: ${error instanceof Error ? error.message : "Unknown error"}`,
        "twilio",
        error
      );
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "");
    
    // If the number doesn't start with a country code, assume it's a US number
    if (!cleaned.startsWith("1") && cleaned.length === 10) {
      cleaned = "1" + cleaned;
    }
    
    // Ensure it starts with +
    if (!cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }
    
    return cleaned;
  }

  async check(): Promise<boolean> {
    try {
      // Try to get account information to verify credentials
      const account = await this.client.api.accounts(this.client.accountSid).fetch();
      
      if (account && account.status === "active") {
        console.log('[sms] Twilio connection verified');
        return true;
      } else {
        console.error('[sms] Twilio account not active');
        return false;
      }
    } catch (error) {
      console.error('[sms] Twilio connection check failed:', error);
      return false;
    }
  }
}
