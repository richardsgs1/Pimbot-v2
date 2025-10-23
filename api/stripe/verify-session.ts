import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
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

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('Stripe session retrieved:', session.id);
    console.log('Customer:', session.customer);
    console.log('Subscription:', session.subscription);
    console.log('Metadata:', session.metadata);

    const userId = session.metadata.userId;

    // Update USERS table (not user_subscriptions)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_id: session.subscription,
        subscription_status: 'trialing',
        stripe_customer_id: session.customer,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({ error: 'Failed to update user', details: updateError });
    }

    console.log('User subscription updated successfully');

    return res.status(200).json({
      success: true,
      subscription: session.subscription,
    });
  } catch (error: any) {
    console.error('Error verifying session:', error);
    return res.status(500).json({ error: error.message });
  }
}