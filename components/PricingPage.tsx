import React, { useState } from 'react';
import type { OnboardingData } from '../types';

interface PricingPageProps {
  userData: OnboardingData;
}

const PricingPage: React.FC<PricingPageProps> = ({ userData }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // UPDATED WITH YOUR REAL STRIPE PRICE IDs
  const priceIds = {
    starter: {
      monthly: 'price_1SJz3j4sXU2AWctaPfrlI6Dr',
      yearly: 'price_1SJz584sXU2AWctazOczYezC'
    },
    pro: {
      monthly: 'price_1SJz6D4sXU2AWctamRKkSsDC',
      yearly: 'price_1SJz6j4sXU2AWctau4RJeSq2'
    },
    team: {
      monthly: 'price_1SJz7a4sXU2AWctaHNfu9kvZ',
      yearly: 'price_1SJz884sXU2AWctaf2SvY557'
    }
  };

  const handleCheckout = async (tier: 'starter' | 'pro' | 'team') => {
  console.log('🚀 PRICINGPAGE.TSX VERSION 3.0 LOADED');
  
  if (!userData || !userData.id) {
    alert('Please complete your profile first');
    console.log('New user, no ID yet');
    return;
  }

  console.log('User ID:', userData.id);
  console.log('User Email:', userData.email);

  setLoadingPlan(tier);

  try {
    console.log(`Creating checkout session for ${tier} (${billingCycle})`);

    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan: tier,                    // ← Changed from priceId
        billingPeriod: billingCycle,   // ← Added this
        userId: userData.id,
        userEmail: userData.email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Checkout failed');
    }

    const { url } = await response.json();
    
    console.log('Redirecting to Stripe:', url);
    window.location.href = url;
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Failed to start checkout. Please try again.');
  } finally {
    setLoadingPlan(null);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300">
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-800/50 backdrop-blur rounded-full p-1 flex items-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-green-400">(Save 15%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 hover:border-purple-500 transition-all">
            <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
            <p className="text-gray-400 mb-6">Perfect for freelancers & solopreneurs</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">
                ${billingCycle === 'monthly' ? '14' : '12'}
              </span>
              <span className="text-gray-400">/mo</span>
            </div>
            <button
              onClick={() => handleCheckout('starter')}
              disabled={loadingPlan !== null}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {loadingPlan === 'starter' ? 'Loading...' : 'Start Free Trial'}
            </button>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                3 projects
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                1 team member
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                75 AI queries/day
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                PDF & CSV export
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                500MB storage
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 backdrop-blur rounded-2xl p-8 border-2 border-purple-500 hover:border-purple-400 transition-all relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 rounded-full text-sm font-bold">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
            <p className="text-gray-300 mb-6">Best for small teams & agencies</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">
                ${billingCycle === 'monthly' ? '29' : '25'}
              </span>
              <span className="text-gray-300">/mo</span>
            </div>
            <button
              onClick={() => handleCheckout('pro')}
              disabled={loadingPlan !== null}
              className="w-full bg-white hover:bg-gray-100 text-purple-900 font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {loadingPlan === 'pro' ? 'Loading...' : 'Start Free Trial'}
            </button>
            <ul className="space-y-3 text-white">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                25 projects
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                5 team members
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                150 AI queries/day
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                All export formats
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                10GB storage
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Priority support
              </li>
            </ul>
          </div>

          {/* Team Plan */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 hover:border-purple-500 transition-all">
            <h3 className="text-2xl font-bold text-white mb-2">Team</h3>
            <p className="text-gray-400 mb-6">For growing businesses</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">
                ${billingCycle === 'monthly' ? '119' : '101'}
              </span>
              <span className="text-gray-400">/mo</span>
            </div>
            <button
              onClick={() => handleCheckout('team')}
              disabled={loadingPlan !== null}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {loadingPlan === 'team' ? 'Loading...' : 'Start Free Trial'}
            </button>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Unlimited projects
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                20 team members
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                500 AI queries/day
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Advanced AI analytics
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                All exports + API
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                100GB storage
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Dedicated support
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage