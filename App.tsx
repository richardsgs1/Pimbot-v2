import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './components/ThemeContext';
import type { OnboardingData } from './types';

function App() {
  const [userData, setUserData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    // Check if user data exists in localStorage
    const savedUserData = localStorage.getItem('pimbot-user-data');
    if (savedUserData) {
      try {
        const parsedData = JSON.parse(savedUserData);
        setUserData(parsedData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('pimbot-user-data');
      }
    }
  }, []);

  const handleOnboardingComplete = (data: OnboardingData) => {
    setUserData(data);
    // Save to localStorage
    localStorage.setItem('pimbot-user-data', JSON.stringify(data));
  };

  const handleLogout = () => {
    setUserData(null);
    localStorage.removeItem('pimbot-user-data');
  };

  // Default initial data for onboarding
  const defaultOnboardingData: OnboardingData = {
    name: '',
    skillLevel: null,
    methodologies: [],
    tools: []
  };

  return (
    <ThemeProvider>
      <div className="App">
        {!userData ? (
          <Onboarding 
            onOnboardingComplete={handleOnboardingComplete}
            initialData={defaultOnboardingData}
          />
        ) : (
          <Dashboard userData={userData} onSignOut={handleLogout} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;