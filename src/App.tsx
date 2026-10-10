/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Header from './components/Header';
import SurveyForm from './components/SurveyForm';
// import Dashboard from './components/Dashboard';
import Portal from './components/Portal';
import ErrorBoundary from './components/ErrorBoundary';
import ContactFeedbackModal from './components/ContactFeedbackModal';
import InquiriesModal from './components/InquiriesModal';
import SiteAccessGate from './components/SiteAccessGate';
import { Language, SurveyResponse, AppConfig, EmailLog, SystemIntegrationLog, PrincipalReport, SchoolItem, BeneficiaryFeedback, BeneficiaryInquiry } from './types';
import { sendOfficialEmail } from './utils/emailService';
import { getSafeTranslation } from './utils/translationHelper';
import {
  saveSurveysToStorage,
  loadSurveysFromStorage,
  clearAllSurveysFromStorage,
  savePrincipalReportsToStorage,
  loadPrincipalReportsFromStorage,
  saveSchoolsToStorage,
  loadSchoolsFromStorage,
  saveInquiriesToStorage,
  loadInquiriesFromStorage,
  syncDataWithServer,
  fetchServerSyncedData
} from './utils/storageEngine';
import {
  INITIAL_CONFIG,
  INITIAL_SURVEYS,
  INITIAL_EMAIL_LOGS,
  INITIAL_INTEGRATION_LOGS,
  INITIAL_SCHOOLS,
  TRANSLATIONS
} from './data/mockData';
import { processSurveysInBatchAsync } from './utils/batchProcessor';
import { ShieldCheck, Wifi, Info, CheckCircle2, ChevronRight, HelpCircle, Cpu, Zap, Activity, MessageSquareHeart, Home, RotateCcw, Loader2, Code2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Dashboard = lazy(() => import('./components/Dashboard'));

export default function App() {
  // Application Language state (Default to Arabic as requested)
  const [currentLang, setCurrentLang] = useState<Language>('ar');

  // Theme state ('light' or 'dark') aligned with the Ministry of Education visual identity
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const cached = localStorage.getItem('app_theme');
    return (cached === 'dark' || cached === 'light') ? cached : 'light';
  });

  // Site Gate Security: Passcode Protection (10685756280)
  const [isSiteUnlocked, setIsSiteUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      sessionStorage.getItem('site_access_granted_v1') === 'true' ||
      localStorage.getItem('site_access_granted_v1') === 'true'
    );
  });

  const handleLockSite = () => {
    try {
      sessionStorage.removeItem('site_access_granted_v1');
      localStorage.removeItem('site_access_granted_v1');
    } catch (_) {}
    setIsSiteUnlocked(false);
  };

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Application views / tabs / roles: 'portal' (Unified Selection Portal), 'parent' (Beneficiary / Parent Survey Form), or 'admin' (Admission Officer / System Admin)
  const [userRole, setUserRoleState] = useState<'portal' | 'parent' | 'admin'>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('print-report=true')) {
      return 'admin';
    }
    return 'portal';
  });

  // Portal view state & Modal state
  const [portalView, setPortalViewState] = useState<'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard' | 'admin-login'>('selection');
  const [showAgeModal, setShowAgeModalState] = useState<boolean>(false);
  const [principalSession, setPrincipalSession] = useState<{
    schoolCode: string;
    schoolName: string;
    principalName: string;
    mobile?: string;
  } | null>(null);

  // Navigation History Stack
  type NavState = {
    userRole: 'portal' | 'parent' | 'admin';
    portalView: 'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard' | 'admin-login';
    showAgeModal: boolean;
  };
  const historyStackRef = useRef<NavState[]>([]);

  const pushNavState = (
    newRole: 'portal' | 'parent' | 'admin',
    newPortalView: 'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard' | 'admin-login' = portalView,
    newAgeModal: boolean = false
  ) => {
    const currentState: NavState = { userRole, portalView, showAgeModal };
    if (
      currentState.userRole !== newRole ||
      currentState.portalView !== newPortalView ||
      currentState.showAgeModal !== newAgeModal
    ) {
      historyStackRef.current.push(currentState);
    }
    setUserRoleState(newRole);
    setPortalViewState(newPortalView);
    setShowAgeModalState(newAgeModal);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const setUserRole = (role: 'portal' | 'parent' | 'admin') => {
    pushNavState(role, role === 'portal' ? 'selection' : portalView, false);
  };

  const handlePortalViewChange = (newView: 'selection' | 'parent-choices' | 'parent-track' | 'principal-login' | 'principal-dashboard' | 'admin-login') => {
    pushNavState('portal', newView, false);
  };

  const handleAgeModalChange = (show: boolean) => {
    pushNavState('portal', portalView, show);
  };

  const handleGoBack = () => {
    if (showAgeModal) {
      setShowAgeModalState(false);
      return;
    }
    if (historyStackRef.current.length > 0) {
      const previous = historyStackRef.current.pop()!;
      setUserRoleState(previous.userRole);
      setPortalViewState(previous.portalView);
      setShowAgeModalState(previous.showAgeModal);
    } else {
      // Fallback if stack is empty
      if (userRole === 'parent' || userRole === 'admin') {
        setUserRoleState('portal');
        setPortalViewState('parent-choices');
      } else if (portalView !== 'selection') {
        setPortalViewState('selection');
      }
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleReturnToMainGateway = () => {
    historyStackRef.current = [];
    setUserRoleState('portal');
    setPortalViewState('selection');
    setShowAgeModalState(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Compatibility helper for legacy references
  const activeTab: 'survey' | 'dashboard' = userRole === 'admin' ? 'dashboard' : 'survey';
  const setActiveTab = (tab: 'survey' | 'dashboard') => {
    setUserRole(tab === 'dashboard' ? 'admin' : 'parent');
  };

  // Network State Simulator (Simulates Offline vs Cloud status)
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // App Configurations
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);

  // Core Databases (Backed up in localStorage)
  const [surveys, setSurveys] = useState<SurveyResponse[]>(() => {
    const cached = localStorage.getItem('beneficiary_surveys');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [];
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  const [principalReports, setPrincipalReports] = useState<PrincipalReport[]>(() => {
    const cached = localStorage.getItem('principal_reports');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [];
  });

  const [integrationLogs, setIntegrationLogs] = useState<SystemIntegrationLog[]>(() => {
    const cached = localStorage.getItem('beneficiary_integrations');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return INITIAL_INTEGRATION_LOGS;
  });

  const [beneficiaryFeedbacks, setBeneficiaryFeedbacks] = useState<BeneficiaryFeedback[]>(() => {
    const cached = localStorage.getItem('beneficiary_feedbacks_v1');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [
      {
        id: 'fb-101',
        senderName: 'محمد بن علي العمري',
        senderPhone: '0551234567',
        message: 'نظام ممتاز وميسر لرعاية المستفيدين والتسكين بالمدارس. شكراً لجهودكم في إدارة التعليم.',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'new'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('beneficiary_feedbacks_v1', JSON.stringify(beneficiaryFeedbacks));
  }, [beneficiaryFeedbacks]);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  const handleSendFeedback = (newFb: Omit<BeneficiaryFeedback, 'id' | 'createdAt' | 'status'>) => {
    const item: BeneficiaryFeedback = {
      ...newFb,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    setBeneficiaryFeedbacks(prev => [item, ...prev]);
    setAlertToast({ message: 'تم إرسال ملاحظتك بنجاح للأدمن!', type: 'success' });
  };

  const [isInquiriesModalOpen, setIsInquiriesModalOpen] = useState<boolean>(false);

  const [inquiries, setInquiries] = useState<BeneficiaryInquiry[]>(() => {
    const cached = localStorage.getItem('beneficiary_inquiries_v1');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [
      {
        id: 'inq-101',
        senderName: 'عبدالله بن سعد الحربي',
        senderPhone: '0554433221',
        inquiryText: 'السلام عليكم، أود الاستفسار عن إمكانية نقل ابني في الصف الثالث الابتدائي إلى مدرسة قريبة من حي العزيزية، وهل الشواغر متاحة حالياً؟',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'answered',
        answeredByOfficerId: 'emp_followup',
        answeredByOfficerName: 'عبدالرحيم الأحمدي (مشرف القبول والتسجيل)',
        officerReply: 'وعليكم السلام ورحمة الله وبركاته. مرحباً بك أخي الكريم، نعم تم التحقق من المدارس المجاورة بحي العزيزية وتوجد شواغر متاحة بمدرسة ابن كثير الابتدائية، يمكنك تقديم طلب النقل وسيتم التسكين مباشرة بإذن الله.',
        answeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        beneficiaryRating: 5,
        beneficiaryFeedbackNotes: 'خدمة ممتازة وسريعة جداً، شكراً جزيلاً للأستاذ عبدالرحيم الأحمدي على تجاوبه السريع والوافي.',
        ratedAt: new Date(Date.now() - 3600000 * 1).toISOString()
      },
      {
        id: 'inq-102',
        senderName: 'فاطمة بنت أحمد الزهراني',
        senderPhone: '0501239874',
        inquiryText: 'أرغب بالاستفسار عن موعد انتهاء فترة معادلة الشهادات الصادرة من خارج المملكة للمرحلة المتوسطة، وما هي المستندات المطلوبة مسبقاً؟',
        createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
        status: 'new'
      }
    ];
  });

  useEffect(() => {
    saveInquiriesToStorage(inquiries);
  }, [inquiries]);

  const handleAddInquiry = (newInq: Omit<BeneficiaryInquiry, 'id' | 'createdAt' | 'status'>) => {
    const item: BeneficiaryInquiry = {
      ...newInq,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    setInquiries(prev => [item, ...prev]);
    setAlertToast({ message: 'تم إرسال استفسارك بنجاح لمسؤول القبول!', type: 'success' });
  };

  const handleRateInquiry = (inquiryId: string, rating: number, notes?: string) => {
    setInquiries(prev => prev.map(inq => {
      if (inq.id === inquiryId) {
        return {
          ...inq,
          beneficiaryRating: rating,
          beneficiaryFeedbackNotes: notes || inq.beneficiaryFeedbackNotes,
          ratedAt: new Date().toISOString()
        };
      }
      return inq;
    }));
    setAlertToast({ message: 'تم حفظ تقييمك للخدمة بنجاح ⭐', type: 'success' });
  };

  const [schoolsList, setSchoolsList] = useState<SchoolItem[]>(() => {
    return INITIAL_SCHOOLS;
  });

  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(false);

  const handleUpdateSchools = (newList: SchoolItem[], isExplicitAdminClear?: boolean) => {
    if (!newList || !Array.isArray(newList)) return;
    if (isExplicitAdminClear) {
      setSchoolsList(newList);
      if (newList.length === 0) {
        localStorage.setItem('app_schools_cleared', 'true');
      } else {
        localStorage.removeItem('app_schools_cleared');
      }
      saveSchoolsToStorage(newList, { isConfirmedAdminClear: true });
      return;
    }
    localStorage.removeItem('app_schools_cleared');
    // دمج وتحديث المدارس والارقام الوزارية وبيانات المديرين مع الحفاظ على البيانات السابقة
    setSchoolsList(prev => {
      const mergedMap = new Map<string, SchoolItem>();
      (prev || []).forEach(s => {
        const key = s.ministryCode || s.code || s.id || s.nameAr;
        if (key) mergedMap.set(String(key).trim(), s);
      });
      newList.forEach(s => {
        const key = s.ministryCode || s.code || s.id || s.nameAr;
        if (key) {
          const existing = mergedMap.get(String(key).trim());
          mergedMap.set(String(key).trim(), existing ? { ...existing, ...s } : s);
        } else if (s.id) {
          mergedMap.set(s.id, s);
        }
      });
      const merged = Array.from(mergedMap.values());
      saveSchoolsToStorage(merged, { isConfirmedAdminClear: true });
      return merged;
    });
  };

  const [alertToast, setAlertToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Auto-dismiss alert toast after 3.5 seconds
  useEffect(() => {
    if (!alertToast) return;
    const timer = setTimeout(() => {
      setAlertToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [alertToast]);

  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchDetails, setBatchDetails] = useState<string>('');

  useEffect(() => {
    Promise.all([
      loadSurveysFromStorage(),
      loadPrincipalReportsFromStorage(),
      loadSchoolsFromStorage(),
      fetchServerSyncedData()
    ]).then(([surveysData, reportsData, schoolsData, serverData]) => {
      // 1. Surveys: Merge local + server data strictly without dropping any transactions
      setSurveys(prev => {
        const merged = new Map<string, SurveyResponse>();
        // Add existing state
        prev.forEach(s => { if (s && s.id) merged.set(s.id, s); });
        // Merge IndexedDB data
        (surveysData || []).forEach(s => { if (s && s.id) merged.set(s.id, s); });
        // Merge Server synced data
        if (serverData?.surveys && Array.isArray(serverData.surveys)) {
          serverData.surveys.forEach((s: SurveyResponse) => { if (s && s.id) merged.set(s.id, s); });
        }
        return Array.from(merged.values());
      });

      // 2. Principal Reports: Merge local + server
      setPrincipalReports(prev => {
        const merged = new Map<string, PrincipalReport>();
        prev.forEach(r => { if (r && r.id) merged.set(r.id, r); });
        (reportsData || []).forEach(r => { if (r && r.id) merged.set(r.id, r); });
        if (serverData?.principalReports && Array.isArray(serverData.principalReports)) {
          serverData.principalReports.forEach((r: PrincipalReport) => { if (r && r.id) merged.set(r.id, r); });
        }
        return Array.from(merged.values());
      });

      // 3. Schools & Principals: Strict protection of uploaded records
      // 3. Schools & Principals: Strict protection of authentic 2940 records
      const schMap = new Map<string, SchoolItem>();
      // Always seed with INITIAL_SCHOOLS (master 2940 schools)
      INITIAL_SCHOOLS.forEach(s => {
        const k = s.ministryCode || s.code || s.id || s.nameAr;
        if (k) schMap.set(String(k).trim(), s);
      });
      // Merge IndexedDB schools if any
      (schoolsData || []).forEach(s => {
        const k = s.ministryCode || s.code || s.id || s.nameAr;
        if (k) {
          const ex = schMap.get(String(k).trim());
          schMap.set(String(k).trim(), ex ? { ...ex, ...s } : s);
        }
      });
      // Merge server schools
      if (serverData?.schools && Array.isArray(serverData.schools) && serverData.schools.length > 0) {
        serverData.schools.forEach((s: SchoolItem) => {
          const k = s.ministryCode || s.code || s.id || s.nameAr;
          if (k) {
            const ex = schMap.get(String(k).trim());
            schMap.set(String(k).trim(), ex ? { ...ex, ...s } : s);
          }
        });
      }
      const resolvedSchools = Array.from(schMap.values());
      setSchoolsList(resolvedSchools);

      // 4. Inquiries: Merge server inquiries if available
      if (serverData?.inquiries && Array.isArray(serverData.inquiries) && serverData.inquiries.length > 0) {
        setInquiries(prev => {
          const inqMap = new Map<string, BeneficiaryInquiry>();
          prev.forEach(i => { if (i && i.id) inqMap.set(i.id, i); });
          serverData.inquiries.forEach((i: BeneficiaryInquiry) => { if (i && i.id) inqMap.set(i.id, i); });
          return Array.from(inqMap.values());
        });
      }

      // 5. Config: Merge custom settings if available on server
      if (serverData?.config && typeof serverData.config === 'object') {
        setConfig(prev => ({ ...prev, ...serverData.config }));
      }

      setIsInitialLoaded(true);
    }).catch(err => {
      console.warn('Initial storage load fallback:', err);
      setIsInitialLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isInitialLoaded) return;
    const timer = setTimeout(() => {
      saveSurveysToStorage(surveys);
      syncDataWithServer({ surveys });
    }, 2000);
    return () => clearTimeout(timer);
  }, [surveys, isInitialLoaded]);

  useEffect(() => {
    if (!isInitialLoaded) return;
    if (schoolsList.length < 2940) return; // Strict Anti-Downgrade: never sync truncated list!
    const timer = setTimeout(() => {
      saveSchoolsToStorage(schoolsList);
      syncDataWithServer({ 
        schools: schoolsList, 
        isExplicitAdminClear: false 
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [schoolsList, isInitialLoaded]);

  useEffect(() => {
    if (!isInitialLoaded) return;
    const timer = setTimeout(() => {
      savePrincipalReportsToStorage(principalReports);
      syncDataWithServer({ principalReports });
    }, 2000);
    return () => clearTimeout(timer);
  }, [principalReports, isInitialLoaded]);

  useEffect(() => {
    if (!isInitialLoaded) return;
    const timer = setTimeout(() => {
      syncDataWithServer({ inquiries, config });
    }, 2500);
    return () => clearTimeout(timer);
  }, [inquiries, config, isInitialLoaded]);

  const handleAddSurvey = (newSurveyData: Omit<SurveyResponse, 'id' | 'createdAt' | 'isSynced'>): SurveyResponse => {
    const surveyId = `SURV-${Math.floor(100 + Math.random() * 900)}`;
    const nowStr = new Date().toISOString();

    const newResponse: SurveyResponse = {
      ...newSurveyData,
      id: surveyId,
      createdAt: nowStr,
      lastUpdatedAt: nowStr,
      isSynced: isOnline
    };

    setSurveys((prev) => {
      const next = [newResponse, ...prev];
      saveSurveysToStorage(next);
      return next;
    });

    const ratedStaff = newResponse.staffSatisfaction && newResponse.staffSatisfaction > 0;
    const ratedReception = newResponse.receptionSatisfaction && newResponse.receptionSatisfaction > 0;
    const isNegativeFeedback = (ratedStaff && newResponse.staffSatisfaction < 3) || (ratedReception && newResponse.receptionSatisfaction < 3);

    if (isNegativeFeedback) {
      const emailId = `EML-${Math.floor(200 + Math.random() * 800)}`;
      const targetEmails = (config?.adminEmails || 'qabulmadinah@gmail.com').split(',').map((e) => e.trim()).filter(Boolean);
      
      const newEmailLogs: EmailLog[] = targetEmails.map((email, idx) => ({
        id: `${emailId}-${idx}`,
        surveyId,
        beneficiaryName: newResponse.beneficiaryName,
        recipientEmail: email,
        subject: `⚠️ تنبيه فوري: تقييم سلبي من مستفيد (${newResponse.beneficiaryName})`,
        sentAt: nowStr,
        status: isOnline ? 'sent' : 'pending',
        triggerReason: `Negative Feedback Alert`
      }));

      setEmailLogs((prev) => [...newEmailLogs, ...prev]);

      sendOfficialEmail({
        to: targetEmails,
        subject: `⚠️ تنبيه فوري: تقييم سلبي من مستفيد (${newResponse.beneficiaryName})`,
        bodyText: `تم استلام تقييم سلبي جديد...`,
        triggerReason: 'Negative Feedback Alert'
      });

      triggerToast(currentLang === 'ar' ? '⚠️ تم رصد تقييم سلبي!' : '⚠️ Negative feedback detected!', 'warning');
    } else {
      triggerToast(currentLang === 'ar' ? 'تم ارسال الطلب بنجاح' : 'Request sent successfully!', 'success');
    }

    return newResponse;
  };

  const handleDeleteSurvey = (id: string) => {
    setSurveys((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSurveysToStorage(next, { isConfirmedAdminClear: next.length === 0 });
      return next;
    });
  };

  const handleUpdateSurvey = (updatedSurvey: SurveyResponse) => {
    setSurveys((prev) => {
      const exists = prev.some((s) => s.id === updatedSurvey.id);
      const next = exists
        ? prev.map((s) => (s.id === updatedSurvey.id ? updatedSurvey : s))
        : [updatedSurvey, ...prev];
      saveSurveysToStorage(next);
      return next;
    });
  };

  const handleDeleteReport = (id: string) => {
    setPrincipalReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteEmailLog = (id: string) => {
    setEmailLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const handleClearAllSurveys = () => {
    setSurveys([]);
    setPrincipalReports([]);
    setEmailLogs([]);
    setIntegrationLogs([]);
    clearAllSurveysFromStorage('admin');
  };

  const handleImportSurveys = async (newSurveys: SurveyResponse[], overwrite: boolean = false) => {
    if (!newSurveys || newSurveys.length === 0) return;
    setIsProcessingBatch(true);
    try {
      const result = await processSurveysInBatchAsync({
        newItems: newSurveys,
        existingSurveys: overwrite ? [] : surveys,
        adminEmails: config.adminEmails,
        isOnline,
        onProgress: (percent) => setBatchProgress(percent)
      });
      const { deduplicatedItems, negativeEmailLogs } = result;
      setSurveys((prev) => overwrite ? deduplicatedItems : [...deduplicatedItems, ...prev]);
      if (negativeEmailLogs) setEmailLogs((prev) => [...negativeEmailLogs, ...prev]);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleAddPrincipalReport = (newRep: Omit<PrincipalReport, 'id' | 'createdAt' | 'isResolved'>) => {
    const report: PrincipalReport = {
      ...newRep,
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      isResolved: false
    };
    setPrincipalReports(prev => [report, ...prev]);
  };

  const handleToggleReportResolved = (id: string) => {
    setPrincipalReports(prev => prev.map(rep => rep.id === id ? { ...rep, isResolved: !rep.isResolved } : rep));
  };

  const handleUpdateReportStatus = (id: string, updates: Partial<PrincipalReport>) => {
    setPrincipalReports(prev => prev.map(rep => rep.id === id ? { ...rep, ...updates } : rep));
  };

  const handleToggleResolved = (id: string) => {
    setSurveys((prev) => prev.map((s) => s.id === id ? { ...s, isResolved: !s.isResolved } : s));
  };

  const handleSyncNow = () => {
    if (!isOnline) return;
    setSurveys((prev) => prev.map((s) => ({ ...s, isSynced: true })));
    setEmailLogs((prev) => prev.map((l) => ({ ...l, status: 'sent' })));
  };

  const handleTriggerManualBackup = () => {
    const dataStr = JSON.stringify({ surveys, emailLogs, integrationLogs, config }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const triggerToast = (message: string, type: 'success' | 'info' | 'warning') => {
    setAlertToast({ message, type });
    setTimeout(() => setAlertToast(null), 4000);
  };

  const unsyncedCount = surveys.filter((s) => !s.isSynced).length;
  const isDark = theme === 'dark';

  const handleUpdateConfig = (newConfig: AppConfig) => setConfig(newConfig);

  // Site Passcode Lock Screen (Nothing is displayed until correct password is submitted)
  if (!isSiteUnlocked) {
    return (
      <SiteAccessGate 
        onUnlock={() => setIsSiteUnlocked(true)} 
        theme={theme} 
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300 ${
        isDark ? 'bg-[#0b1f2e] text-slate-100' : 'bg-[#f2f9fd] text-slate-900'
      }`}
      dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
    >
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(!isOnline)}
        config={config}
        unsyncedCount={unsyncedCount}
        userRole={userRole}
        onBackToPortal={handleReturnToMainGateway}
        onGoBack={handleGoBack}
        showHome={userRole !== 'portal' || portalView !== 'selection'}
        canGoBack={historyStackRef.current.length > 0}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onLockSite={handleLockSite}
        principalSession={principalSession}
      />

      <main className={`flex-1 flex flex-col relative min-h-0 ${userRole === 'portal' ? 'pb-12' : 'pb-32'}`}>
        {!isOnline && (
          <div className="w-full bg-amber-500 text-white font-bold text-xs py-2 px-4 text-center z-40">
            <Wifi className="w-4 h-4 inline-block mr-2" />
            <span>{currentLang === 'ar' ? 'أنت تعمل دون اتصال' : 'You are offline'}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col relative">
          {userRole === 'portal' ? (
            <div key="portal-view" className="animate-fade-in flex-1 flex flex-col h-full">
              <ErrorBoundary fallbackTitleAr="خطأ في تحميل البوابة الموحدة">
                <Portal
                  currentLang={currentLang}
                  surveys={surveys}
                  schools={schoolsList}
                  onToggleResolved={handleToggleResolved}
                  onUpdateSurvey={handleUpdateSurvey}
                  config={config}
                  onSelectRole={setUserRole}
                  principalReports={principalReports}
                  onAddPrincipalReport={handleAddPrincipalReport}
                  onToggleReportResolved={handleToggleReportResolved}
                  theme={theme}
                  portalView={portalView}
                  onPortalViewChange={handlePortalViewChange}
                  showAgeModal={showAgeModal}
                  onAgeModalChange={handleAgeModalChange}
                  principalSession={principalSession}
                  onPrincipalSessionChange={setPrincipalSession}
                  onOpenInquiries={() => setIsInquiriesModalOpen(true)}
                />
              </ErrorBoundary>
            </div>
          ) : userRole === 'parent' ? (
            <div key="survey-view" className="animate-fade-in p-4 max-w-4xl mx-auto w-full">
              <ErrorBoundary fallbackTitleAr="خطأ في تحميل نموذج الطلب">
                <SurveyForm
                  currentLang={currentLang}
                  onSubmit={handleAddSurvey}
                  schools={schoolsList}
                  onUpdateSurvey={handleUpdateSurvey}
                  config={config}
                  isOnline={isOnline}
                  onBackToPortal={() => setUserRole('portal')}
                  theme={theme}
                />
              </ErrorBoundary>
            </div>
          ) : (
            <div key="dashboard-view" className="animate-fade-in flex-1">
              <ErrorBoundary fallbackTitleAr="خطأ في تحميل لوحة تحكم المسؤول">
                <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 text-teal-600 animate-spin" /></div>}>
                  <Dashboard
                    currentLang={currentLang}
                    surveys={surveys}
                    schools={schoolsList}
                    onImportSchools={handleUpdateSchools}
                    onDeleteSchool={(id) => handleUpdateSchools(schoolsList.filter(s => s.id !== id))}
                    onDeleteSurvey={handleDeleteSurvey}
                    onClearAllSurveys={handleClearAllSurveys}
                    onToggleResolved={handleToggleResolved}
                    onImportSurveys={handleImportSurveys}
                    onAddSurvey={handleAddSurvey}
                    onUpdateSurvey={handleUpdateSurvey}
                    config={config}
                    onUpdateConfig={handleUpdateConfig}
                    emailLogs={emailLogs}
                    integrationLogs={integrationLogs}
                    onTriggerManualBackup={handleTriggerManualBackup}
                    onSyncNow={handleSyncNow}
                    unsyncedCount={unsyncedCount}
                    isOnline={isOnline}
                    onBackToPortal={() => setUserRole('portal')}
                    principalReports={principalReports}
                    onToggleReportResolved={handleToggleReportResolved}
                    onUpdateReportStatus={handleUpdateReportStatus}
                    onDeleteReport={handleDeleteReport}
                    onDeleteEmailLog={handleDeleteEmailLog}
                    onAssignSurvey={(id, officerId, officerName, notes, role) => {
                      setSurveys(prev => prev.map(s => s.id === id ? { ...s, assignedOfficerId: officerId, serviceEmployee: officerName, referredBy: role, referralNotes: notes } : s));
                    }}
                    onAssignPrincipalReport={(id, officerId, notes, role) => {
                      setPrincipalReports(prev => prev.map(rep => rep.id === id ? { ...rep, assignedOfficerId: officerId, referredBy: role, referralNotes: notes } : rep));
                    }}
                    theme={theme}
                    beneficiaryFeedbacks={beneficiaryFeedbacks}
                    onUpdateBeneficiaryFeedbacks={setBeneficiaryFeedbacks}
                    inquiries={inquiries}
                    onUpdateInquiries={setInquiries}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isProcessingBatch && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl bg-slate-900 text-white p-5 rounded-3xl shadow-2xl">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">Processing Batch...</span>
                <span className="text-xs font-bold">{batchProgress}%</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-teal-500 h-full" style={{ width: `${batchProgress}%` }} />
             </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alertToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setAlertToast(null)}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3 cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 ${
              alertToast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' :
              alertToast.type === 'warning' ? 'bg-amber-600 border-amber-400 text-white' :
              'bg-blue-600 border-blue-400 text-white'
            }`}
          >
            <span className="font-bold text-xs sm:text-sm">{alertToast.message}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAlertToast(null);
              }}
              className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white/80 hover:text-white"
              title="إغلاق الإشعار"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ContactFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSendFeedback={handleSendFeedback}
        isDark={isDark}
      />

      {/* Inquiries & Communication Modal (الاستفسارات والتواصل) */}
      <InquiriesModal
        isOpen={isInquiriesModalOpen}
        onClose={() => setIsInquiriesModalOpen(false)}
        inquiries={inquiries}
        onAddInquiry={handleAddInquiry}
        onRateInquiry={handleRateInquiry}
        isDark={isDark}
        isRtl={currentLang === 'ar'}
      />
      
      {/* شريط الأزرار والتنقل المتجاوب - تم تصميمه ليناسب الجوال وشاشات الكمبيوتر دون أن يحجب المحتوى */}
      {/* 1. شريط الجوال المنظم بأسفل الشاشة (Mobile Bottom Dock) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#081e2b]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-teal-800/40 px-3 py-2 flex items-center justify-between gap-2 shadow-2xl">
        {/* زر تواصل مع المبرمج للجوال */}
        <button
          onClick={() => setIsFeedbackModalOpen(true)}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer select-none shrink-0"
          title={currentLang === 'ar' ? 'تواصل مع المبرمج' : 'Contact Developer'}
          id="mobile-contact-btn"
        >
          <Code2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="text-[11px]">{currentLang === 'ar' ? 'تواصل مع المبرمج' : 'Developer'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* زر الرجوع للخلف للجوال */}
          {(userRole !== 'portal' || portalView !== 'selection' || historyStackRef.current.length > 0) && (
            <button
              onClick={handleGoBack}
              className="bg-[#16222f] hover:bg-[#1f2f42] text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs border border-slate-700 flex items-center gap-1 cursor-pointer select-none"
              title={currentLang === 'ar' ? 'الرجوع للخلف' : 'Go Back'}
              id="mobile-back-btn"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-[11px]">{currentLang === 'ar' ? 'الخلف' : 'Back'}</span>
            </button>
          )}

          {/* زر الرئيسية للجوال */}
          {(userRole !== 'portal' || portalView !== 'selection') && (
            <button
              onClick={handleReturnToMainGateway}
              className="bg-teal-600 hover:bg-teal-700 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer select-none"
              title={currentLang === 'ar' ? 'الشاشة الرئيسية' : 'Home Page'}
              id="mobile-home-btn"
            >
              <Home className="w-3.5 h-3.5 text-emerald-200" />
              <span className="text-[11px]">{currentLang === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. أزرار سطح المكتب المثبتة بالزوايا دون حجب المحتوى (Desktop Floating Buttons) */}
      <div className="hidden sm:block">
        {/* زر تواصل مع المبرمج لسطح المكتب */}
        <button
          onClick={() => setIsFeedbackModalOpen(true)}
          className="fixed bottom-4 left-4 z-50 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200/90 dark:border-slate-700 flex items-center gap-2 cursor-pointer select-none"
          style={{ transform: 'none', transition: 'none' }}
          title={currentLang === 'ar' ? 'تواصل مع المبرمج' : 'Contact Developer'}
          id="floating-contact-btn"
        >
          <Code2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{currentLang === 'ar' ? 'تواصل مع المبرمج' : 'Contact Developer'}</span>
        </button>

        {/* زر الرجوع للخلف لسطح المكتب */}
        {(userRole !== 'portal' || portalView !== 'selection' || historyStackRef.current.length > 0) && (
          <button
            onClick={handleGoBack}
            className="fixed bottom-4 left-[175px] z-40 bg-[#16222f]/95 hover:bg-[#1f2f42] text-white font-black text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 flex items-center gap-2 cursor-pointer backdrop-blur-md select-none"
            title={currentLang === 'ar' ? 'الرجوع للخلف' : 'Go Back'}
            id="floating-back-btn"
          >
            <span>{currentLang === 'ar' ? 'الخلف' : 'Back'}</span>
            <RotateCcw className="w-4 h-4 text-cyan-300 stroke-[2.2]" />
          </button>
        )}

        {/* زر الرئيسية لسطح المكتب */}
        {(userRole !== 'portal' || portalView !== 'selection') && (
          <button
            onClick={handleReturnToMainGateway}
            className="fixed bottom-4 right-4 z-40 bg-[#16222f]/95 hover:bg-[#1f2f42] text-white font-black text-sm sm:text-base px-4.5 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-2.5 cursor-pointer backdrop-blur-md"
            title={currentLang === 'ar' ? 'الشاشة الرئيسية' : 'Home Page'}
            id="floating-home-btn"
          >
            <span>{currentLang === 'ar' ? 'الرئيسية' : 'Home'}</span>
            <Home className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-emerald-400 stroke-[2.2]" />
          </button>
        )}
      </div>
    </div>
  );
}
