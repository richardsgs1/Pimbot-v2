import React, { useState } from 'react';
import { PRICING } from '../lib/pricing';

interface PricingPageProps {
  onSelectPlan?: (tier: 'starter' | 'pro' | 'team' | 'enterprise') => void;
  currentTier?: 'trial' | 'starter' | 'pro' | 'team' | 'enterprise';
}

const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan, currentTier = 'trial' }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleSelectPlan = (tier: 'starter' | 'pro' | 'team' | 'enterprise') => {
    if (onSelectPlan) {
      onSelectPlan(tier);
    }
  };

  const getButtonText = (tier: string) => {
    if (tier === 'enterprise') return 'Contact Sales';
    if (currentTier === tier) return 'Current Plan';
    if (currentTier === 'trial') return 'Start Free Trial';
    return 'Upgrade';
  };

  const getButtonDisabled = (tier: string) => {
    return currentTier === tier;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-6 sm:mb-8">
            Start with a 10-day free trial. No credit card required.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                Save up to 23%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Starter Plan */}
          <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                {PRICING.starter.name}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">
                {PRICING.starter.description}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  ${billingCycle === 'monthly' ? PRICING.starter.price : Math.floor(PRICING.starter.annual / 12)}
                </span>
                <span className="text-[var(--text-tertiary)]">/month</span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-xs text-green-400 mt-1">
                  ${PRICING.starter.annual}/year - Save ${PRICING.starter.savings}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {PRICING.starter.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[var(--text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan('starter')}
              disabled={getButtonDisabled('starter')}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                getButtonDisabled('starter')
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-[var(--bg-tertiary)] hover:bg-[var(--accent-primary)] text-[var(--text-primary)] hover:text-white border border-[var(--border-primary)]'
              }`}
            >
              {getButtonText('starter')}
            </button>
          </div>

          {/* Pro Plan - Most Popular */}
          <div className="relative bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] rounded-xl p-6 flex flex-col shadow-xl scale-100 md:scale-105">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-[var(--accent-primary)] text-white text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                {PRICING.pro.name}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">
                {PRICING.pro.description}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[var(--accent-primary)]">
                  ${billingCycle === 'monthly' ? PRICING.pro.price : Math.floor(PRICING.pro.annual / 12)}
                </span>
                <span className="text-[var(--text-tertiary)]">/month</span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-xs text-green-400 mt-1">
                  ${PRICING.pro.annual}/year - Save ${PRICING.pro.savings}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {PRICING.pro.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[var(--text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan('pro')}
              disabled={getButtonDisabled('pro')}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                getButtonDisabled('pro')
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white shadow-lg'
              }`}
            >
              {getButtonText('pro')}
            </button>
          </div>

          {/* Team Plan */}
          <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                {PRICING.team.name}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">
                {PRICING.team.description}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  ${billingCycle === 'monthly' ? PRICING.team.price : Math.floor(PRICING.team.annual / 12)}
                </span>
                <span className="text-[var(--text-tertiary)]">/month</span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-xs text-green-400 mt-1">
                  ${PRICING.team.annual}/year - Save ${PRICING.team.savings}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {PRICING.team.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[var(--text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan('team')}
              disabled={getButtonDisabled('team')}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                getButtonDisabled('team')
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-[var(--bg-tertiary)] hover:bg-[var(--accent-primary)] text-[var(--text-primary)] hover:text-white border border-[var(--border-primary)]'
              }`}
            >
              {getButtonText('team')}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                {PRICING.enterprise.name}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">
                {PRICING.enterprise.description}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[var(--text-primary)]">Custom</span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Contact us for pricing
              </p>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {PRICING.enterprise.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[var(--text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan('enterprise')}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all bg-[var(--bg-tertiary)] hover:bg-[var(--accent-primary)] text-[var(--text-primary)] hover:text-white border border-[var(--border-primary)]"
            >
              {getButtonText('enterprise')}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
              <summary className="font-semibold text-[var(--text-primary)] cursor-pointer">
                What happens after my 10-day trial?
              </summary>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                After your trial ends, you'll need to choose a paid plan to continue using PiMbOt AI. 
                Your data will be saved, and you can pick up right where you left off.
              </p>
            </details>

            <details className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
              <summary className="font-semibold text-[var(--text-primary)] cursor-pointer">
                Can I change plans later?
              </summary>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any charges.
              </p>
            </details>

            <details className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
              <summary className="font-semibold text-[var(--text-primary)] cursor-pointer">
                What payment methods do you accept?
              </summary>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                We accept all major credit cards (Visa, MasterCard, American Express) through Stripe.
              </p>
            </details>

            <details className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
              <summary className="font-semibold text-[var(--text-primary)] cursor-pointer">
                Is there a refund policy?
              </summary>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
              </p>
            </details>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            Trusted by project managers worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            <span className="text-2xl">🔒 Secure</span>
            <span className="text-2xl">💳 Stripe</span>
            <span className="text-2xl">⚡ Fast</span>
            <span className="text-2xl">🛡️ GDPR</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;