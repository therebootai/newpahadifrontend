'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileQuestion, ChevronLeft, LayoutDashboard } from 'lucide-react';

export default function AdminNotFound() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const checkHistory = () => {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        setCanGoBack(true);
      }
    };
    
    // Use a small delay to avoid synchronous state update in effect
    const timeout = setTimeout(checkHistory, 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
      {/* 404 Illustration/Icon */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-brand/10 flex items-center justify-center text-brand-dark animate-pulse">
          <FileQuestion size={64} />
        </div>
        <div className="absolute -top-2 -right-2 bg-[#FF6B6B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          404
        </div>
      </div>

      <h1 className="text-3xl font-bold text-primary mb-3">Page Not Found</h1>
      <p className="text-muted text-base max-w-md mb-10 leading-relaxed">
        Oops! The page you&apos;re looking for doesn&apos;t exist, has been removed, or moved to another URL.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={() => router.back()}
          disabled={!canGoBack}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto justify-center ${
            canGoBack 
              ? 'bg-surface border border-border text-primary hover:border-brand hover:bg-background active:scale-95' 
              : 'bg-background text-muted cursor-not-allowed border-transparent'
          }`}
        >
          <ChevronLeft size={18} />
          Go Back
        </button>

        <Link
          href="/admin/orders"
          className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95 w-full sm:w-auto justify-center"
        >
          <LayoutDashboard size={18} />
          Return to Orders
        </Link>
      </div>

    </div>
  );
}
