'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';

export default function HomePage() {
  const router = useRouter();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    // Check authentication status first
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    // Check if this is the initial load
    const hasLoadedBefore = sessionStorage.getItem('bookmate-loaded');
    
    if (!isAuthenticated) {
      // Not authenticated - go to login immediately without loading screen
      router.replace('/login');
    } else if (hasLoadedBefore) {
      // Authenticated and has loaded before - skip loading screen, go directly to dashboard
      router.replace('/dashboard');
    } else {
      // Authenticated but first load - show loading screen for 2 seconds, then navigate
      setShowLoading(true);
      const timer = setTimeout(() => {
        sessionStorage.setItem('bookmate-loaded', 'true');
        router.replace('/dashboard');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [router]);

  // Only show loading screen if authenticated and first time
  return showLoading ? <LoadingScreen /> : null;
}