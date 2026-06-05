'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import logopc from "@/public/logo pc.svg";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Ticket,
  Grid3X3,
  Building2,
  Warehouse,
  List,
  Star,
  ExternalLink,
  ChevronDown,
  Menu,
  ChevronLeft,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLogoutMutation } from '@/lib/hooks/useAdminAuth';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const mainMenu: NavItem[] = [
  { label: 'Order Management', href: '/admin/orders', icon: <ShoppingCart size={20} /> },
  { label: 'Customers', href: '/admin/customers', icon: <Users size={20} /> },
  { label: 'Coupon Code', href: '/admin/coupons', icon: <Ticket size={20} /> },
  { label: 'Categories', href: '/admin/categories', icon: <Grid3X3 size={20} /> },
  { label: 'Brand', href: '/admin/brands', icon: <Building2 size={20} /> },
  { label: 'Warehouses', href: '/admin/warehouses', icon: <Warehouse size={20} /> },
  { label: 'Storefront', href: '/admin/storefront', icon: <LayoutDashboard size={20} /> },
];

const productMenu: NavItem[] = [
  { label: 'Product list', href: '/admin/products/list', icon: <List size={20} /> },
  { label: 'Product Reviews', href: '/admin/products/reviews', icon: <Star size={20} /> },
];

const adminMenu: NavItem[] = [
  { label: 'User', href: '/admin/users', icon: <Users size={20} /> },
];

import { useSidebarStore } from '@/lib/store/useSidebarStore';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logoutMutation = useLogoutMutation();
  const { isMobileOpen, setMobileOpen } = useSidebarStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Product: true,
    Admin: true,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSection = (section: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedSections((prev) => ({ ...prev, [section]: true }));
      return;
    }
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard' || pathname === '/admin';
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => (
    <Link
      key={item.label}
      href={item.href || '#'}
      title={isCollapsed ? item.label : undefined}
      onClick={() => setMobileOpen(false)}
      className={`sidebar-menu-item flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
        isActive(item.href) ? 'bg-brand/10 text-brand-dark' : 'text-primary hover:bg-background'
      } ${isCollapsed ? 'justify-center px-2' : ''}`}
    >
      <div className="shrink-0">{item.icon}</div>
      {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{item.label}</span>}
    </Link>
  );

  const renderSection = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      <button
        onClick={() => toggleSection(title)}
        className={`flex items-center justify-between w-full px-4 mb-2 text-xs font-medium text-muted uppercase tracking-wider hover:text-brand transition-colors ${
          isCollapsed ? 'justify-center px-0' : ''
        }`}
      >
        {isCollapsed ? (
          <div className="w-6 h-px bg-border my-2" />
        ) : (
          <>
            {title}
            <ChevronDown
              size={14}
              className={`transition-transform ${expandedSections[title] ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>
      {(expandedSections[title] || isCollapsed) && (
        <nav className="space-y-1">{items.map(renderNavItem)}</nav>
      )}
    </div>
  );

  return (
    <aside
      className={`h-screen bg-surface border-r border-border transition-all duration-300 ease-in-out z-50
        fixed inset-y-0 left-0 lg:sticky lg:top-0
        ${isMobileOpen ? 'flex translate-x-0' : 'hidden lg:flex -translate-x-full lg:translate-x-0'}
        flex-col
        ${isCollapsed ? 'lg:w-20' : 'lg:w-65'}
        w-65
      `}
    >
      {/* Logo & Toggle */}
      <div className={`px-6 py-5 flex items-center justify-between ${isCollapsed ? 'px-4 justify-center' : ''}`}>
        {!isCollapsed && (
          <Link href="/admin" className="flex items-center">
            <Image src={logopc} alt="Pahadi Collections" width={140} height={40} className="h-8 w-auto" priority />
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-background text-muted transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {/* Main Menu */}
        <div className="mb-6">
          {!isCollapsed ? (
            <p className="px-4 mb-2 text-xs font-medium text-muted uppercase tracking-wider">
              Main Menu
            </p>
          ) : (
            <div className="flex justify-center mb-2">
              <div className="w-6 h-px bg-border" />
            </div>
          )}
          <nav className="space-y-1">{mainMenu.map(renderNavItem)}</nav>
        </div>

        {/* Product Section */}
        {renderSection('Product', productMenu)}

        {/* Admin Section */}
        {renderSection('Admin', adminMenu)}
      </nav>


      {/* Footer / Profile */}
      <div className={`py-4 border-t border-border ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <div className={`bg-brand rounded-xl transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center mb-0' : 'mb-3'}`}>
            <div className="w-10 h-10 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden flex-1">
                <p className="text-white text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                <p className="text-white/70 text-xs truncate">{user?.email || user?.phone || 'admin@mscliq.com'}</p>
              </div>
            )}
            {!isCollapsed && (
              <button 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                title="Logout"
              >
                {logoutMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              </button>
            )}
          </div>
          {!isCollapsed ? (
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full bg-white text-brand text-sm font-medium py-2.5 rounded-lg hover:bg-background transition-colors"
            >
              Your Shop
              <ExternalLink size={14} />
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="w-full aspect-square flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50"
              title="Logout"
            >
              {logoutMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
