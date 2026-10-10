import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  User, 
  Phone, 
  School, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  UserPlus, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  Check, 
  Search, 
  Send,
  FileCheck,
  GraduationCap,
  MapPin,
  HelpCircle,
  Paperclip,
  Sparkles,
  Filter,
  Layers,
  Compass,
  ArrowRight,
  Info,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SurveyResponse, SchoolItem, OfficerUser } from '../types';
import { SchoolSelectDropdown } from './SchoolSelectDropdown';
import { RequestDispatchTimeline } from './RequestDispatchTimeline';

interface RegistrationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: SurveyResponse | null;
  schools: SchoolItem[];
  onUpdateSurvey: (survey: SurveyResponse) => void;
  activeOfficer: OfficerUser;
  onClaimSurvey?: (survey: SurveyResponse) => void;
  onSendToPrincipal?: (survey: SurveyResponse) => void;
  onSendToPlanning?: (survey: SurveyResponse) => void;
  onSendToLeadership?: (survey: SurveyResponse) => void;
  isDark?: boolean;
}

// Stage normalization helper
const normalizeStage = (stage?: string): string => {
  if (!stage) return '';
  const s = stage.toLowerCase();
  if (s.includes('kindergarten') || s.includes('روضة') || s.includes('رياض') || s.includes('طفولة')) return 'kindergarten';
  if (s.includes('elementary') || s.includes('primary') || s.includes('ابتدائي') || s.includes('ابتدائية')) return 'elementary';
  if (s.includes('intermediate') || s.includes('middle') || s.includes('متوسط') || s.includes('متوسطة')) return 'intermediate';
  if (s.includes('secondary') || s.includes('high') || s.includes('ثانوي') || s.includes('ثانوية')) return 'secondary';
  return s;
};

// Gender normalization helper
const normalizeGender = (gender?: string): string => {
  if (!gender) return '';
  const g = gender.toLowerCase();
  if (g.includes('boy') || g.includes('بنين')) return 'boys';
  if (g.includes('girl') || g.includes('بنات')) return 'girls';
  if (g.includes('both') || g.includes('مشترك') || g.includes('مختلط') || g.includes('طفولة')) return 'both';
  return g;
};

