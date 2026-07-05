import { PayAdapter, PayError, PayProvider } from "./types";
import { ChargilyPayAdapter } from "./adapters/chargily";
import { StripePayAdapter } from "./adapters/stripe";

export function createPayAdapter(): PayAdapter {
  const provider = (
    process.env.PAY_PROVIDER || "chargily"
  ).toLowerCase() as PayProvider;

  switch (provider) {
    case PayProvider.CHARGILY:
      return new ChargilyPayAdapter();
    case PayProvider.STRIPE:
      return new StripePayAdapter();
    default:
      throw new PayError(
        `Unknown payment provider: ${provider}. Valid options are: chargily, stripe`,
        "unknown",
      );
  }
}

export * from "./types";
