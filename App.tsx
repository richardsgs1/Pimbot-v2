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
  const [appState, setAppState] = useState<AppState>(() => {
    return (localStorage.getItem('pimbot_appState') as AppState) || 'login';
  });

  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    const savedData = localStorage.getItem('pimbot_onboardingData');
    if (savedData) {
      return JSON.parse(savedData);
    }
    return {
      id: '',
      skillLevel: null,
      methodologies: [],
      tools: [],
      name: '',
    };
  });

  useEffect(() => {
    localStorage.setItem('pimbot_appState', appState);
  }, [appState]);

  useEffect(() => {
    localStorage.setItem('pimbot_onboardingData', JSON.stringify(onboardingData));
  }, [onboardingData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) {
      setAppState('subscriptionSuccess');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Not logged in
      console.log('No session, redirecting to login');
      setAppState('login');
      localStorage.removeItem('pimbot_appState');
      localStorage.removeItem('pimbot_onboardingData');
      return;
    }

    // Logged in - load user data from database
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
      });

      // Set correct appState based on user status
      if (userData.onboarding_completed && userData.skill_level) {
        // Existing user with completed onboarding → dashboard
        if (appState !== 'dashboard' && appState !== 'subscriptionSuccess') {
          console.log('User has completed onboarding, going to dashboard');
          setAppState('dashboard');
        }
      } else {
        // Incomplete onboarding
        setAppState('onboarding');
      }
    }
  };
  
  checkAuth();
}, []);

  const handleLoginSuccess = useCallback((userId: string, email: string, userData: any) => {
    console.log('Login success! User data:', userData);
    
    // CRITICAL: Clear old localStorage data first
    localStorage.removeItem('pimbot_onboardingData');
    localStorage.removeItem('pimbot_appState');
    
    // Check if user has completed onboarding
    if (userData.onboarding_completed && userData.skill_level) {
      // Existing user - go straight to dashboard
      setOnboardingData({
        id: userData.id,
        name: userData.name,
        email: userData.email || email,
        skillLevel: userData.skill_level,
        methodologies: userData.methodologies || [],
        tools: userData.tools || [],
      });
      setAppState('dashboard');
    } else {
      // New user or incomplete onboarding - go to onboarding
      setOnboardingData({
        id: userData.id,
        name: userData.name,
        email: userData.email || email, 
        skillLevel: null,
        methodologies: [],
        tools: [],
      });
      setAppState('onboarding');
    }
  }, []);

  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
    console.log('🎯 Onboarding complete, data:', data);
    setOnboardingData(data);
    console.log('🎯 Setting state to pricing');
    setAppState('pricing');
    console.log('🎯 State should now be pricing');
  }, []);

  const handleSubscriptionSuccess = useCallback(() => {
    setAppState('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('pimbot_appState');
    localStorage.removeItem('pimbot_onboardingData');
    setOnboardingData({
      id: '',
      skillLevel: null,
      methodologies: [],
      tools: [],
      name: '',
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

  return (
    <ThemeProvider>
      <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen transition-colors duration-300">
        {renderContent()}
      </div>
    </ThemeProvider>
  );
};

export default App;