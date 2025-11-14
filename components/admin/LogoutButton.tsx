'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Call logout API to clear server-side session cookie
      await fetch('/api/auth/logout-session', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      // Clear client-side storage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('username');

      // Redirect to login page
      router.push('/login');
      router.refresh(); // Force a refresh to clear any cached data
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even if API call fails
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('username');
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center px-4 py-2 border-2 border-border rounded-xl2 shadow-sm text-sm font-medium text-secondary bg-card hover:bg-surface-2 hover:text-yellow hover:border-yellow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow transition-all font-aileron"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </button>
  );
}
