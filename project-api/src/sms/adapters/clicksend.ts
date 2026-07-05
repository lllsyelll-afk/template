import { SmsAdapter, SmsError } from "../types";

interface ClickSendResponse {
  data?: {
    messages?: Array<{
      status: string;
    }>;
  };
  response?: {
    status?: {
      description?: string;
    };
  };
}

export class ClickSendSmsAdapter implements SmsAdapter {
  private username: string;
  private apiKey: string;
  private senderId: string;

  constructor() {
    this.username = process.env.CLICKSEND_USERNAME || "";
    this.apiKey = process.env.CLICKSEND_API_KEY || "";
    this.senderId = process.env.CLICKSEND_SENDER_ID || "";

    if (!this.username || !this.apiKey) {
      throw new SmsError(
        "ClickSend credentials not configured. Set CLICKSEND_USERNAME and CLICKSEND_API_KEY environment variables.",
        "clicksend"
      );
    }
  }

  async sendOtp(phone: string, code: string): Promise<{ code?: string; identifier: string }> {
    const message = `Your verification code is: ${code}`;
    await this.sendSms(phone, message);
    return { identifier: phone };
  }

  async sendSms(phone: string, message: string): Promise<void> {
    const auth = Buffer.from(`${this.username}:${this.apiKey}`).toString("base64");

    try {
      const response = await fetch("https://rest.clicksend.com/v3/sms/send", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              source: this.senderId || "sdk",
              body: message,
              to: phone,
            },
          ],
        }),
      });

      const data: ClickSendResponse = await response.json();

      if (!response.ok || data.data?.messages?.[0]?.status !== "SUCCESS") {
        throw new SmsError(
          `ClickSend API error: ${data.response?.status?.description || "Unknown error"}`,
          "clicksend",
          data
        );
      }
    } catch (error) {
      if (error instanceof SmsError) throw error;
      throw new SmsError(
        `Failed to send SMS via ClickSend: ${error instanceof Error ? error.message : "Unknown error"}`,
        "clicksend",
        error
      );
    }
  }

  async check(): Promise<boolean> {
    try {
      const auth = Buffer.from(`${this.username}:${this.apiKey}`).toString("base64");
      
      // Try to get account balance to verify credentials
      const response = await fetch("https://rest.clicksend.com/v3/account/balance", {
        method: "GET",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log('[sms] ClickSend connection verified');
        return true;
      } else {
        console.error('[sms] ClickSend authentication failed');
        return false;
      }
    } catch (error) {
      console.error('[sms] ClickSend connection check failed:', error);
      return false;
    }
  }
}
