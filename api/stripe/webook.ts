import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Type extensions for Stripe (proper way to handle missing types)
declare module 'stripe' {
  namespace Stripe {
    interface Subscription {
      current_period_end: number;
      cancel_at_period_end: boolean;
    }
    interface Invoice {
      subscription: string | Stripe.Subscription | null;
    }
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('Received event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Handle successful checkout
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const customerId = session.customer as string;

  if (!userId) {
    console.error('No user ID in checkout session');
    return;
  }

  // Update user with Stripe customer ID
  const { error } = await supabase
    .from('users')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user with customer ID:', error);
  }
}

// Handle subscription creation/update
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const metadata = subscription.metadata;

  // Get user by Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Determine tier from metadata or price ID
  const tier = metadata.plan || 'pro';
  const billingPeriod = metadata.billingPeriod || 'monthly';

  // Upsert subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      status: status,
      tier: tier,
      billing_period: billingPeriod,
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'user_id'
    });

  if (subError) {
    console.error('Error upserting subscription:', subError);
  } else {
    console.log(`Subscription ${status} for user ${user.id}`);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Get user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  // Update subscription status
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating canceled subscription:', error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;

  console.log(`Payment succeeded for customer ${customerId}, subscription ${subscriptionId}`);
  
  // You could log this in a payments table if needed
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  console.log(`Payment failed for customer ${customerId}`);
  
  // You could send an email notification here
  // or update subscription status to 'past_due'
}