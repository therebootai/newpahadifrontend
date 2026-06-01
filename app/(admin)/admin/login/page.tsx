'use client';

import { useState } from 'react';
import { 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useLoginMutation } from '@/lib/hooks/useAdminAuth';

export default function AdminLoginPage() {
  const loginMutation = useLoginMutation();
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ phone: '', password: '' });

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'phone') {
      if (!value) error = 'Phone number is required';
      else if (value.length < 10) error = 'Please enter a valid 10-digit phone number';
    }
    if (name === 'password') {
      if (!value) error = 'Password is required';
      else if (value.length < 6) error = 'Password must be at least 6 characters';
    }
    setFieldErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(value);
    if (fieldErrors.phone) validateField('phone', value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (fieldErrors.password) validateField('password', value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isPhoneValid = validateField('phone', phone);
    const isPasswordValid = validateField('password', password);

    if (!isPhoneValid || !isPasswordValid) return;

    loginMutation.mutate({ phone, password });
  };

  const errorMessage = loginMutation.error 
    ? (loginMutation.error as any).response?.data?.message || 'We have fetching some issue, please try again later'
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 text-brand mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Admin Portal</h1>
          <p className="text-muted text-sm">Welcome back! Please enter your details.</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface p-8 rounded-3xl border border-border shadow-xl shadow-brand/5">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="w-1 h-1 rounded-full bg-red-600" />
                {errorMessage}
              </div>
            )}

            <div className="space-y-4">
              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block ml-1">Phone Number</label>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.phone ? 'text-red-500' : 'text-muted group-focus-within:text-brand'}`}>
                    <Phone size={18} />
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={() => validateField('phone', phone)}
                    placeholder="9876543210"
                    className={`w-full bg-background border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none transition-all font-medium ${fieldErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'}`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-[10px] text-red-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block ml-1">Password</label>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-red-500' : 'text-muted group-focus-within:text-brand'}`}>
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => validateField('password', password)}
                    placeholder="••••••••"
                    className={`w-full bg-background border rounded-xl py-3.5 pl-12 pr-12 text-sm focus:outline-none transition-all font-medium ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'}`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[10px] text-red-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.password}</p>
                )}
              </div>
            </div>

            <button 
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-4 bg-brand text-white rounded-2xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loginMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
              Secured by Reboot Auth System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
