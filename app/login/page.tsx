'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoBM from '@/components/LogoBM';
import { Loader2, LogIn, User, Lock, UserPlus, Mail } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { createUserWithEmailAndPassword } from 'firebase/auth';

type AuthMode = 'login' | 'signup' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetLink, setResetLink] = useState('');

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
      // Call the actual authentication API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username, // Using username field for email
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens
      if (data.tokens) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        
        // Also set a cookie for server-side auth
        document.cookie = `session=${data.tokens.accessToken}; path=/; max-age=${data.tokens.expiresIn}; SameSite=Strict`;
      }

      // Store user info
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Force full page refresh to clear all caches when switching accounts
      // Navigate to admin dashboard for admin users, regular dashboard for others
      if (data.user.role === 'admin') {
        window.location.href = '/admin/accounts';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid username or password');
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    
    // Client-side validation
    if (!signupEmail || !signupPassword || !confirmPassword) {
      setSignupError('All fields are required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      setSignupError('Please enter a valid email address');
      return;
    }
    
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }
    
    if (signupPassword !== confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    
    setIsSigningUp(true);
    
    try {
      // Call signup API (creates both Firebase and PostgreSQL user)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      
      // Success! Show message and switch to login
      setSignupSuccess(true);
      setSignupError('');
      
      // Pre-fill login form
      setUsername(signupEmail);
      setPassword('');
      
      // Switch to login tab after 2 seconds
      setTimeout(() => {
        setMode('login');
        setSignupSuccess(false);
        setSignupEmail('');
        setSignupPassword('');
        setConfirmPassword('');
      }, 2000);
      
    } catch (err: any) {
      setSignupError(err.message || 'Unable to create account. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSignupError('');
    setSignupSuccess(false);
    setResetError('');
    setResetSuccess(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess(false);
    
    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetError('Please enter a valid email address');
      return;
    }
    
    setIsResetting(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }
      
      setResetSuccess(true);
      
      // In development, show the reset link
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
      
      // Clear form and switch to login after 5 seconds
      setTimeout(() => {
        setMode('login');
        setResetEmail('');
        setResetSuccess(false);
        setResetLink('');
      }, 5000);
      
    } catch (err: any) {
      setResetError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsResetting(false);
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
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p className="text-text-secondary font-aileron">
            {mode === 'login' 
              ? 'Sign in to access your business dashboard'
              : mode === 'signup'
              ? 'Use the email your BookMate admin has registered for you'
              : 'Enter your email to receive a password reset link'
            }
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-3 px-4 rounded-xl2 font-bebasNeue text-sm uppercase tracking-wide transition-all ${
              mode === 'login'
                ? 'bg-yellow text-black shadow-glow-yellow'
                : 'bg-surface-2 text-secondary hover:bg-surface-3'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 py-3 px-4 rounded-xl2 font-bebasNeue text-sm uppercase tracking-wide transition-all ${
              mode === 'signup'
                ? 'bg-yellow text-black shadow-glow-yellow'
                : 'bg-surface-2 text-secondary hover:bg-surface-3'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
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

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-sm text-yellow hover:text-yellow/80 transition-colors font-aileron underline"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <div className="bg-bg-card border border-border-card rounded-xl2 p-8 backdrop-blur-sm animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Success Message */}
              {signupSuccess && (
                <div className="bg-success/10 border border-success/30 rounded-xl2 p-3 animate-in slide-in-from-top-2">
                  <p className="text-success text-sm font-aileron">
                    ✓ Account created successfully! You can now log in.
                  </p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-text-primary mb-2 font-aileron">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                    placeholder="your.email@company.com"
                    required
                    disabled={isSigningUp}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-text-primary mb-2 font-aileron">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    disabled={isSigningUp}
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-text-primary mb-2 font-aileron">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                    placeholder="Re-enter your password"
                    required
                    disabled={isSigningUp}
                  />
                </div>
              </div>

              {/* Error Message */}
              {signupError && (
                <div className="bg-error/10 border border-error/30 rounded-xl2 p-3 animate-in slide-in-from-top-2">
                  <p className="text-error text-sm font-aileron">{signupError}</p>
                </div>
              )}

              {/* Info Message */}
              <div className="bg-yellow/10 border border-yellow/30 rounded-xl2 p-3">
                <p className="text-yellow text-xs font-aileron">
                  ⓘ Make sure your email matches the one registered by your BookMate admin. After signing up, you&apos;ll be able to log in and access your account.
                </p>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isSigningUp}
                className="w-full bg-yellow hover:bg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-xl2 transition-all duration-200 flex items-center justify-center gap-2 font-aileron shadow-glow-yellow"
              >
                {isSigningUp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Password Reset Form */}
        {mode === 'reset' && (
          <div className="bg-bg-card border border-border-card rounded-xl2 p-8 backdrop-blur-sm animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <form onSubmit={handlePasswordReset} className="space-y-6">
              {/* Success Message */}
              {resetSuccess && (
                <div className="bg-success/10 border border-success/30 rounded-xl2 p-4 animate-in slide-in-from-top-2">
                  <p className="text-success text-sm font-aileron mb-2">
                    ✓ Password reset instructions have been sent to your email!
                  </p>
                  <p className="text-text-secondary text-xs font-aileron">
                    Check your inbox and follow the link to reset your password.
                  </p>
                  {resetLink && (
                    <div className="mt-3 p-3 bg-black/50 rounded-lg">
                      <p className="text-yellow text-xs font-aileron mb-1">
                        🔧 Development Mode - Reset Link:
                      </p>
                      <a 
                        href={resetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow/80 text-xs break-all hover:underline"
                      >
                        {resetLink}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-text-primary mb-2 font-aileron">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                    placeholder="Enter your email address"
                    required
                    disabled={isResetting || resetSuccess}
                  />
                </div>
              </div>

              {/* Error Message */}
              {resetError && (
                <div className="bg-error/10 border border-error/30 rounded-xl2 p-3 animate-in slide-in-from-top-2">
                  <p className="text-error text-sm font-aileron">{resetError}</p>
                </div>
              )}

              {/* Info Message */}
              <div className="bg-yellow/10 border border-yellow/30 rounded-xl2 p-3">
                <p className="text-yellow text-xs font-aileron">
                  ⓘ Enter the email address associated with your BookMate account. We&apos;ll send you instructions to reset your password.
                </p>
              </div>

              {/* Reset Button */}
              <button
                type="submit"
                disabled={isResetting || resetSuccess}
                className="w-full bg-yellow hover:bg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-xl2 transition-all duration-200 flex items-center justify-center gap-2 font-aileron shadow-glow-yellow"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>

              {/* Back to Login Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-sm text-text-secondary hover:text-yellow transition-colors font-aileron"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          </div>
        )}

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
