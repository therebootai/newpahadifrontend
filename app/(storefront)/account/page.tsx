'use client';

import { useState, useEffect } from "react";
import { User, Mail, Phone, Loader2, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { toast } from "sonner";

export default function ProfilePage() {
  const { customer, isLoading, fetchMe, updateProfile, sendMobileChangeOTP, verifyMobileChange } = useCustomerStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });

  const [phoneData, setPhoneData] = useState({
    newPhone: "",
    otp: ""
  });

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || ""
      });
    }
  }, [customer]);

  const handleUpdate = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleSendOtp = async () => {
    if (phoneData.newPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (phoneData.newPhone === customer?.phone) {
      toast.error("New phone number must be different");
      return;
    }

    try {
      await sendMobileChangeOTP(phoneData.newPhone);
      setShowOtpInput(true);
      toast.success("OTP sent to your new phone number");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (phoneData.otp.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    try {
      await verifyMobileChange(phoneData.newPhone, phoneData.otp);
      toast.success("Phone number updated successfully");
      setIsChangingPhone(false);
      setShowOtpInput(false);
      setPhoneData({ newPhone: "", otp: "" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const cancelPhoneChange = () => {
    setIsChangingPhone(false);
    setShowOtpInput(false);
    setPhoneData({ newPhone: "", otp: "" });
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222] tracking-tight mb-1">
            My Profile
          </h1>
          <p className="text-[12px] font-medium text-[#666666] uppercase tracking-wider">
            Manage your personal information
          </p>
        </div>
        {!isChangingPhone && (
          <button 
            onClick={handleUpdate}
            disabled={isLoading}
            className="bg-[#222222] text-white px-5 py-2 rounded-full font-bold text-[12px] uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && !showOtpInput ? <Loader2 size={14} className="animate-spin" /> : (isEditing ? "Save Changes" : "Edit Profile")}
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB]" />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing || isLoading || isChangingPhone}
                placeholder="Enter your name"
                className="w-full bg-[#F5F5F5] border-transparent rounded-xl py-2.5 pl-11 pr-4 font-bold text-[#222222] text-sm focus:bg-white focus:border-amber-500/30 transition-all disabled:opacity-70"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB]" />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing || isLoading || isChangingPhone}
                placeholder="Enter your email"
                className="w-full bg-[#F5F5F5] border-transparent rounded-xl py-2.5 pl-11 pr-4 font-bold text-[#222222] text-sm focus:bg-white focus:border-amber-500/30 transition-all disabled:opacity-70"
              />
            </div>
          </div>
        </div>

        {/* Phone Section - Special Handling */}
        <div className="pt-6 border-t border-[#CCCCCC]/20">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em] px-1">Phone Number</label>
            {!isChangingPhone ? (
              <button 
                onClick={() => setIsChangingPhone(true)}
                className="text-[11px] font-bold text-amber-500 uppercase tracking-widest hover:underline"
              >
                Change Number
              </button>
            ) : (
              <button 
                onClick={cancelPhoneChange}
                className="text-[#BBBBBB] hover:text-[#222222] transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {!isChangingPhone ? (
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB]" />
              <input 
                type="tel" 
                value={customer?.phone || ""}
                disabled
                className="w-full bg-[#F5F5F5] border-transparent rounded-xl py-2.5 pl-11 pr-4 font-bold text-[#222222] text-sm cursor-not-allowed"
              />
            </div>
          ) : (
            <div className="space-y-4 bg-[#F5F5F5] p-5 rounded-2xl border border-[#CCCCCC]/20">
              {!showOtpInput ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB]" />
                    <input 
                      type="tel" 
                      maxLength={10}
                      value={phoneData.newPhone}
                      onChange={(e) => setPhoneData({ ...phoneData, newPhone: e.target.value.replace(/\D/g, "") })}
                      placeholder="Enter new 10-digit number"
                      className="w-full bg-white border-transparent rounded-xl py-2.5 pl-11 pr-4 font-bold text-[#222222] text-sm focus:border-amber-500/30 transition-all outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleSendOtp}
                    disabled={isLoading || phoneData.newPhone.length !== 10}
                    className="w-full bg-[#222222] text-white py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : "Send Verification OTP"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <p className="text-[12px] font-medium text-[#666666]">OTP sent to <span className="font-bold text-[#222222]">+91 {phoneData.newPhone}</span></p>
                  </div>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={phoneData.otp}
                    onChange={(e) => setPhoneData({ ...phoneData, otp: e.target.value.replace(/\D/g, "") })}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-white border-transparent rounded-xl py-3 px-4 font-bold text-[#222222] text-lg tracking-[0.5em] text-center focus:border-amber-500/30 transition-all outline-none"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowOtpInput(false)}
                      className="flex-1 bg-white border border-[#CCCCCC]/30 text-[#222222] py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#F5F5F5] transition-all"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleVerifyOtp}
                      disabled={isLoading || phoneData.otp.length !== 6}
                      className="flex-[2] bg-[#222222] text-white py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : "Verify & Update"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
