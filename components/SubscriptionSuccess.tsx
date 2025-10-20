import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface Props {
  onContinue: () => void;
}

export default function SubscriptionSuccess({ onContinue }: Props) {
  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      onContinue();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-12 text-center">
        <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
        
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to PiMbOt AI! 🎉
        </h1>
        
        <p className="text-xl text-gray-300 mb-8">
          Your subscription is now active and your 14-day free trial has started.
        </p>

        <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">What's Next?</h2>
          <ul className="text-left text-gray-300 space-y-2">
            <li>✓ Full access to all features in your plan</li>
            <li>✓ 14 days to explore everything risk-free</li>
            <li>✓ No charges until your trial ends</li>
            <li>✓ Cancel anytime from your account settings</li>
          </ul>
        </div>

        <button
          onClick={onContinue}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Go to Dashboard
        </button>

        <p className="text-gray-400 text-sm mt-4">Redirecting automatically in 3 seconds...</p>
      </div>
    </div>
  );
}