export const RegistrationReviewModal: React.FC<RegistrationReviewModalProps> = ({
  isOpen,
  onClose,
  survey,
  schools,
  onUpdateSurvey,
  activeOfficer,
  onClaimSurvey,
  onSendToPrincipal,
  onSendToPlanning,
  onSendToLeadership,
  isDark = false
}) => {
  if (!isOpen || !survey) return null;

  // Beneficiary's 3 Desires
  const desire1 = (survey.firstSchoolName || survey.schoolName || '').trim();
  const desire2 = (survey.secondSchoolName || '').trim();
  const desire3 = (survey.thirdSchoolName || '').trim();

  // Local state for selecting school with capacity
  const [selectedSchoolName, setSelectedSchoolName] = useState<string>(
    survey.assignedRegistrationSchool || survey.schoolName || ''
  );
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>(
    survey.assignedRegistrationSchoolCode || survey.schoolCode || ''
  );
  const [capacityNotes, setCapacityNotes] = useState<string>(
    survey.assignedRegistrationSchoolNotes || ''
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filters for finding alternative available schools when desired schools are unavailable
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>(() => {
    const studentStage = normalizeStage(survey.stage);
    return studentStage || 'all';
  });

  // Sync state when survey changes
  useEffect(() => {
    if (survey) {
      setSelectedSchoolName(survey.assignedRegistrationSchool || survey.schoolName || '');
      setSelectedSchoolCode(survey.assignedRegistrationSchoolCode || survey.schoolCode || '');
      setCapacityNotes(survey.assignedRegistrationSchoolNotes || '');
      setSaveSuccessMsg(null);

      const studentStage = normalizeStage(survey.stage);
      if (studentStage) setFilterStage(studentStage);
    }
  }, [survey]);

  // Unique list of regions / governorates / sectors from schools
  const allRegions = useMemo(() => {
    const set = new Set<string>();
    schools.forEach(sch => {
      if (sch.district && sch.district.trim()) set.add(sch.district.trim());
      if (sch.customFields && sch.customFields['المنطقة']) set.add(String(sch.customFields['المنطقة']).trim());
      if (sch.customFields && sch.customFields['المحافظة']) set.add(String(sch.customFields['المحافظة']).trim());
      if (sch.customFields && sch.customFields['القطاع']) set.add(String(sch.customFields['القطاع']).trim());
      if (sch.customFields && sch.customFields['مكتب التعليم']) set.add(String(sch.customFields['مكتب التعليم']).trim());
    });
    const standardSectors = [
      'منطقة المدينة المنورة (المقر الرئيسي)',
      'القطاع الشمالي',
      'القطاع الجنوبي',
      'القطاع الشرقي',
      'القطاع الغربي',
      'القطاع الوسط',
      'محافظة ينبع',
      'محافظة بدر',
      'محافظة خيبر',
      'محافظة الحناكية',
      'محافظة مهد الذهب',
      'محافظة وادي الفرع',
      'محافظة العلا'
    ];
    standardSectors.forEach(s => set.add(s));
    return Array.from(set).filter(Boolean);
  }, [schools]);

  // Filtered alternative schools matching the 3 filters (Region, Gender, Stage)
  const filteredAlternativeSchools = useMemo(() => {
    return schools.filter(school => {
      // Filter by Region/Governorate
      if (filterRegion && filterRegion !== 'all') {
        const matchRegion = 
          school.district?.includes(filterRegion) ||
          school.customFields?.['المنطقة']?.includes(filterRegion) ||
          school.customFields?.['المحافظة']?.includes(filterRegion) ||
          school.customFields?.['القطاع']?.includes(filterRegion) ||
          school.customFields?.['مكتب التعليم']?.includes(filterRegion) ||
          school.nameAr?.includes(filterRegion);
        if (!matchRegion) return false;
      }

      // Filter by Gender
      if (filterGender && filterGender !== 'all') {
        const g = normalizeGender(school.gender || school.customFields?.['الجنس']);
        if (filterGender === 'boys' && g !== 'boys' && g !== 'both') return false;
        if (filterGender === 'girls' && g !== 'girls' && g !== 'both') return false;
        if (filterGender === 'both' && g !== 'both') return false;
      }

      // Filter by Stage
      if (filterStage && filterStage !== 'all') {
        const st = normalizeStage(school.stage || school.customFields?.['المرحلة']);
        if (st !== filterStage && st !== 'all') return false;
      }

      return true;
    });
  }, [schools, filterRegion, filterGender, filterStage]);

  // Quick Select Desire Handler
  const handleSelectDesire = (schoolName: string, desireNum: number) => {
    if (!schoolName) return;
    setSelectedSchoolName(schoolName);
    const matched = schools.find(s => s.nameAr.trim().toLowerCase() === schoolName.trim().toLowerCase());
    const code = matched ? (matched.ministryCode || (matched as any).code || '') : '';
    setSelectedSchoolCode(code);
    const label = desireNum === 1 ? 'الرغبة الأولى' : desireNum === 2 ? 'الرغبة الثانية' : 'الرغبة الثالثة';
    setCapacityNotes(`تم التسكين على (${label}) بناءً على رغبة المستفيد وتوفر إمكانية التسجيل.`);
  };

  // Alternative School Selected Handler
  const handleSelectAlternativeSchool = (schoolName: string, schoolCode?: string) => {
    if (!schoolName) return;
    setSelectedSchoolName(schoolName);
    if (schoolCode) setSelectedSchoolCode(schoolCode);
    setCapacityNotes(`تم التسكين في مدرسة بديلة متاحة (${schoolName}) لعدم توفر تسجيل بالمدارس المطلوبة من قبل المستفيد.`);
  };

  // Handle saving the assigned school
  const handleSaveAssignedSchool = () => {
    if (!selectedSchoolName.trim()) {
      alert('يرجى تحديد المدرسة التي بها إمكانية للتسجيل أولاً.');
      return;
    }

    const updated: SurveyResponse = {
      ...survey,
      assignedRegistrationSchool: selectedSchoolName.trim(),
      assignedRegistrationSchoolCode: selectedSchoolCode.trim(),
      assignedRegistrationSchoolNotes: capacityNotes.trim(),
      assignedRegistrationSchoolAt: new Date().toISOString(),
      assignedBySupervisorName: activeOfficer.nameAr,
      // Update schoolName & schoolCode so the principal of the target school receives the placement
      firstSchoolName: survey.firstSchoolName || survey.schoolName,
      schoolName: selectedSchoolName.trim(),
      schoolCode: selectedSchoolCode.trim()
    };

    onUpdateSurvey(updated);
    setSaveSuccessMsg('تم حفظ وتثبيت المدرسة المحددة للتسجيل بنجاح ✓');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const isClaimed = Boolean(survey.serviceEmployee && survey.serviceEmployee !== 'غير مسند');
  const isSentToPrincipal = Boolean(survey.sentToSchoolPrincipal);
  const isVacancyRequested = Boolean(survey.isVacancyRequest);
  const isSentToLeadership = Boolean(survey.sentToLeadership);

  return (
    <AnimatePresence>
      <div 
        id="registration-review-modal-overlay" 
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
        dir="rtl"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[32px] border shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#081e2b] border-teal-800/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Top Header Bar */}
          <div className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-teal-800/30 bg-[#061722]' : 'border-slate-100 bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg">
                    استعراض طلب تسجيل جديد
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 border border-teal-200 dark:border-teal-700">
                    رقم الطلب: #{survey.id.slice(-4)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                  بوابة مشرف وحدة القبول والتسجيل • استعراض رغبات المستفيد وتحديد المدرسة المتاحة
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-right">
            
            {/* 1. Status Badges Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className={`p-2.5 rounded-xl border text-center ${
                isClaimed 
                  ? 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300'
                  : 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
              }`}>
                <div className="text-[10px] font-bold text-slate-400">حالة الاستلام</div>
                <div className="font-black text-xs mt-0.5 flex items-center justify-center gap-1">
                  {isClaimed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{isClaimed ? `مستلم (${survey.serviceEmployee})` : 'غير مستلم بعد'}</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border text-center ${
                survey.assignedRegistrationSchool 
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
              }`}>
                <div className="text-[10px] font-bold text-slate-400">المدرسة المحددة</div>
                <div className="font-black text-xs mt-0.5 truncate px-1">
                  {survey.assignedRegistrationSchool ? `✓ ${survey.assignedRegistrationSchool}` : 'قيد التحديد من المشرف'}
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border text-center ${
                isSentToPrincipal 
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <div className="text-[10px] font-bold text-slate-400">ملف الطالب بالمدرسة</div>
                <div className="font-black text-xs mt-0.5">
                  {isSentToPrincipal ? 'تم الإرسال للمدير ✓' : 'لم يُرسل للمدير بعد'}
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border text-center ${
                isVacancyRequested 
                  ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <div className="text-[10px] font-bold text-slate-400">طلب فتح الشاغر</div>
                <div className="font-black text-xs mt-0.5">
                  {isVacancyRequested ? 'تم الرفع للتخطيط ✓' : 'لا يوجد طلب شاغر'}
                </div>
              </div>
            </div>

            {/* 2. Applicant & Student Dossier */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/60 border-slate-200/80'
            } space-y-4`}>
              <div className="flex items-center gap-2 text-xs font-black text-teal-700 dark:text-teal-400 border-b pb-2.5 border-slate-200/60 dark:border-slate-800">
                <User className="w-4 h-4" />
                <span>بيانات الطالب ومقدم طلب التسجيل الجديد:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3 bg-white dark:bg-[#081e2b] rounded-xl border border-slate-200/60 dark:border-teal-800/30">
                  <span className="text-slate-400 font-bold block text-[11px]">اسم الطالب / المستفيد:</span>
                  <span className="font-black text-slate-800 dark:text-white mt-0.5 block text-sm">
                    {survey.beneficiaryName || survey.parentName || 'غير مسجل'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-[#081e2b] rounded-xl border border-slate-200/60 dark:border-teal-800/30">
                  <span className="text-slate-400 font-bold block text-[11px]">الهوية الوطنية / السجل المدني:</span>
                  <span className="font-black text-slate-800 dark:text-white mt-0.5 block font-mono text-sm">
                    {survey.nationalId || '---'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-[#081e2b] rounded-xl border border-slate-200/60 dark:border-teal-800/30">
                  <span className="text-slate-400 font-bold block text-[11px]">رقم هاتف ولي الأمر:</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-black text-slate-800 dark:text-white font-mono text-sm">
                      {survey.phoneNumber || '---'}
                    </span>
                    {survey.phoneNumber && (
                      <a 
                        href={`tel:${survey.phoneNumber}`}
                        className="text-teal-600 hover:text-teal-700 p-1 rounded-md hover:bg-teal-50 dark:hover:bg-teal-900/30"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-[#081e2b] rounded-xl border border-slate-200/60 dark:border-teal-800/30">
                  <span className="text-slate-400 font-bold block text-[11px]">المرحلة والصف المطلوب:</span>
                  <span className="font-black text-slate-800 dark:text-white mt-0.5 block">
                    {survey.stage || 'المرحلة المتوسطة'} {survey.grade ? `• ${survey.grade}` : ''}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-[#081e2b] rounded-xl border border-slate-200/60 dark:border-teal-800/30">
                  <span className="text-slate-400 font-bold block text-[11px]">الحي السكني / القطاع:</span>
                  <span className="font-black text-slate-800 dark:text-white mt-0.5 block">
                    {survey.district || 'منطقة المدينة المنورة (المقر الرئيسي)'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-[#081e2b] rounded-xl border border-slate-200/60 dark:border-teal-800/30">
                  <span className="text-slate-400 font-bold block text-[11px]">حالة الإقرار بالمدرسة البديلة:</span>
                  <span className="font-black mt-0.5 block text-xs">
                    {survey.agreedToAlternativeSchoolPlacement ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 inline" />
                        موافق على التسكين البديل
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">لم يسجل إقراراً بديلاً</span>
                    )}
                  </span>
                </div>
              </div>

              {/* RAGHBAT SECTION: ALL 3 DESIRES DISPLAYED PROMINENTLY */}
              <div className="p-4 bg-white dark:bg-[#081e2b] rounded-2xl border border-purple-200/80 dark:border-purple-900/50 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 dark:border-purple-900/40 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-purple-900 dark:text-purple-200">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>رغبات المدارس المسجلة من قبل المستفيد (الرغبة 1 و 2 و 3):</span>
                  </div>
                  <span className="text-[11px] text-purple-600 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800/60">
                    رغبات ولي الأمر الرسمية المرفوعة بالنظام
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Desire 1 */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    selectedSchoolName === desire1 && desire1
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                        <span>الرغبة الأولى (الأساسية)</span>
                      </span>
                      {selectedSchoolName === desire1 && desire1 && (
                        <span className="text-[9px] font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded">مختارة للتسكين ✓</span>
                      )}
                    </div>
                    <div className="font-black text-xs text-slate-800 dark:text-white leading-snug" title={desire1}>
                      {desire1 || 'غير مسجلة'}
                    </div>
                  </div>

                  {/* Desire 2 */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    selectedSchoolName === desire2 && desire2
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                        <span>الرغبة الثانية</span>
                      </span>
                      {selectedSchoolName === desire2 && desire2 && (
                        <span className="text-[9px] font-black text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">مختارة للتسكين ✓</span>
                      )}
                    </div>
                    <div className="font-black text-xs text-slate-800 dark:text-white leading-snug" title={desire2}>
                      {desire2 ? (
                        desire2
                      ) : (
                        <span className="text-slate-400 font-bold text-[11px]">لم تُسجل رغبة ثانية</span>
                      )}
                    </div>
                  </div>

                  {/* Desire 3 */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    selectedSchoolName === desire3 && desire3
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">3</span>
                        <span>الرغبة الثالثة</span>
                      </span>
                      {selectedSchoolName === desire3 && desire3 && (
                        <span className="text-[9px] font-black text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.5 rounded">مختارة للتسكين ✓</span>
                      )}
                    </div>
                    <div className="font-black text-xs text-slate-800 dark:text-white leading-snug" title={desire3}>
                      {desire3 ? (
                        desire3
                      ) : (
                        <span className="text-slate-400 font-bold text-[11px]">لم تُسجل رغبة ثالثة</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes from Guardian */}
              {survey.notes && (
                <div className="p-3.5 bg-white dark:bg-[#081e2b] rounded-xl border border-slate-200/60 dark:border-teal-800/30">
                  <span className="text-slate-400 font-bold block text-[11px] mb-1">تفاصيل وملاحظات ولي الأمر:</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-bold text-xs">
                    {survey.notes}
                  </p>
                </div>
              )}
            </div>

            {/* 3. CORE SECTION: تحديد المدرسة التي بها إمكانية للتسجيل (المشرف المسؤول) */}
            <div className={`p-5 rounded-2xl border-2 ${
              isDark 
                ? 'bg-[#0a2332] border-teal-600/40 shadow-lg' 
                : 'bg-linear-to-b from-teal-50/40 to-white border-teal-500/40 shadow-sm'
            } space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/50 dark:border-teal-800/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-teal-950 dark:text-teal-200">
                      تحديد المدرسة التي بها إمكانية للتسجيل (المشرف المسؤول)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                      حدد المدرسة التي يتوفر بها شاغر للتسكين من رغبات المستفيد أو عبر المدارس البديلة المتاحة
                    </p>
                  </div>
                </div>

                {survey.assignedRegistrationSchool && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>محددة ومعتمدة: {survey.assignedRegistrationSchool}</span>
                  </span>
                )}
              </div>

              {/* QUICK DESIRES PICKER BAR: Direct Choice from the 3 Desires */}
              <div className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-[#061722] border-teal-800/30' : 'bg-purple-50/50 border-purple-100'
              } space-y-2`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>اختيار مباشر من رغبات المستفيد الثلاث (انقر على الرغبة المتاحة لتسكينها فوراً):</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">3 رغبات مسجلة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Quick Pick Desire 1 */}
                  <button
                    type="button"
                    disabled={!desire1}
                    onClick={() => handleSelectDesire(desire1, 1)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                      selectedSchoolName === desire1 && desire1
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white hover:bg-purple-100/60 dark:bg-slate-900 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 border-purple-200 dark:border-purple-800/50'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <span className={`text-[10px] font-black block ${selectedSchoolName === desire1 ? 'text-purple-100' : 'text-purple-700 dark:text-purple-300'}`}>
                        1️⃣ الرغبة الأولى:
                      </span>
                      <span className="font-bold text-xs truncate block">
                        {desire1 || 'غير متوفرة'}
                      </span>
                    </div>
                    {selectedSchoolName === desire1 && desire1 ? (
                      <Check className="w-4 h-4 shrink-0 text-white" />
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 shrink-0">
                        تحديد
                      </span>
                    )}
                  </button>

                  {/* Quick Pick Desire 2 */}
                  <button
                    type="button"
                    disabled={!desire2}
                    onClick={() => handleSelectDesire(desire2, 2)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                      !desire2 
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/40 border-slate-200 text-slate-400'
                        : selectedSchoolName === desire2 && desire2
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm cursor-pointer'
                          : 'bg-white hover:bg-blue-100/60 dark:bg-slate-900 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 border-blue-200 dark:border-blue-800/50 cursor-pointer'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <span className={`text-[10px] font-black block ${selectedSchoolName === desire2 ? 'text-blue-100' : 'text-blue-700 dark:text-blue-300'}`}>
                        2️⃣ الرغبة الثانية:
                      </span>
                      <span className="font-bold text-xs truncate block">
                        {desire2 || 'لم تُسجل'}
                      </span>
                    </div>
                    {desire2 && (
                      selectedSchoolName === desire2 ? (
                        <Check className="w-4 h-4 shrink-0 text-white" />
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 shrink-0">
                          تحديد
                        </span>
                      )
                    )}
                  </button>

                  {/* Quick Pick Desire 3 */}
                  <button
                    type="button"
                    disabled={!desire3}
                    onClick={() => handleSelectDesire(desire3, 3)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                      !desire3 
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/40 border-slate-200 text-slate-400'
                        : selectedSchoolName === desire3 && desire3
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm cursor-pointer'
                          : 'bg-white hover:bg-teal-100/60 dark:bg-slate-900 dark:hover:bg-teal-950/40 text-slate-800 dark:text-slate-200 border-teal-200 dark:border-teal-800/50 cursor-pointer'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <span className={`text-[10px] font-black block ${selectedSchoolName === desire3 ? 'text-teal-100' : 'text-teal-700 dark:text-teal-300'}`}>
                        3️⃣ الرغبة الثالثة:
                      </span>
                      <span className="font-bold text-xs truncate block">
                        {desire3 || 'لم تُسجل'}
                      </span>
                    </div>
                    {desire3 && (
                      selectedSchoolName === desire3 ? (
                        <Check className="w-4 h-4 shrink-0 text-white" />
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 shrink-0">
                          تحديد
                        </span>
                      )
                    )}
                  </button>
                </div>
              </div>

              {/* Main School Selector Bar */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-700 dark:text-teal-200">
                      اختر المدرسة المتاحة للتسجيل (البحث العام): <span className="text-rose-500">*</span>
                    </label>
                    {selectedSchoolName && (
                      <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                        المدرسة المختارة حالياً: <strong className="underline font-black">{selectedSchoolName}</strong>
                      </span>
                    )}
                  </div>
                  <SchoolSelectDropdown
                    schools={schools}
                    value={selectedSchoolName}
                    onChange={(schoolName, ministryCode) => {
                      setSelectedSchoolName(schoolName);
                      if (ministryCode) setSelectedSchoolCode(ministryCode);
                    }}
                    placeholder="ابحث باسم المدرسة أو الرقم الوزاري أو الحي..."
                    isDark={isDark}
                  />
                </div>

                {/* ========================================================================= */}
                {/* NEW REQUESTED SECTION: في حال لا يتوفر تسجيل بالمدارس المطلوبة من قبل المستفيد */}
                {/* الأشرطة الأربعة: تحديد المنطقة/المحافظة + جنس المدرسة + المرحلة + المدرسة المتاحة للتسجيل */}
                {/* ========================================================================= */}
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#061722] border-teal-800/40' : 'bg-amber-50/40 border-amber-200/80'
                } space-y-3.5 mt-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 dark:border-teal-800/30 pb-2.5">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-950 dark:text-amber-300">
                      <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>في حال لا يتوفر تسجيل بالمدارس المطلوبة من قبل المستفيد (التسكين البديل):</span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 px-2 py-0.5 rounded-full border border-amber-300/60 dark:border-amber-800">
                      تصفية ذكية للمدارس البديلة المتوفر بها شواغر
                    </span>
                  </div>

                  {/* The 3 Filter Bars: Region/Governorate, School Gender, School Stage */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* 1. شريط تحديد المنطقة او المحافظة */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span>شريط تحديد المنطقة أو المحافظة:</span>
                      </label>
                      <div className="relative">
                        <select
                          value={filterRegion}
                          onChange={(e) => setFilterRegion(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-bold appearance-none transition-all pr-8 ${
                            isDark 
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-teal-500' 
                              : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'
                          }`}
                        >
                          <option value="all">كافة المناطق والمحافظات والقطاعات</option>
                          {allRegions.map(reg => (
                            <option key={reg} value={reg}>{reg}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>

                    {/* 2. شريط تحديد جنس المدرسة */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>شريط تحديد جنس المدرسة:</span>
                      </label>
                      <div className="relative">
                        <select
                          value={filterGender}
                          onChange={(e) => setFilterGender(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-bold appearance-none transition-all pr-8 ${
                            isDark 
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-teal-500' 
                              : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'
                          }`}
                        >
                          <option value="all">الكل (بنين وبنات)</option>
                          <option value="boys">مدارس البنين</option>
                          <option value="girls">مدارس البنات</option>
                          <option value="both">مشترك (رياض أطفال / طفولة مبكرة)</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>

                    {/* 3. شريط المرحلة */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>شريط المرحلة الدراسية:</span>
                      </label>
                      <div className="relative">
                        <select
                          value={filterStage}
                          onChange={(e) => setFilterStage(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-bold appearance-none transition-all pr-8 ${
                            isDark 
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-teal-500' 
                              : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'
                          }`}
                        >
                          <option value="all">كافة المراحل التعليمية</option>
                          <option value="kindergarten">مرحلة رياض الأطفال</option>
                          <option value="elementary">المرحلة الابتدائية</option>
                          <option value="intermediate">المرحلة المتوسطة</option>
                          <option value="secondary">المرحلة الثانوية</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* 4. شريط المدرسة المتاحة للتسجيل في حال لا يتوفر تسجيل بالمدارس المطلوبة من قبل المستفيد */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-black text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span>شريط المدرسة المتاحة للتسجيل في حال لا يتوفر تسجيل بالمدارس المطلوبة من قبل المستفيد:</span>
                      </label>
                      <span className="text-[11px] font-black text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                        {filteredAlternativeSchools.length} مدرسة بديلة مطابقة للفلاتر
                      </span>
                    </div>

                    <SchoolSelectDropdown
                      id="alternative-school-select"
                      schools={filteredAlternativeSchools}
                      value={selectedSchoolName}
                      onChange={(schoolName, ministryCode) => {
                        handleSelectAlternativeSchool(schoolName, ministryCode);
                      }}
                      placeholder={`اختر مدرسة بديلة متاحة (${filteredAlternativeSchools.length} مدرسة متاحة حسب الفلاتر)...`}
                      isDark={isDark}
                    />

                    {/* Quick indicator when an alternative school is picked */}
                    {selectedSchoolName && selectedSchoolName !== desire1 && selectedSchoolName !== desire2 && selectedSchoolName !== desire3 && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>تم اختيار مدرسة بديلة متاحة: <strong className="font-black underline">{selectedSchoolName}</strong></span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">تسكين بديل معتمد ✓</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Capacity / Vacancy Notes */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-teal-200 mb-1.5">
                    ملاحظات إمكانية التسجيل والشواغر بالمدرسة المحددة:
                  </label>
                  <input
                    type="text"
                    value={capacityNotes}
                    onChange={(e) => setCapacityNotes(e.target.value)}
                    placeholder="مثال: تم التنسيق مع إدارة المدرسة والتأكد من إمكانية استيعاب الطالب بالصف المطلوب"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isDark 
                        ? 'bg-slate-900/80 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-600'
                    }`}
                  />
                </div>

                {/* Save Confirmation Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveAssignedSchool}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>تثبيت واعتماد المدرسة المحددة للتسجيل</span>
                  </button>

                  {saveSuccessMsg && (
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-bounce">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{saveSuccessMsg}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 4. PROCEDURES WORKFLOW BAR: The 5 Requested Action Icons */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#081e2b] border-teal-800/40' : 'bg-slate-50 border-slate-200'
            } space-y-3.5`}>
              <div className="font-black text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between border-b pb-2.5 border-slate-200/60 dark:border-slate-800">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>إجراءات مشرف وحدة القبول والتسجيل للطلب (5 إجراءات متكاملة):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  انقر على أي إجراء لتنفيذه مباشرة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                
                {/* 1. ايقونة استلام الطلب */}
                <button
                  type="button"
                  onClick={() => {
                    if (onClaimSurvey) {
                      onClaimSurvey(survey);
                    } else {
                      const updated = {
                        ...survey,
                        serviceEmployee: activeOfficer.nameAr,
                        isReceived: true,
                        receivedAt: new Date().toISOString()
                      };
                      onUpdateSurvey(updated);
                    }
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    isClaimed
                      ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/60'
                      : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200 hover:border-blue-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isClaimed ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50'
                  }`}>
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span className="font-black text-xs">1. استلام الطلب</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {isClaimed ? `مستلم: ${survey.serviceEmployee}` : 'انقر لاستلام الطلب'}
                  </span>
                </button>

                {/* 2. ايقونة استعراض الطلب */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('school-search-select');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    survey.assignedRegistrationSchool
                      ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-900/60'
                      : 'bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 border-slate-200 hover:border-teal-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-black text-xs">2. استعراض وتحديد المدرسة</span>
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-full px-1">
                    {survey.assignedRegistrationSchool ? survey.assignedRegistrationSchool : 'تحديد مدرسة بها إمكانية'}
                  </span>
                </button>

                {/* 3. ايقونة ارسال الطلب لمدير المدرسة لإضافة ملف الطالب */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSendToPrincipal) {
                      onSendToPrincipal(survey);
                    } else {
                      const updated: SurveyResponse = {
                        ...survey,
                        sentToSchoolPrincipal: true,
                        sentToPrincipalAt: new Date().toISOString(),
                        principalTaskType: 'add_student_file'
                      };
                      onUpdateSurvey(updated);
                    }
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    isSentToPrincipal
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/60'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200 hover:border-emerald-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSentToPrincipal ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50'
                  }`}>
                    <Send className="w-4 h-4" />
                  </div>
                  <span className="font-black text-xs">3. إرسال لمدير المدرسة</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {isSentToPrincipal ? 'تم الإرسال لإضافة الملف ✓' : 'لإضافة ملف الطالب'}
                  </span>
                </button>

                {/* 4. ايقونة طلب فتح شاغر لمسؤول التخطيط */}
                <button
                  type="button"
                  onClick={() => {
                    const assignedSchool = selectedSchoolName.trim() || survey.assignedRegistrationSchool || survey.schoolName || '';
                    const assignedCode = selectedSchoolCode.trim() || survey.assignedRegistrationSchoolCode || survey.schoolCode || '';
                    const notes = capacityNotes.trim() || survey.assignedRegistrationSchoolNotes || '';

                    const updated: SurveyResponse = {
                      ...survey,
                      ...(assignedSchool ? {
                        assignedRegistrationSchool: assignedSchool,
                        assignedRegistrationSchoolCode: assignedCode,
                        assignedRegistrationSchoolNotes: notes,
                        assignedRegistrationSchoolAt: survey.assignedRegistrationSchoolAt || new Date().toISOString(),
                        assignedBySupervisorName: survey.assignedBySupervisorName || activeOfficer.nameAr,
                        schoolName: assignedSchool,
                        schoolCode: assignedCode || survey.schoolCode
                      } : {}),
                      isVacancyRequest: true,
                      vacancyRequestStatus: 'pending',
                      referredToPlanningAt: new Date().toISOString(),
                      eqReferredToPlanningAt: new Date().toISOString()
                    };
                    if (onSendToPlanning) {
                      onSendToPlanning(updated);
                    } else {
                      onUpdateSurvey(updated);
                    }
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    isVacancyRequested
                      ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/60'
                      : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border-slate-200 hover:border-amber-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isVacancyRequested ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50'
                  }`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="font-black text-xs">4. طلب فتح شاغر</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {isVacancyRequested ? 'تم الرفع للتخطيط ✓' : 'لمسؤول التخطيط'}
                  </span>
                </button>

                {/* 5. ايقونة متابعة الطلب لمسؤول القيادة للمتابعة */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSendToLeadership) {
                      onSendToLeadership(survey);
                    } else {
                      const updated: SurveyResponse = {
                        ...survey,
                        sentToLeadership: true,
                        sentToLeadershipAt: new Date().toISOString()
                      };
                      onUpdateSurvey(updated);
                    }
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    isSentToLeadership
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/60'
                      : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200 hover:border-indigo-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSentToLeadership ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-black text-xs">5. متابعة القيادة</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {isSentToLeadership ? 'مرسل للقيادة ✓' : 'لمسؤول القيادة'}
                  </span>
                </button>

              </div>
            </div>

            {/* 5. Dispatch Timeline */}
            <div className="pt-2">
              <RequestDispatchTimeline survey={survey} />
            </div>

          </div>

          {/* Bottom Footer Actions */}
          <div className={`p-4 sm:p-5 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'border-teal-800/30 bg-[#061722]' : 'border-slate-100 bg-slate-50'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-all cursor-pointer"
            >
              إغلاق النافذة
            </button>

            {survey.assignedRegistrationSchool && !survey.sentToSchoolPrincipal && (
              <button
                type="button"
                onClick={() => {
                  if (onSendToPrincipal) {
                    onSendToPrincipal(survey);
                  } else {
                    const updated: SurveyResponse = {
                      ...survey,
                      sentToSchoolPrincipal: true,
                      sentToPrincipalAt: new Date().toISOString(),
                      principalTaskType: 'add_student_file'
                    };
                    onUpdateSurvey(updated);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>إرسال فوري لمدير المدرسة ({survey.assignedRegistrationSchool}) لإضافة ملف الطالب</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RegistrationReviewModal;
