'use client';

import { useAuthStore } from '@/lib/store/useAuthStore';
import { useCustomerStore } from '@/lib/store/useCustomerStore';
import { useRouter, usePathname, notFound } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/fetchers';

/**
 * Hybrid Auth Strategy:
 * 1. Local Storage (Zustand): Immediate UI feedback (Show user name/avatar).
 * 2. Backend (/users/me): Source of truth. Run once per session/refresh.
 * 3. Axios Interceptor: Security during navigation (Handles 401s automatically).
 * 4. RBAC: Strict requirement - Must be logged in as Customer (OTP) with Admin/Staff role 
 *    before even seeing the Admin Login page.
 */

// A simple hook to detect hydration
function useIsHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated: isAdminAuth, user: adminUser, token, setAuth, logout } = useAuthStore();
  const { isAuthenticated: isCustomerAuth, customer } = useCustomerStore();
  
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useIsHydrated();
  
  const [isReady, setIsReady] = useState(false);
  const hasValidated = useRef(false);

  // 1. Session Validation (Source of Truth)
  // Runs only ONCE per page refresh
  useEffect(() => {
    if (!isHydrated || hasValidated.current) return;

    const validateSession = async () => {
      // Only call backend if we think we are authenticated
      if (isAdminAuth && token) {
        try {
          // Verify with backend
          const response = await adminApi.get('/users/me');
          const userData = response.data.data;
          
          // Refresh user data in store (ensure we have latest roles/status)
          setAuth({ ...userData, id: userData._id }, token);
        } catch (error) {
          console.error('Admin session validation failed:', error);
          if (isAdminAuth) logout();
        }
      }
      
      hasValidated.current = true;
      setIsReady(true);
    };

    validateSession();
  }, [isHydrated, isAdminAuth, token, setAuth, logout]);

  // 2. Redirect Logic (Optimized)
  const isLoginPage = pathname === '/admin/login' || pathname.startsWith('/admin/login/');

  useEffect(() => {
    if (!isHydrated || !isReady) return;

    // Check if they are allowed to even be in the admin area
    const isAllowedAccess = isCustomerAuth && (customer?.role === 'admin' || customer?.role === 'staff');
    
    if (!isAllowedAccess) {
      // Return handled in render to show notFound()
      return;
    }

    if (isAdminAuth) {
      if (isLoginPage) {
        router.replace('/admin/orders');
      }
    } else {
      if (!isLoginPage) {
        router.replace('/admin/login');
      }
    }
  }, [isAdminAuth, isCustomerAuth, customer?.role, isLoginPage, isHydrated, isReady, router]);

  // 3. Strict Access Control (Security Step 2)
  // If not a recognized admin/staff customer, show 404 for EVERYTHING under /admin
  const isAllowedAccess = isCustomerAuth && (customer?.role === 'admin' || customer?.role === 'staff');
  
  if (isHydrated && isReady && !isAllowedAccess) {
    notFound();
    return null;
  }

  // 4. Content Visibility (The Gatekeeper)
  // We only show children if:
  // - We are hydrated and ready
  // - It's the login page OR we have a valid password-based admin session
  const canShowContent = isHydrated && isReady && (isLoginPage || isAdminAuth);

  return (
    <>
      {!canShowContent ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-brand animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-brand rounded-full animate-ping" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-1">
                Pahadi Collections Secure
              </p>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest animate-pulse">
                {!isReady ? 'Verifying Session...' : 'Redirecting to Login...'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
}
