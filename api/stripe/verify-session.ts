import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    console.log('Retrieving Stripe session:', sessionId);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('Stripe session retrieved:', session.id);
    console.log('Customer ID:', session.customer);
    console.log('Subscription ID:', session.subscription);
    console.log('Metadata:', session.metadata);

    const userId = session.metadata.userId;
    console.log('Updating subscription for user:', userId);

    // Update user_subscriptions table
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        status: 'trialing', // Since trial_period_days: 14
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user subscription:', updateError);
      return res.status(500).json({ error: 'Failed to update subscription', details: updateError });
    }

    console.log('Subscription updated successfully for user:', userId);

    return res.status(200).json({
      success: true,
      subscription: session.subscription,
    });
  } catch (error: any) {
    console.error('Error verifying session:', error);
    return res.status(500).json({ error: error.message });
  }
}