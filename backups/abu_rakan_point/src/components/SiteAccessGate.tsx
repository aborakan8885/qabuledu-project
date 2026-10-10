import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, KeyRound, Eye, EyeOff, ShieldCheck, ArrowLeft, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cleanDigitsString } from '../utils/civilId';

interface SiteAccessGateProps {
  onUnlock: () => void;
  theme?: 'light' | 'dark';
}

const SITE_PASSCODE = '10685756280';

export default function SiteAccessGate({ onUnlock, theme = 'light' }: SiteAccessGateProps) {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus password input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isSuccess) return;

    setError('');
    const cleanedInput = cleanDigitsString(passcode) || passcode.trim();

    if (!cleanedInput) {
      setError('يرجى إدخال كلمة المرور');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    if (cleanedInput === SITE_PASSCODE) {
      setIsSuccess(true);
      setError('');
      try {
        localStorage.setItem('site_access_granted_v1', 'true');
        sessionStorage.setItem('site_access_granted_v1', 'true');
      } catch (_) {
        // ignore storage errors
      }
      setTimeout(() => {
        onUnlock();
      }, 700);
    } else {
      setTimeout(() => {
        setIsSubmitting(false);
        setError('كلمة المرور غير صحيحة! يرجى التأكد من الرقم وإعادة المحاولة.');
        inputRef.current?.focus();
      }, 350);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div 
      dir="rtl" 
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 font-sans ${
        isDark 
          ? 'bg-gradient-to-br from-[#06141f] via-[#092233] to-[#040e16] text-slate-100' 
          : 'bg-gradient-to-br from-[#0f4058] via-[#145a7c] to-[#0a3144] text-white'
      }`}
    >
      {/* Background Decorative Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Main Card */}
        <div className={`p-8 sm:p-10 rounded-[32px] shadow-2xl backdrop-blur-xl border transition-all duration-300 ${
          isDark
            ? 'bg-[#0a2335]/90 border-teal-500/20 shadow-black/60'
            : 'bg-white/95 text-slate-800 border-white/40 shadow-2xl shadow-cyan-950/40'
        }`}>
          {/* Header Icon */}
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div 
              animate={isSuccess ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
              className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-lg border transition-all ${
                isSuccess
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30'
                  : isDark
                    ? 'bg-gradient-to-br from-teal-500/20 to-emerald-500/10 text-teal-300 border-teal-500/30'
                    : 'bg-gradient-to-br from-[#145a7c] to-[#0a3144] text-white border-white/20 shadow-[#145a7c]/30'
              }`}
            >
              {isSuccess ? (
                <Unlock className="w-10 h-10 text-white animate-bounce" />
              ) : (
                <Lock className="w-10 h-10" />
              )}
            </motion.div>

            <span className={`inline-flex items-center gap-1.5 text-xs px-3.5 py-1 rounded-full font-bold mb-3 border ${
              isDark
                ? 'bg-teal-950/60 text-teal-300 border-teal-700/40'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              نظام محمي ومشفر
            </span>

            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight mb-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              بوابة الدخول للمنظومة
            </h1>
            
            <p className={`text-xs sm:text-sm font-medium max-w-xs leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-500'
            }`}>
              يرجى إدخال كلمة المرور المعتمدة للمتابعة والدخول إلى الموقع
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                htmlFor="site-gate-password" 
                className={`block text-xs font-bold mb-2 ${isDark ? 'text-teal-200' : 'text-slate-700'}`}
              >
                كلمة المرور
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <KeyRound className={`w-5 h-5 ${isDark ? 'text-teal-400/70' : 'text-slate-400'}`} />
                </div>

                <input
                  id="site-gate-password"
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="أدخل كلمة المرور..."
                  disabled={isSubmitting || isSuccess}
                  dir="ltr"
                  className={`w-full pr-12 pl-12 py-3.5 text-center text-lg font-mono tracking-widest rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-4 ${
                    error
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500 focus:ring-rose-500/20'
                      : isDark
                        ? 'bg-[#081a27] border-teal-700/40 text-white placeholder-slate-500 focus:border-teal-400 focus:ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#145a7c] focus:bg-white focus:ring-[#145a7c]/15'
                  }`}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center cursor-pointer transition-colors ${
                    isDark ? 'text-teal-400 hover:text-teal-200' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mt-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold text-right"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-right"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>تم التحقق بنجاح! جاري الانتقال للموقع...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isSuccess || !passcode}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 shadow-xl transition-all duration-300 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : isDark
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-teal-950/40 hover:shadow-teal-500/25'
                    : 'bg-gradient-to-r from-[#145a7c] to-[#0a3144] hover:from-[#176a92] hover:to-[#0f4058] text-white shadow-[#145a7c]/30 hover:shadow-[#145a7c]/40'
              }`}
            >
              {isSubmitting ? (
                <span>جاري التحقق...</span>
              ) : isSuccess ? (
                <>
                  <span>مرحباً بك</span>
                  <CheckCircle2 className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>الانتقال إلى الموقع</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-8 pt-5 border-t dark:border-teal-800/30 border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-teal-300/60 font-medium text-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>الإدارة العامة للتعليم • منظومة شؤون الطلاب والمدارس</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
