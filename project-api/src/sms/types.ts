export enum SmsProvider {
  LOCAL = "local",
  CLICKSEND = "clicksend",
  PLIVO = "plivo",
  TWILIO = "twilio",
}

export interface SmsAdapter {
  sendOtp(
    phone: string,
    code: string,
  ): Promise<{ code?: string; identifier: string }>;
  sendSms(phone: string, message: string): Promise<void>;
  check(): Promise<boolean>;
}

export class SmsError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "SmsError";
  }
}
