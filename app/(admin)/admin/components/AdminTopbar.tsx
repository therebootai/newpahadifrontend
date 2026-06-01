'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, LogOut, Loader2, Menu } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLogoutMutation } from '@/lib/hooks/useAdminAuth';
import { useSidebarStore } from '@/lib/store/useSidebarStore';

interface Notification {
  id: number;
  text: string;
}

export default function AdminTopbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logoutMutation = useLogoutMutation();
  const { toggleMobile } = useSidebarStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Mock notifications
  const notifications: Notification[] = [
    // { id: 1, text: 'New order received #1234' },
    // { id: 2, text: 'Customer support request' },
  ];

  const getPageTitle = () => {
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    if (!lastPart || lastPart === 'admin') return 'Dashboard';
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMobile}
          className="lg:hidden p-2 hover:bg-background rounded-lg text-muted transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Page Title */}
        <h2 className="text-lg md:text-xl font-semibold text-primary truncate max-w-[150px] md:max-w-none">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-6">
        {/* Search - Hidden on mobile, shown on md+ */}
        <div className="relative group hidden md:block">
          <input
            type="text"
            placeholder="Search..."
            className="w-[200px] lg:w-[300px] bg-background border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-brand transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        </div>

        {/* Search Icon for mobile */}
        <button className="md:hidden p-2 text-muted hover:bg-background rounded-full transition-colors">
          <Search size={20} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onMouseEnter={() => setShowNotifications(true)}
            className="p-2 text-muted hover:bg-background rounded-full transition-colors relative"
          >
            <Bell size={22} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FF6B6B] border-2 border-surface rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-lg py-4 z-50 animate-in fade-in zoom-in duration-200"
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div className="px-4 mb-3 flex items-center justify-between">
                <h3 className="font-bold text-sm text-primary">Notifications</h3>
                <span className="text-xs text-muted">{notifications.length} New</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-muted text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-background transition-colors cursor-pointer border-b border-background last:border-0">
                      <p className="text-sm text-primary">{n.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1 hover:bg-background rounded-full transition-colors"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-brand flex items-center justify-center">
              <span className="text-white font-bold">{user?.name?.charAt(0) || 'A'}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="w-full px-4 py-2.5 text-left text-sm text-[#FF6B6B] hover:bg-background flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {logoutMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
