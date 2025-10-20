import React, { useState } from 'react';
console.log('🚀 PRICINGPAGE.TSX VERSION 2.0 LOADED');
import { Check, Zap } from 'lucide-react';
import { PRICING, TIER_LIMITS } from '../lib/pricing';
import { createClient } from '@supabase/supabase-js';
import type { OnboardingData } from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface PricingPageProps {
  userData: OnboardingData;
}

export default function PricingPage({ userData }: PricingPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    try {
      setLoadingPlan(planId);

      // Check if user has ID
      if (!userData.id || !userData.email) {
        alert('Please complete your profile first');
        return;
      }

      // Call checkout API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          billingPeriod,
          userId: userData.id,
          userEmail: userData.email,
        }),
      });

      // ... rest stays the same

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300">
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={billingPeriod === 'monthly' ? 'text-white font-semibold' : 'text-gray-400'}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="relative inline-flex h-8 w-14 items-center rounded-full bg-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={billingPeriod === 'yearly' ? 'text-white font-semibold' : 'text-gray-400'}>
            Yearly
            <span className="ml-2 text-sm text-green-400">(Save 15%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {(['starter', 'pro', 'team'] as const).map((tierId) => {
            const tier = PRICING[tierId];
            const limits = TIER_LIMITS[tierId];
            const price = billingPeriod === 'monthly' ? tier.price : tier.annual;
            const isPopular = tier.popular;
            const isLoading = loadingPlan === tierId;

            return (
              <div
                key={tierId}
                className={`relative rounded-2xl p-8 ${
                  isPopular
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl scale-105'
                    : 'bg-slate-800/50 backdrop-blur-sm border border-slate-700'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Zap size={14} />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-gray-300 text-sm mb-4">{tier.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">${price}</span>
                    <span className="text-gray-300">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-400 mt-2">
                      ${(price / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleSubscribe(tierId)}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold mb-6 transition-all ${
                    isPopular
                      ? 'bg-white text-purple-600 hover:bg-gray-100'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Loading...' : 'Start Free Trial'}
                </button>

                <div className="space-y-3">
                  {tier.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-200">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">AI Queries</span>
                      <span className="font-semibold">
                        {limits.maxAiQueries === -1 ? 'Unlimited' : `${limits.maxAiQueries}/day`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Projects</span>
                      <span className="font-semibold">
                        {limits.maxProjects === -1 ? 'Unlimited' : limits.maxProjects}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage</span>
                      <span className="font-semibold">
                        {limits.maxStorage === -1 ? 'Unlimited' : `${limits.maxStorage}MB`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ/Trust Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-400">
            ✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}