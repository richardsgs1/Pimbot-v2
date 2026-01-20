import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Use SERVICE ROLE key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ← Changed this
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

    

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    
    

    const userId = session.metadata.userId;
    

    // Update USERS table
    const { data, error: updateError } = await supabase
      .from('users')
      .update({
        subscription_id: session.subscription,
        subscription_status: 'trialing',
        stripe_customer_id: session.customer,
      })
      .eq('id', userId)
      .select();

    if (updateError) {
      
      return res.status(500).json({ error: 'Failed to update user', details: updateError });
    }

    

    return res.status(200).json({
      success: true,
      subscription: session.subscription,
    });
  } catch (error: any) {
    
    return res.status(500).json({ error: error.message });
  }
}