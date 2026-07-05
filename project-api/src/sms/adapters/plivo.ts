import { SmsAdapter, SmsError } from "../types";

interface PlivoResponse {
  error?: string;
  message?: string;
  api_id?: string;
  message_uuid?: string[];
}

export class PlivoSmsAdapter implements SmsAdapter {
  private authId: string;
  private authToken: string;
  private senderNumber: string;

  constructor() {
    this.authId = process.env.PLIVO_AUTH_ID || "";
    this.authToken = process.env.PLIVO_AUTH_TOKEN || "";
    this.senderNumber = process.env.PLIVO_SENDER_NUMBER || "";

    if (!this.authId || !this.authToken) {
      throw new SmsError(
        "Plivo credentials not configured. Set PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN environment variables.",
        "plivo"
      );
    }
  }

  async sendOtp(phone: string, code: string): Promise<{ code?: string; identifier: string }> {
    const message = `Your verification code is: ${code}`;
    await this.sendSms(phone, message);
    return { identifier: phone };
  }

  async sendSms(phone: string, message: string): Promise<void> {
    const auth = Buffer.from(`${this.authId}:${this.authToken}`).toString("base64");

    try {
      const params = new URLSearchParams({
        src: this.senderNumber,
        dst: phone,
        text: message,
      });

      const response = await fetch(
        `https://api.plivo.com/v1/Account/${this.authId}/Message/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      const data: PlivoResponse = await response.json();

      if (!response.ok || data.error) {
        throw new SmsError(
          `Plivo API error: ${data.error || "Unknown error"}`,
          "plivo",
          data
        );
      }
    } catch (error) {
      if (error instanceof SmsError) throw error;
      throw new SmsError(
        `Failed to send SMS via Plivo: ${error instanceof Error ? error.message : "Unknown error"}`,
        "plivo",
        error
      );
    }
  }

  async check(): Promise<boolean> {
    try {
      const auth = Buffer.from(`${this.authId}:${this.authToken}`).toString("base64");
      
      // Try to get account details to verify credentials
      const response = await fetch(
        `https://api.plivo.com/v1/Account/${this.authId}/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        console.log('[sms] Plivo connection verified');
        return true;
      } else {
        console.error('[sms] Plivo authentication failed');
        return false;
      }
    } catch (error) {
      console.error('[sms] Plivo connection check failed:', error);
      return false;
    }
  }
}
