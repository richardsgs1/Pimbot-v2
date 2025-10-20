import React, { useState, useCallback, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './components/ThemeContext';
import type { OnboardingData } from './types';
import SubscriptionSuccess from './components/SubscriptionSuccess';

type AppState = 'login' | 'onboarding' | 'dashboard' | 'subscriptionSuccess';

// FIX: Added a default ID to the onboarding data.
const defaultOnboardingData: OnboardingData = {
  id: 'user-1',
  skillLevel: null,
  methodologies: [],
  tools: [],
  name: 'Valued User',
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    return (localStorage.getItem('pimbot_appState') as AppState) || 'login';
  });

  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    const savedData = localStorage.getItem('pimbot_onboardingData');
    return savedData ? JSON.parse(savedData) : defaultOnboardingData;
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
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleLoginSuccess = useCallback((name: string, email: string) => {
  // Check if this user already has onboarding data
  const existingData = localStorage.getItem('pimbot_onboardingData');
  
  if (existingData) {
    const parsed = JSON.parse(existingData);
    // If they have skillLevel set, they've completed onboarding
    if (parsed.skillLevel && parsed.id === email) {
      setOnboardingData(parsed);
      setAppState('dashboard'); // ← Skip onboarding!
    } else {
      // New user or incomplete onboarding
      setOnboardingData(prev => ({ ...prev, name, id: email }));
      setAppState('onboarding');
    }
  } else {
    // Brand new user
    setOnboardingData(prev => ({ ...prev, name, id: email }));
    setAppState('onboarding');
  }
  }, []);

  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
    setOnboardingData(data);
    setAppState('dashboard');
  }, []);

  const handleSubscriptionSuccess = useCallback(() => {
    setAppState('dashboard');
  }, []);

   const handleLogout = useCallback(() => {
    localStorage.removeItem('pimbot_appState');
    localStorage.removeItem('pimbot_onboardingData');
    setOnboardingData(defaultOnboardingData);
    setAppState('login');
  }, []);

  const renderContent = () => {
  switch (appState) {
    case 'login':
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    case 'onboarding':
      return <Onboarding onOnboardingComplete={handleOnboardingComplete} initialData={onboardingData} />;
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