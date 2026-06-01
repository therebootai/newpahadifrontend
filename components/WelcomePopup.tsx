'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useStorefrontData } from '@/lib/hooks/useStorefront';
import Link from 'next/link';
import Image from 'next/image';

export default function WelcomePopup() {
  const { data } = useStorefrontData();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Check if we have an active popup from the data
    if (!data?.popup) return;

    // 2. Check if the user has already seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
    
    if (!hasSeenPopup) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [data?.popup]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenWelcomePopup', 'true');
  };

  if (!isOpen || !data?.popup) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-gray-800 transition-all"
        >
          <X size={20} />
        </button>

        {data.popup.link ? (
          <Link href={data.popup.link} onClick={handleClose}>
            <div className="relative aspect-square w-full">
              <Image
                src={data.popup.image.url}
                alt={data.popup.title}
                className="w-full h-full object-cover"
                fill
              />
            </div>
          </Link>
        ) : (
          <div className="relative aspect-square w-full">
            <Image
              src={data.popup.image.url}
              alt={data.popup.title}
              className="w-full h-full object-cover"
              fill
            />
          </div>
        )}

        <div className="p-6 text-center">
           <h3 className="text-xl font-bold text-gray-900">{data.popup.title}</h3>
           {data.popup.link && (
             <Link 
               href={data.popup.link} 
               onClick={handleClose}
               className="mt-4 inline-block px-8 py-3 bg-brand rounded-full font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
             >
               Explore Now
             </Link>
           )}
        </div>
      </div>
    </div>
  );
}
