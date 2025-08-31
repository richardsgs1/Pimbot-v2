
import React, { useState, useCallback, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import type { OnboardingData } from './types';
import { v4 as uuidv4 } from 'uuid'; // We'll use a library for unique IDs

// A helper to get or create a unique user ID
const getUserId = (): string => {
  let userId = localStorage.getItem('pimbot_userId');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('pimbot_userId', userId);
  }
  return userId;
};


const App: React.FC = () => {
  // Use a function for lazy initialization to ensure getUserId is called only once.
  const [userId] = useState(getUserId);

  const [appState, setAppState] = useState<AppState>(() => {
    return (localStorage.getItem('pimbot_appState') as AppState) || 'login';
  });
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    const savedData = localStorage.getItem('pimbot_onboardingData');
    if (savedData) {
      return JSON.parse(savedData);
    }
    // If no saved data, create default data with the stable user ID.
    return {
      skillLevel: null,
      methodologies: [],
      tools: [],
      name: 'Valued User',
      id: userId,
    };
  });

  useEffect(() => {
    localStorage.setItem('pimbot_appState', appState);
  }, [appState]);

  useEffect(() => {
    // Ensure data being saved always has the correct, stable user ID.
    localStorage.setItem('pimbot_onboardingData', JSON.stringify({ ...onboardingData, id: userId }));
  }, [onboardingData, userId]);

  const handleLoginSuccess = useCallback((name: string) => {
    // When logging in, ensure we start with the correct user ID.
    setOnboardingData(prev => ({ ...prev, name, id: userId }));
    setAppState('onboarding');
  }, [userId]);

  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
    // Ensure the final onboarding data has the stable ID before saving.
    setOnboardingData({ ...data, id: userId });
    setAppState('dashboard');
  }, [userId]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('pimbot_appState');
    localStorage.removeItem('pimbot_onboardingData');
    // We don't remove the userId so they are recognized if they log back in.
    setAppState('login');
    // Reset to default state but keep the ID
    setOnboardingData({
        skillLevel: null,
        methodologies: [],
        tools: [],
        name: 'Valued User',
        id: userId,
    });
  }, [userId]);

  type AppState = 'login' | 'onboarding' | 'dashboard';

  const renderContent = () => {
    switch (appState) {
      case 'login':
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      case 'onboarding':
        return <Onboarding onOnboardingComplete={handleOnboardingComplete} initialData={onboardingData} />;
      case 'dashboard':
        return <Dashboard userData={onboardingData} onLogout={handleLogout} />;
      default:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      {renderContent()}
    </div>
  );
};

// Simple UUID v4 generator since we can't import libraries
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


export default App;