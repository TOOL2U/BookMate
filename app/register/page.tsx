'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LogoBM from '@/components/LogoBM';
import { Loader2, UserPlus, User, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Registration successful! Store tokens and redirect to dashboard
      console.log('✅ Registration successful! Spreadsheet auto-created.');
      
      // Store authentication tokens
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', data.user.name || data.user.email);
      localStorage.setItem('userId', data.user.id);
      
      // Show success message
      setSuccess('Account created successfully! Redirecting to dashboard...');
      
      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="mb-6 inline-block">
            <LogoBM size={120} />
          </div>
          <h1 className="text-4xl font-bebasNeue uppercase text-text-primary tracking-wide mb-2">
            Create Account
          </h1>
          <p className="text-text-secondary font-aileron">
            Join BookMate - Your Personal Accounting Assistant
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-success/10 border border-success/30 rounded-xl2 p-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <p className="text-success text-sm font-aileron">{success}</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-bg-card border border-border-card rounded-xl2 p-8 backdrop-blur-sm animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2 font-aileron">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2 font-aileron">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                  placeholder="john@example.com"
                  disabled={loading}
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
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              <p className="mt-2 text-xs text-text-secondary font-aileron">Must be at least 8 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2 font-aileron">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error/30 rounded-xl2 p-3 animate-in slide-in-from-top-2">
                <p className="text-error text-sm font-aileron">{error}</p>
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-yellow hover:bg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-xl2 transition-all duration-200 flex items-center justify-center gap-2 font-aileron shadow-glow-yellow"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating your account...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Account Created!</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="bg-yellow/5 border border-yellow/20 rounded-xl2 p-4">
              <p className="text-sm text-text-primary font-aileron">
                ✨ <strong className="text-yellow">Instant Setup:</strong> Your personal accounting spreadsheet will be created automatically!
              </p>
            </div>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-8 animate-fade-in opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <p className="text-text-secondary text-sm font-aileron">
            Already have an account?{' '}
            <Link href="/login" className="text-yellow hover:text-yellow/80 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 animate-fade-in opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
          <p className="text-text-secondary text-xs font-aileron">
            © 2025 BookMate. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
