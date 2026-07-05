export enum EmailProvider {
  LOCAL = "local",
  SENDGRID = "sendgrid",
  MAILGUN = "mailgun",
  RESEND = "resend",
}

export interface EmailAdapter {
  sendOtp(
    email: string,
    code: string,
  ): Promise<{ code?: string; identifier: string }>;
  sendEmail(to: string, subject: string, html: string): Promise<void>;
  check(): Promise<boolean>;
}

export class EmailError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "EmailError";
  }
}
