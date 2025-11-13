'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

    try {
      // Call the authentication API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username, // Using username field as email
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store authentication tokens
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', data.user.name || data.user.email);
        localStorage.setItem('userId', data.user.id);
        
        // Navigate to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid username or password');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
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
            {/* Email Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2 font-aileron">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="username"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                  placeholder="Enter your email"
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

          {/* Create Account Link */}
          <div className="text-center pt-6 mt-6 border-t border-border-card">
            <p className="text-text-secondary text-sm font-aileron mb-2">
              Don&apos;t have an account?
            </p>
            <a
              href="/register"
              className="text-yellow hover:text-yellow/80 font-semibold font-aileron transition-colors duration-200 inline-block cursor-pointer"
            >
              Create Account →
            </a>
          </div>
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
