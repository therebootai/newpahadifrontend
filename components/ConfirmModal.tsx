'use client';

import React from 'react';
import { Trash2, AlertCircle, Loader2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'primary';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = 'primary'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-[#222222]">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-[#F5F5F5] rounded-lg transition-colors">
              <X size={20} className="text-[#BBBBBB]" />
            </button>
          </div>
          
          <p className="text-[#666666] text-sm mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3">
            <button 
              disabled={isLoading}
              onClick={onClose}
              className="flex-1 py-3 border border-[#CCCCCC]/30 rounded-xl text-[12px] uppercase tracking-widest font-bold text-[#222222] hover:bg-[#F5F5F5] transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button 
              disabled={isLoading}
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-xl text-[12px] uppercase tracking-widest font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                variant === 'danger' 
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" 
                  : "bg-[#222222] hover:bg-[#333333] shadow-gray-200"
              }`}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
