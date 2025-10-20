import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (userId: string, email: string, userData: any) => void;
}

const RobotIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zm0 2a2 2 0 110 4 2 2 0 010-4zm0 0v2m0 8v-2m0 2H8m4 0h4m-4 0v2m0-14a2 2 0 100 4 2 2 0 000-4zM4 12a8 8 0 1116 0H4z" />
  </svg>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up new user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('No user returned from signup');

        // Create user profile in database
        const name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            uuid: authData.user.id,
            email: authData.user.email,
            name,
            onboarding_completed: false,
          });

        if (profileError) throw profileError;

        // Success - new user needs onboarding
        onLoginSuccess(authData.user.id, authData.user.email!, { 
          uuid: authData.user.id, 
          email: authData.user.email,
          name,
          skill_level: null,
          methodologies: [],
          tools: [],
          onboarding_completed: false 
        });

      } else {
        // Login existing user
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        if (!authData.user) throw new Error('No user returned from login');

        // Fetch user profile from database
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('uuid', authData.user.id)
          .single();

        if (fetchError) throw fetchError;
        if (!userData) throw new Error('User profile not found');

        console.log('Logged in user data:', userData);

        // Success - pass full user data
        onLoginSuccess(authData.user.id, authData.user.email!, userData);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="flex flex-col items-center mb-8">
            <RobotIcon />
            <h1 className="text-3xl font-bold text-white mt-4">PiMbOt AI</h1>
            <p className="text-slate-400 mt-1">Your AI Project Management Assistant</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200" 
                placeholder="e.g., pm@example.com" 
                required
                disabled={loading}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200" 
                placeholder="Enter your password"
                minLength={6}
                required
                disabled={loading}
              />
              <p className="text-xs text-slate-400 mt-1">
                {isSignUp ? 'Minimum 6 characters' : ''}
              </p>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Login')}
            </button>
          </form>
          
          <div className="mt-8 text-center text-slate-400 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-medium text-cyan-400 hover:text-cyan-300"
              type="button"
            >
              {isSignUp ? 'Login' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;