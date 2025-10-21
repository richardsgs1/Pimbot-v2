import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const STRIPE_PRICES = {
  starter: {
    monthly: 'price_1SJz3j4sXU2AWctaPfrlI6Dr',
    yearly: 'price_1SJz584sXU2AWctazOczYezC',
  },
  pro: {
    monthly: 'price_1SJz6D4sXU2AWctamRKkSsDC',
    yearly: 'price_1SJz6j4sXU2AWctau4RJeSq2',
  },
  team: {
    monthly: 'price_1SJz7a4sXU2AWctaHNfu9kvZ',
    yearly: 'price_1SJz884sXU2AWctaf2SvY557',
  },
};

// ⚠️ IMPORTANT: Named export for Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return handleCheckout(req, res);
}

async function handleCheckout(req: VercelRequest, res: VercelResponse) {
  try {
    const { plan, billingPeriod, userId, userEmail } = req.body;

    if (!plan || !billingPeriod || !userId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['starter', 'pro', 'team'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return res.status(400).json({ error: 'Invalid billing period' });
    }

    const priceId = STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES][billingPeriod as 'monthly' | 'yearly'];

    const appUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId, plan, billingPeriod },
      },
      metadata: { userId, plan, billingPeriod },
      success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create checkout session' 
    });
  }
}