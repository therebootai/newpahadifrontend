'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, MapPin, Phone, User, Home, Globe } from 'lucide-react';
import { addressSchema, type AddressFormData } from '@/lib/validations/address';
import { z } from 'zod';
import { toast } from 'sonner';

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Address | null;
  isLoading?: boolean;
}

export default function AddressForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false
}: AddressFormProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName,
        phone: initialData.phone,
        addressLine1: initialData.addressLine1,
        addressLine2: initialData.addressLine2 || '',
        city: initialData.city,
        state: initialData.state,
        postalCode: initialData.postalCode,
        country: initialData.country,
        isDefault: initialData.isDefault
      });
    } else {
      setFormData({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof AddressFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = addressSchema.parse(formData);
      await onSubmit(validatedData);
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: any = {};
        const issues = error.issues || [];
        issues.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        // Backend errors or other issues are handled by the parent
        console.error("Form submission error:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8 flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="px-6 py-5 border-b border-[#CCCCCC]/20 flex items-center justify-between bg-[#F5F5F5]/50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#222222]">{initialData ? 'Edit Address' : 'Add New Address'}</h2>
            <p className="text-[11px] font-bold text-[#BBBBBB] uppercase tracking-widest mt-0.5">
              Enter delivery details
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
            <X size={20} className="text-[#666666]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB]" />
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Receiver's name"
                    className={`w-full bg-[#F5F5F5] border-2 rounded-xl py-2.5 pl-11 pr-4 font-bold text-[#222222] text-sm focus:bg-white transition-all outline-none ${
                      errors.fullName ? "border-red-500/50" : "border-transparent focus:border-amber-500/30"
                    }`}
                  />
                </div>
                {errors.fullName && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.fullName}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB]" />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={`w-full bg-[#F5F5F5] border-2 rounded-xl py-2.5 pl-11 pr-4 font-bold text-[#222222] text-sm focus:bg-white transition-all outline-none ${
                      errors.phone ? "border-red-500/50" : "border-transparent focus:border-amber-500/30"
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Address Line 1 */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">Flat, House no., Building, Company, Apartment</label>
              <div className="relative">
                <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB]" />
                <input
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="House no., Building, etc."
                  className={`w-full bg-[#F5F5F5] border-2 rounded-xl py-2.5 pl-11 pr-4 font-bold text-[#222222] text-sm focus:bg-white transition-all outline-none ${
                    errors.addressLine1 ? "border-red-500/50" : "border-transparent focus:border-amber-500/30"
                  }`}
                />
              </div>
              {errors.addressLine1 && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.addressLine1}</p>}
            </div>

            {/* Address Line 2 */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">Area, Street, Sector, Village</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB]" />
                <input
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  placeholder="Area, Street, etc."
                  className="w-full bg-[#F5F5F5] border-2 border-transparent rounded-xl py-2.5 pl-11 pr-4 font-bold text-[#222222] text-sm focus:bg-white focus:border-amber-500/30 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* City */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">City</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  className={`w-full bg-[#F5F5F5] border-2 rounded-xl py-2.5 px-4 font-bold text-[#222222] text-sm focus:bg-white transition-all outline-none ${
                    errors.city ? "border-red-500/50" : "border-transparent focus:border-amber-500/30"
                  }`}
                />
                {errors.city && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.city}</p>}
              </div>

              {/* Pincode */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">Pincode</label>
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="400001"
                  className={`w-full bg-[#F5F5F5] border-2 rounded-xl py-2.5 px-4 font-bold text-[#222222] text-sm focus:bg-white transition-all outline-none ${
                    errors.postalCode ? "border-red-500/50" : "border-transparent focus:border-amber-500/30"
                  }`}
                />
                {errors.postalCode && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.postalCode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* State */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">State</label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  className={`w-full bg-[#F5F5F5] border-2 rounded-xl py-2.5 px-4 font-bold text-[#222222] text-sm focus:bg-white transition-all outline-none ${
                    errors.state ? "border-red-500/50" : "border-transparent focus:border-amber-500/30"
                  }`}
                />
                {errors.state && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.state}</p>}
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">Country</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB]" />
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full bg-[#F5F5F5] border-2 border-transparent rounded-xl py-2.5 pl-11 pr-4 font-bold text-[#222222] text-sm focus:bg-white focus:border-amber-500/30 transition-all outline-none appearance-none"
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center gap-3 pt-2 pb-4">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="w-5 h-5 rounded-lg border-2 border-[#CCCCCC] text-amber-500 focus:ring-amber-500/30 cursor-pointer"
              />
              <label htmlFor="isDefault" className="text-sm font-bold text-[#666666] cursor-pointer select-none">
                Make this my default shipping address
              </label>
            </div>
          </div>

          {/* Footer Buttons - Fixed */}
          <div className="p-6 border-t border-[#CCCCCC]/20 flex gap-3 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border-2 border-[#CCCCCC]/20 rounded-2xl text-[12px] uppercase tracking-widest font-bold text-[#666666] hover:bg-[#F5F5F5] transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-4 bg-[#222222] text-white rounded-2xl text-[12px] uppercase tracking-widest font-bold hover:bg-amber-500 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Address'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
