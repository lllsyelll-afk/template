import { EmailAdapter, EmailProvider, EmailError } from "./types";
import { LocalEmailAdapter } from "./adapters/local";

export function createEmailAdapter(): EmailAdapter {
  const provider = (
    process.env.EMAIL_PROVIDER || "local"
  ).toLowerCase() as EmailProvider;

  switch (provider) {
    case EmailProvider.LOCAL:
      return new LocalEmailAdapter();
    default:
      throw new EmailError(
        `Unknown email provider: ${provider}. Valid options are: local`,
        "unknown",
      );
  }
}

export * from "./types";
