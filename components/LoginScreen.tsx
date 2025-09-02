
import React, { useState } from 'react';

interface LoginScreenProps {
  // FIX: Updated onLoginSuccess to pass the email as a user ID.
  onLoginSuccess: (name: string, email: string) => void;
}

const RobotIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zm0 2a2 2 0 110 4 2 2 0 010-4zm0 0v2m0 8v-2m0 2H8m4 0h4m-4 0v2m0-14a2 2 0 100 4 2 2 0 000-4zM4 12a8 8 0 1116 0H4z" />
  </svg>
);


const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = email.split('@')[0] || 'Project Manager';
    // Capitalize first letter of the name
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    // FIX: Pass email along with the formatted name.
    onLoginSuccess(formattedName, email);
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
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200" 
                placeholder="e.g., pm@example.com" 
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input 
                type="password" 
                id="password"
                defaultValue="••••••••"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200" 
                placeholder="Enter your password" 
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 shadow-lg"
            >
              Login with MFA
            </button>

            <div className="text-center mt-6">
              <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300">Forgot Password?</a>
            </div>
          </form>
          
          <div className="mt-8 text-center text-slate-400 text-sm">
            Don't have an account? <a href="#" className="font-medium text-cyan-400 hover:text-cyan-300">Sign Up</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;