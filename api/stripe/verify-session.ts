// @ts-ignore
import { supabase } from '../../lib/supabase';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Get Stripe instance
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('Stripe session:', session);

    // Update user in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_id: session.subscription,
        subscription_status: session.status === 'complete' ? 'active' : 'trial',
        stripe_customer_id: session.customer,
      })
      .eq('id', session.metadata.userId);

    if (updateError) {
      console.error('Error updating user subscription:', updateError);
      return res.status(500).json({ error: 'Failed to update subscription' });
    }

    return res.status(200).json({
      success: true,
      subscription: session.subscription,
    });
  } catch (error: any) {
    console.error('Error verifying session:', error);
    return res.status(500).json({ error: error.message });
  }
}