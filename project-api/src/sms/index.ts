import { SmsAdapter, SmsProvider, SmsError } from "./types";
import { LocalSmsAdapter } from "./adapters/local";
import { ClickSendSmsAdapter } from "./adapters/clicksend";
import { PlivoSmsAdapter } from "./adapters/plivo";
import { TwilioSmsAdapter } from "./adapters/twilio";

export function createSmsAdapter(): SmsAdapter {
  const provider = (
    process.env.SMS_PROVIDER || "local"
  ).toLowerCase() as SmsProvider;

  switch (provider) {
    case SmsProvider.LOCAL:
      return new LocalSmsAdapter();
    case SmsProvider.CLICKSEND:
      return new ClickSendSmsAdapter();
    case SmsProvider.PLIVO:
      return new PlivoSmsAdapter();
    case SmsProvider.TWILIO:
      return new TwilioSmsAdapter();
    default:
      throw new SmsError(
        `Unknown SMS provider: ${provider}. Valid options are: local, clicksend, plivo, twilio`,
        "unknown",
      );
  }
}

export * from "./types";
