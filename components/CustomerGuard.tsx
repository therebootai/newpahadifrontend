'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerStore } from '@/lib/store/useCustomerStore';
import { Loader2 } from 'lucide-react';

interface CustomerGuardProps {
  children: React.ReactNode;
}

export default function CustomerGuard({ children }: CustomerGuardProps) {
  const { isAuthenticated, isLoading } = useCustomerStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  // Wait for Zustand to hydrate the store from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, isLoading, router]);

  if (!isHydrated || (!isAuthenticated && isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
        <p className="text-[#666666] font-medium">Checking authentication...</p>
      </div>
    );
  }

  // If not authenticated and we're about to redirect, show loader
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
        <p className="text-[#666666] font-medium">Redirecting to login...</p>
      </div>
    );
  }

  return <>{children}</>;
}
