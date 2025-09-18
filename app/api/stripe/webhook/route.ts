import { type NextRequest, NextResponse } from "next/server"
import { stripe, getPlanByPriceId, type Subscription } from "@/lib/stripe"
import { createTenantRedis, TENANT_KEYS } from "@/lib/tenant-redis"
import type Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("Checkout session completed:", session.id)

  const tenantId = session.metadata?.tenantId
  if (!tenantId) {
    console.error("No tenantId in session metadata")
    return
  }

  // The subscription will be handled by the subscription.created event
  // Here we can update tenant status or send welcome emails
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Subscription created:", subscription.id)

  const tenantId = subscription.metadata?.tenantId
  const plan = subscription.metadata?.plan

  if (!tenantId || !plan) {
    console.error("Missing metadata in subscription:", { tenantId, plan })
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const planType = getPlanByPriceId(priceId)

  if (!planType) {
    console.error("Unknown price ID:", priceId)
    return
  }

  const subscriptionData: Subscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    tenantId,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    plan: planType,
    status: subscription.status as any,
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Save subscription to tenant's Redis
  const tenantRedis = createTenantRedis(tenantId)
  await tenantRedis.set(TENANT_KEYS.SUBSCRIPTION, subscriptionData)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id)

  const tenantId = subscription.metadata?.tenantId
  if (!tenantId) {
    console.error("No tenantId in subscription metadata")
    return
  }

  const tenantRedis = createTenantRedis(tenantId)
  const existingSubscription = await tenantRedis.get<Subscription>(TENANT_KEYS.SUBSCRIPTION)

  if (!existingSubscription) {
    console.error("No existing subscription found for tenant:", tenantId)
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const planType = getPlanByPriceId(priceId)

  const updatedSubscription: Subscription = {
    ...existingSubscription,
    stripePriceId: priceId,
    plan: planType || existingSubscription.plan,
    status: subscription.status as any,
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  }

  await tenantRedis.set(TENANT_KEYS.SUBSCRIPTION, updatedSubscription)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Subscription deleted:", subscription.id)

  const tenantId = subscription.metadata?.tenantId
  if (!tenantId) {
    console.error("No tenantId in subscription metadata")
    return
  }

  const tenantRedis = createTenantRedis(tenantId)
  const existingSubscription = await tenantRedis.get<Subscription>(TENANT_KEYS.SUBSCRIPTION)

  if (existingSubscription) {
    const updatedSubscription: Subscription = {
      ...existingSubscription,
      status: "canceled",
      updatedAt: new Date().toISOString(),
    }

    await tenantRedis.set(TENANT_KEYS.SUBSCRIPTION, updatedSubscription)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Invoice payment succeeded:", invoice.id)
  // Handle successful payment - could send receipt emails, update usage, etc.
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Invoice payment failed:", invoice.id)
  // Handle failed payment - could send dunning emails, suspend account, etc.
}
