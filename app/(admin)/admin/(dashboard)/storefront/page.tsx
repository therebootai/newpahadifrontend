'use client';

import { useState } from 'react';
import { LayoutDashboard, Image as ImageIcon, Video, MessageSquare } from 'lucide-react';
import BannerManager from './components/BannerManager';
import VideoManager from './components/VideoManager';
import PopupManager from './components/PopupManager';

export default function StorefrontPage() {
  const [activeTab, setActiveTab] = useState<'banners' | 'videos' | 'popup'>('banners');

  const tabs = [
    { id: 'banners', label: 'Hero Banners', icon: ImageIcon },
    { id: 'videos', label: 'Trending Videos', icon: Video },
    { id: 'popup', label: 'Welcome Popup', icon: MessageSquare },
  ] as const;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Storefront Management</h1>
          <p className="text-gray-500">Manage your homepage content and promotional popups</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full overflow-x-auto whitespace-nowrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-brand text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[600px]">
        {activeTab === 'banners' && <BannerManager />}
        {activeTab === 'videos' && <VideoManager />}
        {activeTab === 'popup' && <PopupManager />}
      </div>
    </div>
  );
}
