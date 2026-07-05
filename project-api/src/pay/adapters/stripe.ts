import crypto from "crypto";
import type {
  CheckoutRequest,
  CheckoutResponse,
  PayAdapter,
  SubscriptionCheckoutRequest,
  WebhookEvent,
} from "../types";

export class StripePayAdapter implements PayAdapter {
  private apiKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.STRIPE_SECRET_KEY || "";
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    this.baseUrl = "https://api.stripe.com/v1";
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    const params = new URLSearchParams({
      "line_items[0][price_data][currency]": request.currency.toLowerCase(),
      "line_items[0][price_data][product_data][name]": "Payment",
      "line_items[0][price_data][unit_amount]": String(
        Math.round(request.amount * 100),
      ),
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: request.successUrl,
      cancel_url: request.failUrl || request.successUrl,
    });

    if (request.metadata) {
      Object.entries(request.metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, String(value));
      });
    }

    const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return this.mapStripeSessionToCheckoutResponse(data as Record<string, unknown>);
  }

  async createSubscriptionCheckout(
    request: SubscriptionCheckoutRequest,
  ): Promise<CheckoutResponse> {
    const redirectUrl = process.env.STRIPE_REDIRECT_URL

    if (!redirectUrl) {
      throw new Error("STRIPE_REDIRECT_URL is not defined in environment variables");
    }


    const checkoutRequest: CheckoutRequest = {
      amount: request.amount,
      currency: "usd",
      paymentMethod: "card",
      successUrl: redirectUrl,
      failUrl: redirectUrl,
      metadata: {
        placeId: request.placeId,
        userId: request.userId,
        planId: request.planId,
        billingCycle: request.billingCycle,
        type: request.checkoutType || "subscription",
        ...(request.oldPlanId && { oldPlanId: request.oldPlanId }),
      },
    };

    return this.createCheckout(checkoutRequest);
  }

  async getCheckoutStatus(
    checkoutId: string,
  ): Promise<CheckoutResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/checkout/sessions/${checkoutId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(
          `Stripe API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return this.mapStripeSessionToCheckoutResponse(data as Record<string, unknown>);
    } catch (error) {
      console.error("[StripePayAdapter] Error getting checkout status:", error);
      throw error;
    }
  }

  async expireCheckout(checkoutId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/checkout/sessions/${checkoutId}/expire`,
        {
          method: "POST",
          headers: this.getHeaders(),
        },
      );
      return response.ok;
    } catch (error) {
      console.error("[StripePayAdapter] Error expiring checkout:", error);
      return false;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      if (!this.webhookSecret) {
        console.warn(
          "[StripePayAdapter] No webhook secret configured for signature verification",
        );
        return false;
      }

      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(payload)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex"),
      );
    } catch (error) {
      console.error(
        "[StripePayAdapter] Error verifying webhook signature:",
        error,
      );
      return false;
    }
  }

  parseWebhookEvent(payload: Record<string, unknown>): WebhookEvent | null {
    try {
      const eventType = payload.type as string;
      const data = payload.data as { object: Record<string, unknown> };

      if (!eventType || !data?.object) {
        return null;
      }

      const session = data.object;
      let mappedEvent: string;

      switch (eventType) {
        case "checkout.session.completed":
          mappedEvent = "checkout.completed";
          break;
        case "checkout.session.expired":
          mappedEvent = "checkout.expired";
          break;
        case "checkout.session.async_payment_failed":
          mappedEvent = "checkout.failed";
          break;
        default:
          return null;
      }

      return {
        event: mappedEvent,
        data: this.mapStripeSessionToCheckoutResponse(session),
      };
    } catch (error) {
      console.error(
        "[StripePayAdapter] Error parsing webhook event:",
        error,
      );
      return null;
    }
  }

  async check(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error(
          "[StripePayAdapter] Missing STRIPE_SECRET_KEY environment variable",
        );
        return false;
      }

      const response = await fetch(`${this.baseUrl}/account`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error("[StripePayAdapter] Failed to connect to Stripe API");
        return false;
      }

      console.log("[StripePayAdapter] Stripe Pay adapter ready");
      return true;
    } catch (error) {
      console.error("[StripePayAdapter] Health check failed:", error);
      return false;
    }
  }

  private mapStripeSessionToCheckoutResponse(
    session: Record<string, unknown>,
  ): CheckoutResponse {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at
      ? Number(session.expires_at)
      : now + 3600;

    return {
      id: String(session.id),
      amount: ((session.amount_total as number) || 0) / 100,
      currency: String(session.currency || "usd").toUpperCase(),
      status: this.mapStripeStatus(String(session.status)),
      paymentMethod: String(
        (session.payment_method_types as string[])?.[0] || "card",
      ),
      checkoutUrl: String(session.url || ""),
      expiresAt,
      metadata: (session.metadata as Record<string, string>) || {},
      createdAt: Number(session.created || now),
      updatedAt: Number(session.created || now),
    };
  }

  private mapStripeStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      open: "pending",
      complete: "completed",
      expired: "expired",
    };
    return statusMap[stripeStatus] || stripeStatus;
  }
}
