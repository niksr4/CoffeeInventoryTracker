import { type NextRequest, NextResponse } from "next/server"
import { stripe, SUBSCRIPTION_PLANS, type PlanType } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan, tenantId, customerEmail, successUrl, cancelUrl } = body

    if (!plan || !tenantId || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields: plan, tenantId, customerEmail" }, { status: 400 })
    }

    if (!(plan in SUBSCRIPTION_PLANS)) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan as PlanType]

    // Create or retrieve customer
    let customer
    try {
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            tenantId,
          },
        })
      }
    } catch (error) {
      console.error("Error creating/retrieving customer:", error)
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        tenantId,
        plan,
      },
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          tenantId,
          plan,
        },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
