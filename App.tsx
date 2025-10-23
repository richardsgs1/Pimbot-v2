import React, { useState, useCallback, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './components/ThemeContext';
import type { OnboardingData } from './types';
import PricingPage from './components/PricingPage';
import SubscriptionSuccess from './components/SubscriptionSuccess';
import { supabase } from './lib/supabase';

type AppState = 'login' | 'onboarding' | 'dashboard' | 'subscriptionSuccess' | 'pricing';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('login');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    id: '',
    skillLevel: null,
    methodologies: [],
    tools: [],
    name: '',
    email: '',
  });

  const checkAuthAndRedirect = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No session, redirecting to login');
      setAppState('login');
      setIsCheckingAuth(false);
      return;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userData) {
      console.log('Loaded user data from database:', userData);
      
      setOnboardingData({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        skillLevel: userData.skill_level,
        methodologies: userData.methodologies || [],
        tools: userData.tools || [],
        hasSeenPricing: userData.has_seen_pricing || false,
      });

      // Determine state based on user's onboarding AND subscription status
      if (!userData.onboarding_completed || !userData.skill_level) {
        // Incomplete onboarding → onboarding screen
        setAppState('onboarding');
      } else if (!userData.subscription_id) {
        // Onboarding complete but no subscription chosen → pricing
        setAppState('pricing');
      } else {
        // Everything complete → dashboard
        setAppState('dashboard');
      }
    }
    
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) {
      console.log('Stripe redirect detected, going to subscription success');
      setAppState('subscriptionSuccess');
      setIsCheckingAuth(false);
      window.history.replaceState({}, '', '/');
      return;
    }
    
    checkAuthAndRedirect();
  }, [checkAuthAndRedirect]);

  const handleLoginSuccess = useCallback((userId: string, email: string, userData: any) => {
    console.log('Login success! User data:', userData);
    
    // Clear any stale data
    localStorage.clear();
    
    // Set fresh user data
    const freshUserData = {
      id: userData.id,
      name: userData.name,
      email: userData.email || email,
      skillLevel: userData.skill_level,
      methodologies: userData.methodologies || [],
      tools: userData.tools || [],
      hasSeenPricing: userData.has_seen_pricing || false,
    };
    
    setOnboardingData(freshUserData);
    
    // Use same logic as checkAuth for consistency
    if (!userData.onboarding_completed || !userData.skill_level) {
      setAppState('onboarding');
    } else if (!userData.subscription_id) {
      setAppState('pricing');
    } else {
      setAppState('dashboard');
    }
  }, []);

  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
    console.log('🎯 Onboarding complete, data:', data);
    setOnboardingData(data);
    console.log('🎯 Setting state to pricing');
    setAppState('pricing');
    console.log('🎯 State should now be pricing');
  }, []);

  const handleSubscriptionSuccess = useCallback(async () => {
    console.log('Subscription verified, reloading user data...');
    await checkAuthAndRedirect();
  }, [checkAuthAndRedirect]);

  const handleLogout = useCallback(async () => {
    console.log('Logging out...');
    
    // Sign out from Supabase (this is critical!)
    await supabase.auth.signOut();
    
    // Clear all local data
    localStorage.clear();
    
    // Reset state
    setOnboardingData({
      id: '',
      skillLevel: null,
      methodologies: [],
      tools: [],
      name: '',
      email: '',
    });
    
    setAppState('login');
  }, []);

  const renderContent = () => {
    switch (appState) {
      case 'login':
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      case 'onboarding':
        return <Onboarding onOnboardingComplete={handleOnboardingComplete} initialData={onboardingData} />;
      case 'pricing':
        return <PricingPage userData={onboardingData} onComplete={() => setAppState('dashboard')} />; 
      case 'subscriptionSuccess':
        return <SubscriptionSuccess onContinue={handleSubscriptionSuccess} />;
      case 'dashboard':
        return <Dashboard userData={onboardingData} onLogout={handleLogout} />;
      default:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }
  };

  if (isCheckingAuth) {
    return (
      <ThemeProvider>
        <div className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen transition-colors duration-300">
        {renderContent()}
      </div>
    </ThemeProvider>
  );
};

export default App;