import React, { useState, useCallback, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './components/ThemeContext';
import type { OnboardingData } from './types';
import PricingScreen from './components/PricingScreen';
import SubscriptionSuccess from './components/SubscriptionSuccess';

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
        return <PricingScreen userData={onboardingData} />;
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