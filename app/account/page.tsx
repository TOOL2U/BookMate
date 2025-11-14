'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  FileSpreadsheet, 
  LogOut, 
  Shield,
  Clock,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  googleSheetId?: string;
  role?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedSheetId, setCopiedSheetId] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get user data from localStorage
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      const email = localStorage.getItem('userEmail') || 'Not available';
      const accessToken = localStorage.getItem('accessToken');

      if (!userId || !accessToken) {
        router.push('/login');
        return;
      }

      // Try to fetch additional user data from API
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserData({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            createdAt: data.user.createdAt,
            googleSheetId: data.user.googleSheetId,
            role: data.user.role || 'User'
          });
        } else {
          // Fallback to localStorage data
          setUserData({
            id: userId,
            name: username || 'User',
            email: email,
            createdAt: new Date().toISOString(),
            role: 'User'
          });
        }
      } catch (error) {
        // Fallback to localStorage data
        setUserData({
          id: userId,
          name: username || 'User',
          email: email,
          createdAt: new Date().toISOString(),
          role: 'User'
        });
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    
    // Redirect to login
    router.push('/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSheetId(true);
    setTimeout(() => setCopiedSheetId(false), 2000);
  };

  const openSpreadsheet = () => {
    if (userData?.googleSheetId) {
      window.open(`https://docs.google.com/spreadsheets/d/${userData.googleSheetId}/edit`, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow mx-auto mb-4"></div>
            <p className="text-text-secondary font-aileron">Loading account information...</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!userData) {
    return (
      <AdminShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-error font-aileron">Failed to load account information</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-yellow text-black rounded-xl2 font-aileron"
            >
              Return to Login
            </button>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto page-transition"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow/10 rounded-xl2 border border-yellow/20">
              <User className="w-6 h-6 text-yellow" />
            </div>
            <div>
              <h1 className="text-3xl font-bebasNeue uppercase text-text-primary tracking-wide">
                Account Settings
              </h1>
              <p className="text-text-secondary font-aileron">
                Manage your profile and account information
              </p>
            </div>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="bg-bg-card border border-border-card rounded-xl2 p-6 mb-6">
          <h2 className="text-xl font-bebasNeue uppercase text-text-primary mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow" />
            Account Information
          </h2>

          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-start gap-4 p-4 bg-black/30 rounded-xl border border-border-card">
              <div className="p-2 bg-yellow/10 rounded-lg">
                <User className="w-5 h-5 text-yellow" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-secondary font-aileron mb-1">Full Name</p>
                <p className="text-text-primary font-aileron font-semibold">{userData.name}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4 p-4 bg-black/30 rounded-xl border border-border-card">
              <div className="p-2 bg-yellow/10 rounded-lg">
                <Mail className="w-5 h-5 text-yellow" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-secondary font-aileron mb-1">Email Address</p>
                <p className="text-text-primary font-aileron font-semibold">{userData.email}</p>
              </div>
            </div>

            {/* User ID */}
            <div className="flex items-start gap-4 p-4 bg-black/30 rounded-xl border border-border-card">
              <div className="p-2 bg-yellow/10 rounded-lg">
                <Shield className="w-5 h-5 text-yellow" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-secondary font-aileron mb-1">User ID</p>
                <p className="text-text-primary font-aileron font-mono text-sm">{userData.id}</p>
              </div>
            </div>

            {/* Account Created */}
            <div className="flex items-start gap-4 p-4 bg-black/30 rounded-xl border border-border-card">
              <div className="p-2 bg-yellow/10 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-secondary font-aileron mb-1">Account Created</p>
                <p className="text-text-primary font-aileron">{formatDate(userData.createdAt)}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-4 p-4 bg-black/30 rounded-xl border border-border-card">
              <div className="p-2 bg-yellow/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-secondary font-aileron mb-1">Role</p>
                <p className="text-text-primary font-aileron">{userData.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Spreadsheet Information Card */}
        {userData.googleSheetId && (
          <div className="bg-bg-card border border-border-card rounded-xl2 p-6 mb-6">
            <h2 className="text-xl font-bebasNeue uppercase text-text-primary mb-6 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-yellow" />
              Your Spreadsheet
            </h2>

            <div className="space-y-4">
              {/* Spreadsheet ID */}
              <div className="flex items-start gap-4 p-4 bg-black/30 rounded-xl border border-border-card">
                <div className="p-2 bg-yellow/10 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-yellow" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-secondary font-aileron mb-2">Spreadsheet ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-text-primary font-aileron font-mono text-sm flex-1 break-all">
                      {userData.googleSheetId}
                    </p>
                    <button
                      onClick={() => copyToClipboard(userData.googleSheetId!)}
                      className="p-2 hover:bg-yellow/10 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedSheetId ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-text-secondary" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Open Spreadsheet Button */}
              <button
                onClick={openSpreadsheet}
                className="w-full bg-yellow/10 hover:bg-yellow/20 border border-yellow/30 text-yellow font-semibold py-3 px-4 rounded-xl2 transition-all duration-200 flex items-center justify-center gap-2 font-aileron"
              >
                <ExternalLink className="w-5 h-5" />
                Open Your Spreadsheet in Google Sheets
              </button>
            </div>
          </div>
        )}

        {/* Actions Card */}
        <div className="bg-bg-card border border-border-card rounded-xl2 p-6">
          <h2 className="text-xl font-bebasNeue uppercase text-text-primary mb-6">
            Account Actions
          </h2>

          <div className="space-y-3">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-error/10 hover:bg-error/20 border border-error/30 text-error font-semibold py-3 px-4 rounded-xl2 transition-all duration-200 flex items-center justify-center gap-2 font-aileron"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 p-4 bg-yellow/10 border border-yellow/20 rounded-xl2">
          <p className="text-sm text-text-secondary font-aileron">
            <span className="font-semibold text-yellow">💡 Note:</span> Your accounting data is automatically 
            saved to your personal Google Spreadsheet. All changes are synced in real-time.
          </p>
        </div>
      </motion.div>
    </AdminShell>
  );
}
