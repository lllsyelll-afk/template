import { ChargilyClient, verifySignature } from "@chargily/chargily-pay";
import type { Checkout } from "@chargily/chargily-pay";
import type {
  CheckoutRequest,
  CheckoutResponse,
  PayAdapter,
  SubscriptionCheckoutRequest,
  WebhookEvent,
} from "../types";

export class ChargilyPayAdapter implements PayAdapter {
  private client: ChargilyClient;
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.CHARGILY_SECRET_KEY || "";
    const mode = process.env.ENV === "production" ? "live" : "test";

    console.log(
      `[ChargilyPayAdapter] Mode: ${mode}, Key present: ${!!this.secretKey}, Key length: ${this.secretKey.length}, Key prefix: ${this.secretKey.slice(0, 7)}...`,
    );

    this.client = new ChargilyClient({
      api_key: this.secretKey,
      mode,
    });
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    const checkout = await this.client.createCheckout({
      amount: request.amount,
      currency: request.currency,
      payment_method: request.paymentMethod,
      success_url: request.successUrl,
      failure_url: request.failUrl,
      webhook_endpoint: request.webhookUrl,
      metadata: request.metadata,
    });

    return this.mapToCheckoutResponse(checkout);
  }

  async createSubscriptionCheckout(
    request: SubscriptionCheckoutRequest,
  ): Promise<CheckoutResponse> {
    const redirectUrl =
      process.env.CHARGILY_REDIRECT_URL
    const webhookUrl =
      process.env.CHARGILY_WEBHOOK_URL
    const checkoutPayload = {
      amount: request.amount,
      currency: "dzd",
      payment_method: "edahabia" as const,
      success_url: redirectUrl,
      failure_url: redirectUrl,
      webhook_endpoint: webhookUrl,
      metadata: {
        placeId: request.placeId,
        userId: request.userId,
        planId: request.planId,
        billingCycle: request.billingCycle,
        type: request.checkoutType || "subscription",
        ...(request.oldPlanId && { oldPlanId: request.oldPlanId }),
      },
    };

    console.log(
      "[ChargilyPayAdapter] Creating checkout with payload:",
      JSON.stringify(checkoutPayload, null, 2),
    );

    const checkout = await this.client.createCheckout(checkoutPayload);

    return this.mapToCheckoutResponse(checkout);
  }

  async getCheckoutStatus(
    checkoutId: string,
  ): Promise<CheckoutResponse | null> {
    try {
      const checkout = await this.client.getCheckout(checkoutId);
      return this.mapToCheckoutResponse(checkout);
    } catch (error: any) {
      if (
        error?.status === 404 ||
        error?.response?.status === 404 ||
        error?.message?.includes("404")
      ) {
        return null;
      }
      throw error;
    }
  }

  async expireCheckout(checkoutId: string): Promise<boolean> {
    try {
      await this.client.expireCheckout(checkoutId);
      return true;
    } catch (error) {
      console.error("[ChargilyPayAdapter] Error expiring checkout:", error);
      return false;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.secretKey) {
      console.warn(
        "[ChargilyPayAdapter] No secret key configured for webhook verification",
      );
      return false;
    }
    return verifySignature(
      Buffer.from(payload, "utf8"),
      signature,
      this.secretKey,
    );
  }

  parseWebhookEvent(payload: Record<string, unknown>): WebhookEvent | null {
    try {
      const event = payload.type as string;
      const data = payload.data as Record<string, unknown>;
      if (!event || !data) {
        return null;
      }

      const mappedEvent = this.mapWebhookEvent(event);
      if (!mappedEvent) {
        return null;
      }

      const checkout = data as unknown as Checkout;
      return {
        event: mappedEvent,
        data: this.mapToCheckoutResponse(checkout),
      };
    } catch (error) {
      console.error(
        "[ChargilyPayAdapter] Error parsing webhook event:",
        error,
      );
      return null;
    }
  }

  async check(): Promise<boolean> {
    try {
      if (!this.secretKey) {
        console.error("[ChargilyPayAdapter] Missing CHARGILY_SECRET_KEY");
        return false;
      }

      await this.client.listCheckouts(1);
      console.log("[ChargilyPayAdapter] Chargily Pay adapter ready");
      return true;
    } catch (error) {
      console.error("[ChargilyPayAdapter] Health check failed:", error);
      return false;
    }
  }

  private mapToCheckoutResponse(checkout: Checkout): CheckoutResponse {
    return {
      id: checkout.id,
      amount: checkout.amount,
      currency: checkout.currency,
      status: checkout.status,
      paymentMethod: checkout.payment_method || "",
      checkoutUrl: checkout.checkout_url,
      expiresAt:
        (checkout as any).expires_at ?? checkout.created_at + 3600,
      metadata: checkout.metadata,
      createdAt: checkout.created_at,
      updatedAt: checkout.updated_at,
    };
  }

  private mapWebhookEvent(event: string): string | null {
    const eventMap: Record<string, string> = {
      "checkout.paid": "checkout.completed",
      "checkout.failed": "checkout.failed",
      "checkout.expired": "checkout.expired",
      "checkout.canceled": "checkout.expired",
    };
    return eventMap[event] || null;
  }
}
