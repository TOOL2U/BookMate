'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoBM from '@/components/LogoBM';
import { Loader2, LogIn, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);

  // Show initial loading screen for 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple local authentication (easily replaceable with Firebase)
    // TODO: Replace with Firebase Authentication
    const validCredentials = {
      username: 'Shaun',
      password: '1234'
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (username === validCredentials.username && password === validCredentials.password) {
      // Store authentication state (localStorage for MVP, will be replaced with Firebase auth)
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', username);
      
      // Navigate to dashboard
      router.push('/dashboard');
    } else {
      setError('Invalid username or password');
      setIsLoading(false);
    }
  };

  // Initial full-page loading screen
  if (showInitialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8 animate-logo-loading-glow">
            <LogoBM size={200} />
          </div>
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-yellow animate-spin" />
            <p className="text-text-secondary font-aileron text-lg">Loading BookMate...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="mb-6 inline-block">
            <LogoBM size={120} />
          </div>
          <h1 className="text-4xl font-bebasNeue uppercase text-text-primary tracking-wide mb-2">
            Welcome Back
          </h1>
          <p className="text-text-secondary font-aileron">
            Sign in to access your business dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-bg-card border border-border-card rounded-xl2 p-8 backdrop-blur-sm animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2 font-aileron">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2 font-aileron">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error/30 rounded-xl2 p-3 animate-in slide-in-from-top-2">
                <p className="text-error text-sm font-aileron">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow hover:bg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-xl2 transition-all duration-200 flex items-center justify-center gap-2 font-aileron shadow-glow-yellow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-fade-in opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <p className="text-text-secondary text-sm font-aileron">
            © 2025 BookMate. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
