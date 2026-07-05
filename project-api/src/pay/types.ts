export enum PayProvider {
  CHARGILY = "chargily",
  STRIPE = "stripe",
}

export interface CheckoutRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  successUrl: string;
  failUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface CheckoutResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  checkoutUrl: string;
  expiresAt: number;
  metadata?: Record<string, string | number | boolean>;
  createdAt: number;
  updatedAt: number;
}

export interface SubscriptionCheckoutRequest {
  amount: number;
  placeId: string;
  userId: string;
  planId: string;
  billingCycle: "monthly" | "yearly";
  checkoutType?: "subscription" | "plan_change";
  oldPlanId?: string;
}

export interface WebhookEvent {
  event: string;
  data: CheckoutResponse;
}

export interface PayAdapter {
  createCheckout(request: CheckoutRequest): Promise<CheckoutResponse>;
  createSubscriptionCheckout(
    request: SubscriptionCheckoutRequest,
  ): Promise<CheckoutResponse>;
  getCheckoutStatus(checkoutId: string): Promise<CheckoutResponse | null>;
  expireCheckout(checkoutId: string): Promise<boolean>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  parseWebhookEvent(payload: Record<string, unknown>): WebhookEvent | null;
  check(): Promise<boolean>;
}

export class PayError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "PayError";
  }
}
