import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SubscriptionSuccessProps {
  sessionId: string;
  onContinue: () => void;
}

const SubscriptionSuccess: React.FC<SubscriptionSuccessProps> = ({ sessionId, onContinue }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndContinue = async () => {
      try {
        if (!sessionId) {
          setError('No session ID found');
          setLoading(false);
          return;
        }

        console.log('Verifying subscription with session:', sessionId);

        // Verify the subscription
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to verify subscription');
        }

        const data = await response.json();
        console.log('Subscription verified:', data);

        // Check if we still have a Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('Session found! Going to dashboard...');
          setLoading(false);
          // Wait a moment to show success, then continue
          setTimeout(() => {
            onContinue();
          }, 2000);
        } else {
          console.log('No session found, user needs to log in');
          setError('Please log in to access your dashboard');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error verifying subscription:', err);
        setError('Failed to verify subscription. Please contact support.');
        setLoading(false);
      }
    };

    verifyAndContinue();
  }, [sessionId, onContinue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Processing your subscription...</h2>
          <p className="text-gray-300">Please wait while we set up your account.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 max-w-md w-full text-center">
          <div className="bg-red-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Session Expired</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Log In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 max-w-md w-full text-center">
        <div className="bg-green-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to PiMbOt AI! 🎉</h2>
        <p className="text-gray-300 mb-6">
          Your subscription is now active. Taking you to your dashboard...
        </p>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
