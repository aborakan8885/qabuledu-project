/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Languages, Home, Sun, Moon, ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import { Language, AppConfig } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { formatPrincipalName, formatPrincipalGreeting } from '../utils/civilId';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'survey' | 'dashboard';
  onTabChange: (tab: 'survey' | 'dashboard') => void;
  isOnline?: boolean;
  onToggleOnline?: () => void;
  config: AppConfig;
  unsyncedCount?: number;
  userRole: 'portal' | 'parent' | 'admin';
  onBackToPortal?: () => void;
  onGoBack?: () => void;
  showHome?: boolean;
  canGoBack?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  principalSession?: {
    principalName: string;
    schoolName: string;
    schoolCode: string;
  } | null;
}

export default function Header({
  currentLang,
  onLanguageChange,
  activeTab,
  onTabChange,
  isOnline,
  onToggleOnline,
  config,
  unsyncedCount,
  userRole,
  onBackToPortal,
  onGoBack,
  showHome = false,
  canGoBack = false,
  theme,
  onToggleTheme,
  principalSession
}: HeaderProps) {
  const t = TRANSLATIONS[currentLang];
  const isRtl = currentLang === 'ar';
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-50 w-full bg-[#023d38] border-b border-teal-800/40 shadow-xl text-white">
      {/* Top multi-color gradient line (Cyan -> Green) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#179bad] via-[#1bb3a2] via-[#28c792] to-[#60e090]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1 sm:py-1.5">
        {/* Principal Welcome Banner (If Logged In) */}
        {principalSession && (
          <div className="mb-2 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-black text-white">
                {formatPrincipalGreeting(principalSession.principalName, isRtl)} - {isRtl ? `مدرسة: ${principalSession.schoolName}` : `School: ${principalSession.schoolName}`}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-1 md:gap-3">
          
          {/* 1. Right Side (Text Card: Kingdom, Education Directorate, Educational Affairs) */}
          <div className="flex flex-col items-center text-center w-full md:w-auto shrink-0">
            <div className="flex flex-col items-center justify-center text-center px-5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
              <span className="font-extrabold text-[10px] sm:text-[11px] tracking-wide text-teal-100">
                {isRtl ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}
              </span>
              <span className="text-white font-black text-xs sm:text-sm leading-tight mt-0.5 drop-shadow-xs">
                {isRtl ? 'الإدارة العامة للتعليم بالمدينة المنورة' : 'General Department of Education in Madinah'}
              </span>
              <span className="font-extrabold text-[10px] sm:text-[11px] leading-none mt-0.5 text-teal-200">
                {isRtl ? 'الشؤون التعليمية' : 'Educational Affairs'}
              </span>
            </div>
          </div>

          {/* 2. Center (Ministry of Education Logo in rounded translucent frame) */}
          <div className="flex items-center justify-center shrink-0 w-full md:w-auto my-0.5 md:my-0">
            <div className="flex items-center justify-center shrink-0 p-2 sm:p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png"
                alt="Ministry of Education Logo"
                referrerPolicy="no-referrer"
                className="h-10 sm:h-12 w-auto object-contain transition-all duration-300 hover:scale-[1.02] filter brightness-110 drop-shadow-sm"
              />
            </div>
          </div>

          {/* 3. Left Side (Admission Unit Badge, Theme & Language Toggles) */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-center md:justify-end shrink-0">
            {/* Admission Unit Badge */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#179bad] via-[#218caa] to-[#2eb882] text-white font-black text-[11px] sm:text-xs rounded-full shadow-md border border-white/30 shrink-0">
              <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse shadow-xs" />
              <span>{isRtl ? 'وحدة القبول' : 'Admission Unit'}</span>
            </span>

            {/* Language Switcher */}
            <button
              onClick={() => onLanguageChange(currentLang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-xs"
              id="header-language-toggle"
            >
              <span>{currentLang === 'ar' ? 'English' : 'العربية'}</span>
              <Languages className="w-3.5 h-3.5 text-teal-200" />
            </button>

            {/* Real-time Live Sync Indicator */}
            <div 
              title={isRtl ? 'المزامنة اللحظية المباشرة نشطة تلقائياً' : 'Live Real-time Sync Active'}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold shadow-xs select-none"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{isRtl ? 'بث لحظي' : 'Live'}</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={isDark ? (isRtl ? 'الوضع الفاتح' : 'Light Mode') : (isRtl ? 'الوضع الداكن' : 'Dark Mode')}
              className="flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 text-amber-300 shadow-xs"
              id="header-theme-toggle"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-amber-200" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

