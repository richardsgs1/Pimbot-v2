import React, { useState, useCallback, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './components/ThemeContext';
import type { OnboardingData, TaskTemplate } from './types';
import PricingPage from './components/PricingPage';
import SubscriptionSuccess from './components/SubscriptionSuccess';
import { supabase } from './lib/supabase';
import templateService from './lib/templateService';

type AppState = 'login' | 'onboarding' | 'dashboard' | 'subscriptionSuccess' | 'pricing';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('login');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    id: '',
    skillLevel: null as any,
    methodologies: [],
    tools: [],
    name: '',
    email: '',
  });

  // Task Templates State - persisted to Supabase with localStorage fallback
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Load task templates from Supabase on auth check
  const loadTemplates = useCallback(async (userId: string) => {
    try {
      setIsLoadingTemplates(true);
      const templates = await templateService.loadTemplates(userId);
      setTaskTemplates(templates);
      console.log('Loaded', templates.length, 'task templates from Supabase');
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Falls back to localStorage automatically in templateService
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // Template management callbacks - now use Supabase
  const handleSaveTemplate = useCallback(async (template: TaskTemplate) => {
    const userId = onboardingData.id;
    if (!userId) {
      console.error('Cannot save template: no user ID');
      return;
    }

    try {
      const savedTemplate = await templateService.saveTemplate(userId, {
        name: template.name,
        description: template.description,
        category: template.category,
        defaultPriority: template.defaultPriority,
        defaultEstimatedHours: template.defaultEstimatedHours,
        subtasks: template.subtasks,
        defaultAssignees: template.defaultAssignees,
        tags: template.tags,
      });

      setTaskTemplates(prev => [...prev, savedTemplate]);
      console.log('Template saved to Supabase:', template.name);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  }, [onboardingData.id]);

  const handleLoadTemplate = useCallback((template: TaskTemplate) => {
    // Template loading is handled by the component
    console.log('Template loaded:', template.name);
  }, []);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      await templateService.deleteTemplate(templateId);
      setTaskTemplates(prev => prev.filter(t => t.id !== templateId));
      console.log('Template deleted from Supabase:', templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  }, []);

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

      // Load user's task templates from Supabase
      await loadTemplates(userData.id);

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
  }, [loadTemplates]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    
    if (sessionId) {
      console.log('Stripe redirect detected, session ID:', sessionId);
      setStripeSessionId(sessionId);
      setAppState('subscriptionSuccess');
      setIsCheckingAuth(false);
      window.history.replaceState({}, '', '/');
      return;
    }
    
    checkAuthAndRedirect();
  }, [checkAuthAndRedirect]);

  const handleLoginSuccess = useCallback((userId: string, email: string, userData: any) => {
    console.log('Login success! User data:', userData);

    // Clear only app-specific localStorage keys, NOT Supabase session keys
    // Supabase stores auth session in localStorage under keys like 'sb-<project-id>-auth-token'
    const keysToKeep = ['sb-qfkhxrcbtgllzffnnxhp-auth-token', 'sb-qfkhxrcbtgllzffnnxhp-auth-user'];
    const localStorageKeys = Object.keys(localStorage);

    for (const key of localStorageKeys) {
      // Keep Supabase auth keys and user_id
      if (!key.includes('sb-') && key !== 'user_id') {
        localStorage.removeItem(key);
      }
    }

    // Store the auth UID for later use in database operations
    localStorage.setItem('user_id', userId);

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
      skillLevel: null as any,
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
        return <SubscriptionSuccess sessionId={stripeSessionId!} onContinue={handleSubscriptionSuccess} />;
      case 'dashboard':
        return (
          <Dashboard
            userData={onboardingData}
            onLogout={handleLogout}
            templates={taskTemplates}
            onSaveTemplate={handleSaveTemplate}
            onLoadTemplate={handleLoadTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        );
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