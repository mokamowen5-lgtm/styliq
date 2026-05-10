import { Injectable, BadRequestException, Logger, NotFoundException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import Stripe from "stripe"
import { PrismaService } from "../common/prisma.service"

@Injectable()
export class SubscriptionsService {
  private _stripe: Stripe | null = null
  private readonly logger = new Logger(SubscriptionsService.name)

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  /**
   * Lazy Stripe init — only fails when an actual Stripe-using endpoint is called,
   * so the app can boot in dev without STRIPE_SECRET_KEY configured.
   */
  private get stripe(): Stripe {
    if (!this._stripe) {
      const key = this.config.get<string>("stripe.secretKey")
      if (!key) {
        throw new BadRequestException(
          "Stripe is not configured. Set STRIPE_SECRET_KEY in your .env to enable subscriptions."
        )
      }
      this._stripe = new Stripe(key, {
        apiVersion: "2024-10-28.acacia" as Stripe.LatestApiVersion,
      })
    }
    return this._stripe
  }

  async getMine(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } })
    if (!sub) throw new NotFoundException("Subscription not found")
    return sub
  }

  /**
   * Create a Stripe Checkout session for upgrading to Premium or VIP.
   */
  async createCheckoutSession(userId: string, tier: "PREMIUM" | "VIP") {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })
    if (!user) throw new NotFoundException("User not found")

    const priceId =
      tier === "PREMIUM"
        ? this.config.get<string>("stripe.premiumPriceId")
        : this.config.get<string>("stripe.vipPriceId")

    if (!priceId) throw new BadRequestException(`Stripe price ID for ${tier} not configured`)

    let customerId = user.subscription?.stripeCustomerId

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.displayName,
        metadata: { userId: user.id },
      })
      customerId = customer.id

      await this.prisma.subscription.update({
        where: { userId },
        data: { stripeCustomerId: customerId },
      })
    }

    const frontendUrl = this.config.get<string>("app.frontendUrl")

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/settings/billing?success=true`,
      cancel_url: `${frontendUrl}/settings/billing?canceled=true`,
      subscription_data: { trial_period_days: 7, metadata: { userId, tier } },
      allow_promotion_codes: true,
      metadata: { userId, tier },
    })

    return { sessionId: session.id, url: session.url }
  }

  /**
   * Create a Stripe billing portal session (for users to manage their subscription).
   */
  async createPortalSession(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } })
    if (!sub?.stripeCustomerId) throw new BadRequestException("No active customer")

    const frontendUrl = this.config.get<string>("app.frontendUrl")
    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${frontendUrl}/settings/billing`,
    })

    return { url: session.url }
  }

  /**
   * Process Stripe webhook events. Verifies the signature and dispatches.
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>("stripe.webhookSecret", "")

    let event: Stripe.Event
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err) {
      this.logger.error(`Stripe webhook signature mismatch: ${(err as Error).message}`)
      throw new BadRequestException("Invalid signature")
    }

    this.logger.log(`Processing Stripe event: ${event.type}`)

    switch (event.type) {
      case "checkout.session.completed":
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await this.onSubscriptionChanged(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.deleted":
        await this.onSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break
      case "invoice.payment_succeeded":
        await this.onInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case "invoice.payment_failed":
        await this.onInvoiceFailed(event.data.object as Stripe.Invoice)
        break
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`)
    }

    return { received: true }
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId
    if (!userId) return

    if (session.subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string)
      await this.onSubscriptionChanged(subscription)
    }
  }

  private async onSubscriptionChanged(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId
    const tier = (subscription.metadata?.tier as "PREMIUM" | "VIP") ?? "PREMIUM"

    if (!userId) {
      this.logger.warn("Subscription change without userId metadata")
      return
    }

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        tier,
        status: this.mapStripeStatus(subscription.status),
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
      },
    })
  }

  private async onSubscriptionCanceled(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId
    if (!userId) return

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        tier: "FREE",
        status: "CANCELED",
        canceledAt: new Date(),
      },
    })
  }

  private async onInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string | null
    if (!subscriptionId) return

    const sub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    })
    if (!sub) return

    await this.prisma.payment.create({
      data: {
        subscriptionId: sub.id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent as string | null,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: "succeeded",
      },
    })
  }

  private async onInvoiceFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string | null
    if (!subscriptionId) return

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: "PAST_DUE" },
    })
  }

  private mapStripeStatus(status: Stripe.Subscription.Status) {
    const map: Record<string, "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "INCOMPLETE" | "PAUSED"> = {
      active: "ACTIVE",
      canceled: "CANCELED",
      past_due: "PAST_DUE",
      trialing: "TRIALING",
      incomplete: "INCOMPLETE",
      incomplete_expired: "CANCELED",
      paused: "PAUSED",
      unpaid: "PAST_DUE",
    }
    return map[status] ?? "INCOMPLETE"
  }
}
