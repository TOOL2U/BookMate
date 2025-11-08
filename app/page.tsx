'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is the initial load
    const hasLoadedBefore = sessionStorage.getItem('bookmate-loaded');
    
    if (hasLoadedBefore) {
      // Skip loading screen, go directly to dashboard
      router.push('/dashboard');
    } else {
      // Show loading screen for 2 seconds, then navigate
      const timer = setTimeout(() => {
        sessionStorage.setItem('bookmate-loaded', 'true');
        router.push('/dashboard');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [router]);

  return <LoadingScreen />;
}

