
import React, { useState, useCallback, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './components/ThemeContext';
import type { OnboardingData } from './types';

type AppState = 'login' | 'onboarding' | 'dashboard';

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

  // FIX: Updated handleLoginSuccess to accept email and set it as the user ID.
  const handleLoginSuccess = useCallback((name: string, email: string) => {
    setOnboardingData(prev => ({ ...prev, name, id: email }));
    setAppState('onboarding');
  }, []);

  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
    setOnboardingData(data);
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
        // FIX: Passed the entire onboarding data object to the Onboarding component.
        return <Onboarding onOnboardingComplete={handleOnboardingComplete} initialData={onboardingData} />;
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