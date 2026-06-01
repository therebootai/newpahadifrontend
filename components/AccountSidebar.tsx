'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, 
  MapPin, 
  Heart, 
  Package, 
  Star, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { toast } from "sonner";

const menuItems = [
  {
    title: "Account Settings",
    items: [
      { label: "My Profile", href: "/account", icon: <User size={16} /> },
      { label: "Manage Addresses", href: "/account/addresses", icon: <MapPin size={16} /> },
    ]
  },
  {
    title: "My Activity",
    items: [
      { label: "My Orders", href: "/account/orders", icon: <Package size={16} /> },
      { label: "My Reviews", href: "/account/reviews", icon: <Star size={16} /> },
    ]
  }
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, logout } = useCustomerStore();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push('/');
  };

  return (
    <aside className="shrink-0 hidden md:block">
      <div className="bg-white rounded-2xl border border-[#CCCCCC]/30 overflow-hidden shadow-sm">
        {/* User Brief */}
        <div className="p-6 bg-[#222222] text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-base">
              {customer?.name?.[0] || customer?.phone?.[0] || 'U'}
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight truncate max-w-[180px]">
                {customer?.name || 'Customer'}
              </h2>
              <p className="text-white/60 text-[11px] font-medium truncate max-w-[180px]">
                {customer?.email || customer?.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-3 py-5">
          {menuItems.map((section, idx) => (
            <div key={idx} className={idx !== 0 ? "mt-6" : ""}>
              <h3 className="px-4 text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] mb-3">
                {section.title}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group ${
                        active 
                          ? "bg-[#F5F5F5] text-amber-500" 
                          : "text-[#666666] hover:bg-[#F5F5F5] hover:text-[#222222]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={active ? "text-amber-500" : "text-[#BBBBBB] group-hover:text-amber-500 transition-colors"}>
                          {item.icon}
                        </span>
                        <span className="text-sm font-bold tracking-tight">{item.label}</span>
                      </div>
                      <ChevronRight size={12} className={`transition-transform ${active ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          <button 
            onClick={handleLogout}
            className="w-full mt-6 flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#666666] hover:bg-amber-500/5 hover:text-amber-500 transition-all group border border-transparent hover:border-amber-500/10"
          >
            <LogOut size={16} className="text-[#BBBBBB] group-hover:text-amber-500" />
            <span className="text-sm font-bold tracking-tight">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
