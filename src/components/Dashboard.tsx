import React, { useState, useMemo, useRef, useEffect } from 'react';
import AddUserModal from './AddUserModal';
import UserDetailModal from './UserDetailModal';
import { RequestDispatchTimeline } from './RequestDispatchTimeline';
import { checkRequestDelayStatus, getDelayedRequests } from '../utils/delayUtils';
import { 
  Users, 
  Search, 
  Filter, 
  Settings, 
  Download, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Database, 
  FileText, 
  RefreshCw, 
  PieChart, 
  ChevronRight, 
  ChevronDown,
  X,
  Plus,
  Send,
  Building2,
  Phone,
  User,
  MoreVertical,
  ShieldAlert,
  Save,
  Grid,
  List,
  AlertTriangle,
  FileDown,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  ArrowRight,
  UserCheck,
  TrendingUp,
  MapPin,
  GraduationCap,
  MessageSquare,
  History,
  FileCheck,
  Package,
  HardDrive,
  Printer,
  Shield,
  Lock,
  Mail,
  Zap,
  LayoutDashboard,
  LogOut,
  Bell,
  Star,
  Activity,
  FileSignature,
  FileBarChart,
  School,
  FileSpreadsheet,
  Inbox,
  ArrowRightLeft,
  Check,
  Eye,
  AlertCircle,
  BarChart3,
  UserPlus,
  CalendarCheck,
  Briefcase,
  Upload,
  ShieldCheck,
  Unlock,
  Baby,
  FileBadge,
  BookOpen,
  Percent,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SurveyResponse, 
  SchoolItem, 
  AppConfig, 
  EmailLog, 
  SystemIntegrationLog, 
  PrincipalReport,
  ProblemType,
  BeneficiaryFeedback,
  OfficerUser,
  OfficerRole,
  UserProfile,
  isSystemAdmin,
  ADMIN_CREDENTIALS
} from '../types';
import { 
  isSurveyEqualizationRequest, 
  isSurveyTransferRequest,
  isSurveyAdmissionOrTransferRequest,
  canOfficerHandleAdmissionRequests,
  canOfficerHandleEquivalencyRequests,
  DEMO_OFFICERS, 
  getProblemTypeArabicLabel,
  saveOfficersToStorage,
  loadOfficersFromStorage,
  syncDataWithServer
} from '../utils/storageEngine';
import { ReportExportData } from '../utils/reportExporter';
import { OfficialReportModal } from './OfficialReportModal';
import { getMoeLogoDataUrl } from '../utils/klicheAssets';
import { calculateAllGovernoratesStats, buildGovernorateReportSections } from '../utils/governorateStats';
import { GovernoratePartCard } from './GovernoratePartCard';
import BeneficiarySatisfactionView from './BeneficiarySatisfactionView';
import BeneficiaryFeedbackView from './BeneficiaryFeedbackView';
import AdmissionInquiriesView from './AdmissionInquiriesView';
import PrincipalsDatabaseView from './PrincipalsDatabaseView';
import OfficerEditModal from './OfficerEditModal';
import DateBackupModal from './DateBackupModal';
import RegistrationReviewModal from './RegistrationReviewModal';
import * as XLSX from 'xlsx';
import { BeneficiaryInquiry } from '../types';

// Helper to format officer roles in Arabic
function getOfficerRoleTitle(role: string): string {
  const map: Record<string, string> = {
    admin: 'مدير النظام (أدمن)',
    director: 'مدير الإدارة',
    manager_admission_unit: 'مدير وحدة القبول',
    supervisor: 'مشرف وحدة القبول والتوجيه',
    tech_support_supervisor: 'مشرف القبول دعم فني',
    equivalency_supervisor: 'مشرف القبول معادلة الشهادات',
    planning_vacancy_supervisor: 'مشرف التخطيط فتح الشواغر',
    school_planning: 'مشرف التخطيط المدرسي',
    school_leadership: 'مشرف القيادة المدرسية',
    primary_school_supervisor: 'مشرف الإدارة المدرسية (ابتدائي)',
    intermediate_school_supervisor: 'مشرف الإدارة المدرسية (متوسط)',
    secondary_school_supervisor: 'مشرف الإدارة المدرسية (ثانوي)',
    early_childhood_official: 'مسؤول الطفولة المبكرة',
    kindergarten_official: 'مسؤول رياض الأطفال',
  };
  return map[role] || (role === 'admin' ? 'مدير النظام (أدمن)' : 'مشرف قبول وتوجيه');
}

export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷٨٩'.indexOf(d).toString())
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function matchesSearchQuery(searchPool: (string | undefined | null)[], query: string): boolean {
  if (!query.trim()) return true;
  const normalizedQuery = normalizeArabicText(query);
  const searchTerms = normalizedQuery.split(' ').filter(t => t.length > 0);
  
  if (searchTerms.length === 0) return true;
  
  const normalizedPool = searchPool
    .filter(item => !!item)
    .map(item => normalizeArabicText(item as string));
    
  return searchTerms.every(term => 
    normalizedPool.some(poolItem => poolItem.includes(term))
  );
}

interface DashboardProps {
  currentLang: 'ar' | 'en';
  surveys: SurveyResponse[];
  schools: SchoolItem[];
  onDeleteSurvey: (id: string) => void;
  onClearAllSurveys: () => void;
  onToggleResolved: (id: string) => void;
  onImportSurveys: (surveys: SurveyResponse[]) => void;
  onAddSurvey: (survey: SurveyResponse) => void;
  onUpdateSurvey: (survey: SurveyResponse) => void;
  onImportSchools: (schools: SchoolItem[], isExplicitAdminClear?: boolean) => void;
  onDeleteSchool: (id: string) => void;
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  emailLogs: EmailLog[];
  integrationLogs: SystemIntegrationLog[];
  onTriggerManualBackup: () => void;
  onSyncNow: () => void;
  unsyncedCount: number;
  isOnline: boolean;
  onBackToPortal: () => void;
  principalReports: PrincipalReport[];
  onToggleReportResolved: (id: string) => void;
  onUpdateReportStatus?: (id: string, updates: Partial<PrincipalReport>) => void;
  onDeleteReport: (id: string) => void;
  onDeleteEmailLog: (id: string) => void;
  onAssignSurvey?: (id: string, officerId: string, officerName: string, notes: string, role: 'admin' | 'director') => void;
  onAssignPrincipalReport?: (id: string, officerId: string, notes: string, role: 'admin' | 'director') => void;
  theme: 'light' | 'dark';
  beneficiaryFeedbacks?: BeneficiaryFeedback[];
  onUpdateBeneficiaryFeedbacks?: (feedbacks: BeneficiaryFeedback[]) => void;
  inquiries?: BeneficiaryInquiry[];
  onUpdateInquiries?: (inquiries: BeneficiaryInquiry[]) => void;
  userProfile?: UserProfile | null;
}

export default function Dashboard({
  currentLang,
  surveys,
  schools,
  onDeleteSurvey,
  onClearAllSurveys,
  onToggleResolved,
  onImportSurveys,
  onAddSurvey,
  onUpdateSurvey,
  onImportSchools,
  onDeleteSchool,
  config,
  onUpdateConfig,
  emailLogs,
  integrationLogs,
  onTriggerManualBackup,
  onSyncNow,
  unsyncedCount,
  isOnline,
  onBackToPortal,
  principalReports,
  onToggleReportResolved,
  onUpdateReportStatus,
  onDeleteReport,
  onDeleteEmailLog,
  onAssignSurvey,
  onAssignPrincipalReport,
  theme,
  beneficiaryFeedbacks = [],
  onUpdateBeneficiaryFeedbacks,
  inquiries = [],
  onUpdateInquiries,
  userProfile
}: DashboardProps) {
  const isRtl = currentLang === 'ar';
  const isDark = theme === 'dark';

  const [activeOfficer, setActiveOfficer] = useState<OfficerUser>(() => {
    try {
      const savedId = localStorage.getItem('active_officer_id_v1');
      if (savedId) {
        const found = DEMO_OFFICERS.find(o => o.id === savedId);
        if (found) return found;
      }
    } catch {}
    return DEMO_OFFICERS[0];
  });

  // مزامنة الموظف النشط مع الملف الشخصي وصلاحيات قاعدة البيانات الفعلية
  useEffect(() => {
    if (userProfile) {
      setActiveOfficer(prev => ({
        ...prev,
        id: userProfile.uid || prev.id,
        nameAr: userProfile.nameAr || userProfile.displayName || prev.nameAr,
        role: (userProfile.role as OfficerRole) || prev.role,
        nationalId: userProfile.civilId || userProfile.nationalId || prev.nationalId,
        civilId: userProfile.civilId || userProfile.nationalId,
        workField: userProfile.workField || userProfile.unit || prev.workField,
        unit: userProfile.unit || userProfile.workField || prev.unit,
        mobile: userProfile.mobile || prev.mobile,
        personalEmail: userProfile.email || prev.personalEmail,
        permissions: { ...(prev.permissions || {}), ...(userProfile.permissions || {}) }
      }));
    }
  }, [userProfile]);
  const [officers, setOfficers] = useState<OfficerUser[]>(() => {
    try {
      const cached = localStorage.getItem('officer_users_v4');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= DEMO_OFFICERS.length) return parsed;
      }
    } catch {}
    return DEMO_OFFICERS;
  });

  // Strict persistence & auto-sync of officer users (protect Salem Al-Tarjami & 10 authentic staff)
  useEffect(() => {
    loadOfficersFromStorage().then(loaded => {
      if (loaded && loaded.length >= DEMO_OFFICERS.length) {
        setOfficers(loaded);
      }
    });
  }, []);

  useEffect(() => {
    if (officers.length >= DEMO_OFFICERS.length) {
      saveOfficersToStorage(officers);
      syncDataWithServer({ officers });
    }
  }, [officers]);
  const [activeFeature, setActiveFeature] = useState<
    'requests' | 'equivalency_requests' | 'inquiries' | 'principal_reports' | 'sync' | 'settings' | 'placements' | 'staff' | 'feedback' | 'analytics' | 'alerts' | 'schools' | 'satisfaction' | 'reports' | 'principal_data'
  >('requests');
  
  const isFeatureAllowedForOfficer = (feature: string): boolean => {
    // 1. التحقق الحصري من صلاحية الأدمن (مقتصرة فقط على أ. سالم محمد الترجمي 1068575628)
    const isCurrentAdmin = isSystemAdmin(activeOfficer);
    if (isCurrentAdmin) return true;

    // 2. التحقق من الصلاحيات الممنوحة صراحة للموظف (من شاشة الصلاحيات والكوادر)
    const perms = (activeOfficer.permissions || {}) as Record<string, boolean | undefined>;

    if (feature === 'inquiries') {
      if (perms.canViewInquiries === true || perms.inquiries === true) return true;
    }
    if (feature === 'requests') {
      // مسموحة صراحة إذا كانت محددة، أو إذا كان لديه أي صلاحية تخص القبول أو الاستفسارات أو التتبع
      if (
        perms.canViewDashboard === true || 
        perms.requests === true || 
        perms.canViewInquiries === true || 
        perms.canTrackNewRegistration === true || 
        perms.canTrackTransfers === true
      ) return true;

      // ومسموحة تلقائياً لجميع المشرفين ومنسوبي وحدة القبول والتسجيل
      const rStr = String(activeOfficer.role || '').toLowerCase();
      const uStr = String(activeOfficer.workField || activeOfficer.unit || '').toLowerCase();
      if (
        rStr === 'supervisor' ||
        rStr === 'manager_admission_unit' ||
        rStr === 'tech_support_supervisor' ||
        rStr === 'director' ||
        rStr.includes('مشرف') ||
        rStr.includes('قبول') ||
        rStr.includes('supervisor') ||
        uStr.includes('قبول') ||
        uStr.includes('مشرف')
      ) return true;
    }
    if (feature === 'equivalency_requests') {
      if (perms.canViewEquivalencyRequests === true || perms.equivalency === true) return true;
    }
    if (feature === 'placements') {
      if (perms.canViewSchoolTransfers === true || perms.placements === true) return true;
    }
    if (feature === 'feedback') {
      if (perms.canViewFeedback === true || perms.feedback === true) return true;
    }
    if (feature === 'alerts') {
      if (perms.canViewAlerts === true || perms.alerts === true) return true;
    }
    if (feature === 'staff') {
      if (perms.canViewStaff === true || perms.staff === true) return true;
    }
    if (feature === 'schools') {
      if (perms.canViewSchools === true || perms.schools === true) return true;
    }
    if (feature === 'principal_data') {
      if (perms.canViewPrincipalData === true || perms.principal_data === true) return true;
    }
    if (feature === 'settings') {
      if (perms.canViewSettings === true || perms.settings === true) return true;
    }
    if (feature === 'sync') {
      if (perms.canViewSync === true || perms.sync === true) return true;
    }
    if (feature === 'reports') {
      if (perms.canViewReports === true || perms.reports === true) return true;
    }

    // 3. فحص الصلاحيات الافتراضية بحسب المسمى والدور الوظيفي
    // أ) شاشة الاستفسارات والتواصل: تتاح لجميع مسؤولي القبول والدعم الفني
    if (feature === 'inquiries') {
      return (
        activeOfficer.role === 'director' ||
        activeOfficer.role === 'manager_admission_unit' ||
        activeOfficer.role === 'supervisor' ||
        activeOfficer.role === 'tech_support_supervisor' ||
        activeOfficer.role === 'equivalency_supervisor'
      );
    }

    // ب) مدير الإدارة
    if (activeOfficer.role === 'director') {
      const forbiddenForDirector = ['sync', 'settings', 'staff', 'schools', 'reports'];
      return !forbiddenForDirector.includes(feature);
    }

    // ج) مدير وحدة القبول
    if (activeOfficer.role === 'manager_admission_unit') {
      return ['requests', 'equivalency_requests', 'inquiries', 'principal_reports', 'feedback', 'alerts', 'satisfaction', 'schools'].includes(feature);
    }

    // د) مشرف وحدة القبول (القبول والتسجيل)
    if (activeOfficer.role === 'supervisor') {
      return ['requests', 'inquiries', 'principal_reports', 'feedback', 'alerts', 'satisfaction'].includes(feature);
    }

    // هـ) مشرف القبول دعم فني
    if (activeOfficer.role === 'tech_support_supervisor') {
      return ['inquiries', 'requests', 'feedback', 'alerts'].includes(feature);
    }

    // و) مشرف وحدة القبول معادلة المؤهلات
    if (activeOfficer.role === 'equivalency_supervisor') {
      return ['equivalency_requests', 'inquiries', 'feedback', 'alerts', 'satisfaction'].includes(feature);
    }

    // ز) مسؤولو التخطيط والقيادة المدرسية
    if (
      activeOfficer.role === 'school_planning' || 
      activeOfficer.role === 'school_leadership' ||
      activeOfficer.role === 'planning_vacancy_supervisor' ||
      activeOfficer.role === 'primary_school_supervisor' ||
      activeOfficer.role === 'intermediate_school_supervisor' ||
      activeOfficer.role === 'secondary_school_supervisor' ||
      activeOfficer.role === 'early_childhood_official' ||
      activeOfficer.role === 'kindergarten_official'
    ) {
      return ['placements'].includes(feature);
    }

    return false;
  };

    // Ensure non-admin / non-director cannot stay on an unauthorized screen
  React.useEffect(() => {
    if (!isFeatureAllowedForOfficer(activeFeature)) {
      if (activeOfficer.role === 'equivalency_supervisor') {
        setActiveFeature('equivalency_requests');
      } else if (activeOfficer.role === 'school_planning' || activeOfficer.role === 'school_leadership') {
        setActiveFeature('placements');
      } else if (activeOfficer.role === 'supervisor') {
        setActiveFeature('requests');
      } else {
        setActiveFeature('requests');
      }
    }
  }, [activeOfficer, activeFeature]);
  
  // Advanced Filter States for Admission & Transfer Requests (Screen 1)
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [problemFilter, setProblemFilter] = useState('all');
  const [officerFilter, setOfficerFilter] = useState('all');
  const [resolutionFilter, setResolutionFilter] = useState<'all' | 'resolved' | 'pending'>('all');
  const [workflowStatus, setWorkflowStatus] = useState<string>('new');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showMyRequestsOnly, setShowMyRequestsOnly] = useState(false);
  const [showDispatchTimeline, setShowDispatchTimeline] = useState<boolean>(true);
  const [inquiriesDefaultTab, setInquiriesDefaultTab] = useState<'general' | 'my_claimed' | 'all'>('general');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<OfficerUser | null>(null);
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<string[]>([]);
  const [officersToDeleteModal, setOfficersToDeleteModal] = useState<OfficerUser[] | null>(null);

  const fileInputImportRef = useRef<HTMLInputElement>(null);
  const fileInputUpdateRef = useRef<HTMLInputElement>(null);

  // Advanced & Resilient Excel / CSV Users Import & Update Engine
  const handleImportUsers = (file: File, updateOnly: boolean) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: 'array', cellText: true, cellDates: true });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        
        // 1. Get raw rows to handle any header location
        const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!rawRows || rawRows.length === 0) {
          alert('الملف فارغ أو لا يحتوي على بيانات صالحة.');
          return;
        }

        // Helper to normalize keys and text
        const cleanStr = (v: any) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');

        // 2. Find header row
        let headerRowIndex = 0;
        let foundHeader = false;
        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const rowText = rawRows[i].map(c => cleanStr(c)).join(' ');
          if (rowText.includes('اسم') || rowText.includes('name') || rowText.includes('سجل') || rowText.includes('هوية') || rowText.includes('جوال')) {
            headerRowIndex = i;
            foundHeader = true;
            break;
          }
        }

        const headers = (rawRows[headerRowIndex] || []).map(h => String(h || '').trim());
        
        // Column resolver helper
        const getColIdx = (keywords: string[]) => {
          return headers.findIndex(h => {
            const norm = cleanStr(h);
            return keywords.some(k => norm.includes(cleanStr(k)));
          });
        };

        const nameIdx = getColIdx(['الاسم الرباعي', 'اسم الموظف', 'اسم المستخدم', 'اسم المشرف', 'الاسم الكامل', 'الاسم', 'name', 'employee']);
        const idIdx = getColIdx(['السجل المدني', 'رقم الهوية', 'الهوية', 'السجل', 'national', 'civil', 'id']);
        const mobileIdx = getColIdx(['الجوال', 'رقم الجوال', 'الهاتف', 'mobile', 'phone']);
        const emailIdx = getColIdx(['البريد', 'البريد الوزاري', 'الايميل', 'email']);
        const roleIdx = getColIdx(['المهمة', 'الدور', 'المسمى الوظيفي', 'الدور الوظيفي', 'الوظيفة', 'role']);
        const descIdx = getColIdx(['الوصف الوظيفي', 'الوصف', 'مهام الوظيفة', 'description']);
        const stageIdx = getColIdx(['المرحلة', 'المرحلة الدراسية', 'stage']);
        const workFieldIdx = getColIdx(['الجهة', 'جهة العمل', 'مجال العمل', 'القسم', 'الإدارة', 'الوحدة', 'workfield', 'entity']);

        // Fallback: If no explicit name column was found, pick first column with non-empty strings
        const effectiveNameIdx = nameIdx !== -1 ? nameIdx : 0;

        const dataRows = rawRows.slice(headerRowIndex + 1);
        const parsedUsers: OfficerUser[] = [];

        dataRows.forEach((row, rowIdx) => {
          if (!row || row.length === 0) return;
          const rawName = String(row[effectiveNameIdx] || '').trim();
          // Filter out header re-occurrences or empty rows
          if (!rawName || rawName === 'الاسم' || rawName === 'اسم الموظف' || rawName.length < 2) return;

          const nationalId = idIdx !== -1 ? String(row[idIdx] || '').trim() : '';
          const mobile = mobileIdx !== -1 ? String(row[mobileIdx] || '').trim() : '';
          const email = emailIdx !== -1 ? String(row[emailIdx] || '').trim() : '';
          const roleRaw = roleIdx !== -1 ? String(row[roleIdx] || '').trim() : '';
          const desc = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';
          const stage = stageIdx !== -1 ? String(row[stageIdx] || 'الكل').trim() : 'الكل';
          const workField = workFieldIdx !== -1 ? String(row[workFieldIdx] || '').trim() : 'إدارة القبول والتوجيه';

          parsedUsers.push({
            id: 'emp_' + Date.now().toString(36) + '_' + rowIdx,
            nameAr: rawName,
            nameEn: '',
            role: (roleRaw || 'supervisor') as any,
            mobile: mobile,
            isActive: true,
            nationalId: nationalId,
            personalEmail: email,
            roleDescription: desc,
            assignedStage: stage,
            workField: workField,
            tasks: roleRaw || desc,
            taskText: roleRaw || desc,
            assignedRoleText: roleRaw,
            permissions: {}
          });
        });

        if (parsedUsers.length === 0) {
          alert('تعذر استخراج أسماء الموظفين من الملف. يرجى التأكد من أن الملف يحتوي على عمود يحمل اسم (الاسم) أو (اسم الموظف).');
          return;
        }

        if (updateOnly) {
          // تحديث الأسماء السابقة دون حذف أي مستخدم قديم
          setOfficers(prev => {
            const updated = [...prev];
            let updatedCount = 0;
            let addedCount = 0;

            parsedUsers.forEach(newUser => {
              const cleanNewName = newUser.nameAr.trim().replace(/\s+/g, ' ');
              const index = updated.findIndex(u => {
                const sameId = newUser.nationalId && u.nationalId && String(u.nationalId).trim() === String(newUser.nationalId).trim();
                const sameName = u.nameAr && cleanNewName && u.nameAr.trim().replace(/\s+/g, ' ') === cleanNewName;
                return sameId || sameName;
              });

              if (index !== -1) {
                // Update existing user preserving id and keeping existing fields if new is empty
                updated[index] = {
                  ...updated[index],
                  nameAr: newUser.nameAr || updated[index].nameAr,
                  mobile: newUser.mobile || updated[index].mobile,
                  nationalId: newUser.nationalId || updated[index].nationalId,
                  personalEmail: newUser.personalEmail || updated[index].personalEmail,
                  role: newUser.role !== 'supervisor' ? newUser.role : (updated[index].role || newUser.role),
                  roleDescription: newUser.roleDescription || updated[index].roleDescription,
                  workField: newUser.workField || updated[index].workField,
                  assignedStage: newUser.assignedStage || updated[index].assignedStage,
                  tasks: newUser.tasks || updated[index].tasks,
                  taskText: newUser.taskText || (updated[index] as any).taskText,
                };
                updatedCount++;
              } else {
                // Add new user without deleting existing ones
                updated.push(newUser);
                addedCount++;
              }
            });

            try { localStorage.setItem('officer_users_v4', JSON.stringify(updated)); } catch {}
            
            const msg = `✅ تم تحديث بيانات ${updatedCount} موظف وإضافة ${addedCount} اسم جديد مع الحفاظ على جميع الأسماء السابقة.`;
            setClaimToastMessage(msg);
            setTimeout(() => setClaimToastMessage(null), 5000);
            return updated;
          });
        } else {
          // استيراد أسماء جديدة دون حذف الأسماء القديمة
          setOfficers(prev => {
            const updated = [...prev];
            let addedCount = 0;

            parsedUsers.forEach(newUser => {
              const cleanNewName = newUser.nameAr.trim().replace(/\s+/g, ' ');
              const exists = updated.some(u => {
                const sameId = newUser.nationalId && u.nationalId && String(u.nationalId).trim() === String(newUser.nationalId).trim();
                const sameName = u.nameAr && cleanNewName && u.nameAr.trim().replace(/\s+/g, ' ') === cleanNewName;
                return sameId || sameName;
              });

              if (!exists) {
                updated.push(newUser);
                addedCount++;
              }
            });

            try { localStorage.setItem('officer_users_v4', JSON.stringify(updated)); } catch {}
            
            const msg = `✅ تم استيراد ${addedCount} مستخدم جديد بنجاح وإضافتهم للقائمة دون حذف أي أسماء سابقة.`;
            setClaimToastMessage(msg);
            setTimeout(() => setClaimToastMessage(null), 5000);
            return updated;
          });
        }
      } catch (err) {
        console.error('Error importing Excel:', err);
        alert('حدث خطأ أثناء قراءة ملف الإكسل. تأكد من صحة الملف وصيغته (.xlsx أو .xls أو .csv).');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Dedicated Filter States for Equivalency Requests (Screen 2)
  const [eqSearchQuery, setEqSearchQuery] = useState('');
  const [eqStageFilter, setEqStageFilter] = useState('all');
  const [eqAppointmentFilter, setEqAppointmentFilter] = useState('all');
  const [eqResolutionFilter, setEqResolutionFilter] = useState<'all' | 'resolved' | 'pending'>('all');
  const [eqOfficerFilter, setEqOfficerFilter] = useState('all');
  const [eqWorkflowStatus, setEqWorkflowStatus] = useState<string>('new');

  // Detail Modal for survey
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyResponse | null>(null);

  // Dedicated Review & School Assignment Modal for New Registration Requests
  const [reviewRegistrationSurvey, setReviewRegistrationSurvey] = useState<SurveyResponse | null>(null);

  // Inline Calendar Scheduling State
  const [openCalendarSurveyId, setOpenCalendarSurveyId] = useState<string | null>(null);
  const [inlineCalData, setInlineCalData] = useState<Record<string, {
    calendarType: 'gregorian' | 'hijri';
    date: string;
    hijriDay?: number;
    hijriMonth?: number;
    hijriYear?: number;
    time: string;
    locationUrl: string;
  }>>({});

  // Appointment Modal for Equivalency
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedEqSurvey, setSelectedEqSurvey] = useState<SurveyResponse | null>(null);
  const [appointmentData, setAppointmentData] = useState({
    date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    time: '09:30',
    location: 'وحدة القبول - مبنى الشؤون التعليمية بالمدينة المنورة - صالة المراجعين',
    note: 'يرجى إحضار أصل الشهادة المعتمدة مع ترجمتها وبطاقة الهوية الوطنية أو الإقامة للمطابقة الحضورية.'
  });

  // Assign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetSurvey, setAssignTargetSurvey] = useState<SurveyResponse | null>(null);
  const [selectedOfficerForAssign, setSelectedOfficerForAssign] = useState(DEMO_OFFICERS[0].nameAr);
  const [assignNote, setAssignNote] = useState('');

  // Action Feedback Toast
  const [claimToastMessage, setClaimToastMessage] = useState<string | null>(null);

  // New Placement Pipeline States (Planning & Leadership Workflow)
  const [selectedWishForSurvey, setSelectedWishForSurvey] = useState<Record<string, string>>({});
  const [leadershipNotesText, setLeadershipNotesText] = useState<Record<string, string>>({});
  const [placementsSubTab, setPlacementsSubTab] = useState<'planning' | 'leadership' | 'general' | null>(null);

  // Custom Delete Confirmation Modal State
  const [deleteSurveyId, setDeleteSurveyId] = useState<string | null>(null);

  // Modals
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [officialReportData, setOfficialReportData] = useState<ReportExportData | null>(null);
  const [selectedReportsGovPart, setSelectedReportsGovPart] = useState<string>('all');
  const [showDateBackupModal, setShowDateBackupModal] = useState(false);
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearSuccessToast, setClearSuccessToast] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', code: '', stage: 'Primary', sector: 'North', gender: 'boys', capacity: 30 });
  
  // Schools Directory Excel Import & Clear Data States
  const schoolFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showClearSchoolsConfirmModal, setShowClearSchoolsConfirmModal] = useState(false);
  const [showSchoolImportModal, setShowSchoolImportModal] = useState(false);
  const [schoolImportMode, setSchoolImportMode] = useState<'merge' | 'replace'>('merge');
  const [schoolParsedData, setSchoolParsedData] = useState<{
    fileName: string;
    totalRows: number;
    rows: SchoolItem[];
    rawHeaders: string[];
  } | null>(null);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [dangerConfirmText, setDangerConfirmText] = useState('');

  // 1. Filtered Subsets for the Two Major Business Domains
  const admissionSurveys = useMemo(() => {
    return surveys.filter(s => isSurveyAdmissionOrTransferRequest(s));
  }, [surveys]);

  const equivalencySurveys = useMemo(() => {
    return surveys.filter(s => isSurveyEqualizationRequest(s));
  }, [surveys]);

  // Delayed requests over 2 business days list
  const delayedRequestsList = useMemo(() => {
    return getDelayedRequests(surveys);
  }, [surveys]);

  // Live KPI Calculations
  const stats = useMemo(() => {
    const total = surveys.length;
    const resolved = surveys.filter(s => s.isResolved).length;
    const resRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    
    // Calculate satisfaction
    const rated = surveys.filter(s => s.staffSatisfaction && s.staffSatisfaction > 0);
    const avgSat = rated.length > 0 
      ? (rated.reduce((acc, curr) => acc + (curr.staffSatisfaction || 0), 0) / rated.length).toFixed(1)
      : '0';
    
    // Negative alerts
    const negativeAlerts = surveys.filter(s => (s.staffSatisfaction && s.staffSatisfaction <= 2) || (s.receptionSatisfaction && s.receptionSatisfaction <= 2)).length;

    return { 
      total, 
      resolved, 
      resRate, 
      avgSat,
      negativeAlerts,
      admissionCount: admissionSurveys.length,
      equivalencyCount: equivalencySurveys.length,
      reportsCount: principalReports.length,
      feedbacksCount: beneficiaryFeedbacks.length,
      emailLogsCount: emailLogs.length,
      schoolsCount: schools.length,
      inquiriesCount: inquiries.length,
      newInquiriesCount: inquiries.filter(i => i.status === 'new').length,
      generalInquiriesCount: inquiries.filter(i => !i.claimedByOfficerId && i.status !== 'claimed' && i.status !== 'answered').length,
      myClaimedInquiriesCount: inquiries.filter(i => i.claimedByOfficerId === activeOfficer.id || i.answeredByOfficerId === activeOfficer.id).length,
      myPendingInquiriesCount: inquiries.filter(i => i.claimedByOfficerId === activeOfficer.id && i.status !== 'answered').length
    };
  }, [surveys, admissionSurveys, equivalencySurveys, principalReports, beneficiaryFeedbacks, emailLogs, schools, inquiries, activeOfficer.id]);

  // Statistical stage breakdown for admission & equivalency
  const stageStats = useMemo(() => {
    const isSec = (s: SurveyResponse) => {
      const stg = (s.stage || s.equalizationStage || '').trim().toLowerCase();
      return stg === 'secondary' || stg.includes('ثانو') || stg.includes('second');
    };
    const isInter = (s: SurveyResponse) => {
      const stg = (s.stage || s.equalizationStage || '').trim().toLowerCase();
      return stg === 'intermediate' || stg.includes('متوسط') || stg.includes('intermed');
    };
    const isPrim = (s: SurveyResponse) => {
      const stg = (s.stage || s.equalizationStage || '').trim().toLowerCase();
      return stg === 'primary' || stg === 'elementary' || stg.includes('ابتدائ') || stg.includes('primar') || stg.includes('element');
    };
    const isEarly = (s: SurveyResponse) => {
      const stg = (s.stage || s.equalizationStage || '').trim().toLowerCase();
      return stg === 'kindergarten' || stg.includes('طفول') || stg.includes('رياض') || stg.includes('روض') || stg.includes('kinder');
    };

    const admSurveys = surveys.filter(s => !isSurveyEqualizationRequest(s));
    const eqSurveys = surveys.filter(s => isSurveyEqualizationRequest(s));

    return {
      secAdmission: admSurveys.filter(isSec).length,
      interAdmission: admSurveys.filter(isInter).length,
      primAdmission: admSurveys.filter(isPrim).length,
      earlyChildhoodAdmission: admSurveys.filter(isEarly).length,
      secEq: eqSurveys.filter(isSec).length,
      interEq: eqSurveys.filter(isInter).length,
      primEq: eqSurveys.filter(isPrim).length,
    };
  }, [surveys]);

  // Calculations for all 8 governorate parts (المدينة المنورة، الحناكية، خيبر، بدر، وادي الفرع، المهد، ينبع، العلا)
  const governorateStatsList = useMemo(() => {
    return calculateAllGovernoratesStats(surveys, principalReports);
  }, [surveys, principalReports]);

  // Dynamic workflow count calculations for Admission & Transfer
  const workflowCounts = useMemo(() => {
    const isSentToSchool = (s: SurveyResponse) => Boolean(
      s.sentToSchoolPrincipal || 
      s.vacancyRequestStatus === 'vacancy_opened' ||
      s.vacancyRequestStatus === 'sent_to_school_principal' ||
      s.vacancyRequestStatus === 'approved' ||
      s.vacancyRequestStatus === 'staffing_confirmed' ||
      s.vacancyRequestStatus === 'executed'
    );

    return {
      all: admissionSurveys.length,
      new: admissionSurveys.filter(s => !s.isResolved && !isSentToSchool(s) && (!s.serviceEmployee || s.serviceEmployee === 'غير مسند')).length,
      my: admissionSurveys.filter(s => (s.serviceEmployee === activeOfficer.nameAr || s.assignedOfficerId === activeOfficer.id) && !s.isResolved && !isSentToSchool(s)).length,
      sentToSchool: admissionSurveys.filter(s => !s.isResolved && isSentToSchool(s)).length,
      leadership: admissionSurveys.filter(s => !!s.sentToLeadership).length,
      vacancy: admissionSurveys.filter(s => s.vacancyRequestStatus === 'vacancy_opened' || s.isVacancyRequest).length,
      principal: admissionSurveys.filter(s => !!s.sentToSchoolPrincipal).length,
      placement: admissionSurveys.filter(s => !!s.staffingConfirmedAt || s.principalConfirmedStaffing).length,
      archive: admissionSurveys.filter(s => s.isResolved).length
    };
  }, [admissionSurveys, activeOfficer]);

  // Dynamic workflow counts for Equivalency Requests
  const equivalencyWorkflowCounts = useMemo(() => {
    const isSentToSchool = (s: SurveyResponse) => Boolean(
      s.sentToSchoolPrincipal || 
      s.vacancyRequestStatus === 'vacancy_opened' ||
      s.vacancyRequestStatus === 'sent_to_school_principal' ||
      s.vacancyRequestStatus === 'approved' ||
      s.vacancyRequestStatus === 'staffing_confirmed' ||
      s.vacancyRequestStatus === 'executed'
    );

    return {
      all: equivalencySurveys.length,
      new: equivalencySurveys.filter(s => !s.isResolved && (!s.serviceEmployee || s.serviceEmployee === 'غير مسند')).length,
      my: equivalencySurveys.filter(s => (s.serviceEmployee === activeOfficer.nameAr || s.assignedOfficerId === activeOfficer.id) && !s.isResolved && !s.appointmentConfirmedByBeneficiary && !isSentToSchool(s)).length,
      confirmed: equivalencySurveys.filter(s => Boolean(s.appointmentConfirmedByBeneficiary) && !s.isResolved && !isSentToSchool(s)).length,
      sentToSchool: equivalencySurveys.filter(s => !s.isResolved && isSentToSchool(s)).length,
      archive: equivalencySurveys.filter(s => s.isResolved).length,
      primary: equivalencySurveys.filter(s => s.stage === 'Primary' || s.equalizationStage === 'primary').length,
      intermediate: equivalencySurveys.filter(s => s.stage === 'Intermediate' || s.equalizationStage === 'intermediate').length,
      secondary: equivalencySurveys.filter(s => s.stage === 'Secondary' || s.equalizationStage === 'secondary').length,
      hasAppointment: equivalencySurveys.filter(s => Boolean(s.hasReviewAppointment)).length,
      pendingAppointment: equivalencySurveys.filter(s => !s.hasReviewAppointment && !s.isResolved).length,
      resolved: equivalencySurveys.filter(s => s.isResolved || Boolean(s.equalizationCompleted)).length
    };
  }, [equivalencySurveys, activeOfficer]);

  // Filtering surveys for Screen 1: Admission & Transfer Requests
  const filteredAdmissionSurveys = useMemo(() => {
    return admissionSurveys.filter(s => {
      const matchesSearch = matchesSearchQuery([
        s.beneficiaryName, 
        s.phoneNumber, 
        s.id, 
        s.schoolName, 
        s.nationalId, 
        s.parentName, 
        s.district
      ], searchQuery);
      
      const matchesStage = stageFilter === 'all' ? true : s.stage === stageFilter;
      const matchesProblem = problemFilter === 'all' ? true : s.problemType === problemFilter;
      const matchesResolution = resolutionFilter === 'all' 
        ? true 
        : (resolutionFilter === 'resolved' ? s.isResolved : !s.isResolved);
      
      const matchesOfficer = officerFilter === 'all' ? true : s.serviceEmployee === officerFilter;

      // Workflow status
      let matchesWorkflow = true;
      const isSentToSchool = (s: SurveyResponse) => Boolean(
        s.sentToSchoolPrincipal || 
        s.vacancyRequestStatus === 'vacancy_opened' ||
        s.vacancyRequestStatus === 'sent_to_school_principal' ||
        s.vacancyRequestStatus === 'approved' ||
        s.vacancyRequestStatus === 'staffing_confirmed' ||
        s.vacancyRequestStatus === 'executed'
      );

      if (workflowStatus === 'new') matchesWorkflow = !s.isResolved && !isSentToSchool(s) && (!s.serviceEmployee || s.serviceEmployee === 'غير مسند');
      if (workflowStatus === 'my') matchesWorkflow = (s.serviceEmployee === activeOfficer.nameAr || s.assignedOfficerId === activeOfficer.id) && !s.isResolved && !isSentToSchool(s);
      if (workflowStatus === 'sent_to_school') matchesWorkflow = !s.isResolved && isSentToSchool(s);
      if (workflowStatus === 'leadership') matchesWorkflow = !!s.sentToLeadership;
      if (workflowStatus === 'vacancy') matchesWorkflow = s.vacancyRequestStatus === 'vacancy_opened' || !!s.isVacancyRequest;
      if (workflowStatus === 'principal') matchesWorkflow = !!s.sentToSchoolPrincipal;
      if (workflowStatus === 'placement') matchesWorkflow = !!s.staffingConfirmedAt || !!s.principalConfirmedStaffing;
      if (workflowStatus === 'archive') matchesWorkflow = s.isResolved;

      // Type filter (New registration vs Transfer)
      let matchesType = true;
      if (typeFilter === 'registration') matchesType = !isSurveyTransferRequest(s);
      if (typeFilter === 'transfer') matchesType = isSurveyTransferRequest(s);

      // My requests toggle
      const matchesMyToggle = showMyRequestsOnly ? (s.serviceEmployee === activeOfficer.nameAr || s.assignedOfficerId === activeOfficer.id) : true;

      return matchesSearch && matchesStage && matchesProblem && matchesResolution && matchesWorkflow && matchesType && matchesMyToggle && matchesOfficer;
    });
  }, [admissionSurveys, searchQuery, stageFilter, problemFilter, officerFilter, resolutionFilter, workflowStatus, typeFilter, showMyRequestsOnly, activeOfficer]);

  // Filtering surveys for Screen 2: Equivalency Requests
  const filteredEquivalencySurveys = useMemo(() => {
    return equivalencySurveys.filter(s => {
      const matchesSearch = matchesSearchQuery([
        s.beneficiaryName, 
        s.phoneNumber, 
        s.id, 
        s.schoolName, 
        s.nationalId, 
        s.parentName, 
        s.district,
        s.equalizationNotes
      ], eqSearchQuery);
      
      const matchesStage = eqStageFilter === 'all' ? true : (s.stage === eqStageFilter || s.equalizationStage?.toLowerCase() === eqStageFilter.toLowerCase());
      
      let matchesAppointment = true;
      if (eqAppointmentFilter === 'has_appointment') matchesAppointment = Boolean(s.hasReviewAppointment);
      if (eqAppointmentFilter === 'pending_appointment') matchesAppointment = !s.hasReviewAppointment && !s.isResolved;
      if (eqAppointmentFilter === 'confirmed') matchesAppointment = Boolean(s.appointmentConfirmedByBeneficiary);

      const matchesResolution = eqResolutionFilter === 'all' 
        ? true 
        : (eqResolutionFilter === 'resolved' ? (s.isResolved || Boolean(s.equalizationCompleted)) : (!s.isResolved && !s.equalizationCompleted));
      
      const matchesOfficer = eqOfficerFilter === 'all' ? true : (s.serviceEmployee === eqOfficerFilter || s.receivedByEqOfficerName === eqOfficerFilter);

      // Workflow status
      let matchesWorkflow = true;
      const isSentToSchool = (s: SurveyResponse) => Boolean(
        s.sentToSchoolPrincipal || 
        s.vacancyRequestStatus === 'vacancy_opened' ||
        s.vacancyRequestStatus === 'sent_to_school_principal' ||
        s.vacancyRequestStatus === 'approved' ||
        s.vacancyRequestStatus === 'staffing_confirmed' ||
        s.vacancyRequestStatus === 'executed'
      );

      if (eqWorkflowStatus === 'new') matchesWorkflow = !s.isResolved && (!s.serviceEmployee || s.serviceEmployee === 'غير مسند');
      if (eqWorkflowStatus === 'my') matchesWorkflow = (s.serviceEmployee === activeOfficer.nameAr || s.assignedOfficerId === activeOfficer.id) && !s.isResolved && !s.appointmentConfirmedByBeneficiary && !isSentToSchool(s);
      if (eqWorkflowStatus === 'confirmed') matchesWorkflow = Boolean(s.appointmentConfirmedByBeneficiary) && !s.isResolved && !isSentToSchool(s);
      if (eqWorkflowStatus === 'sent_to_school') matchesWorkflow = !s.isResolved && isSentToSchool(s);
      if (eqWorkflowStatus === 'archive') matchesWorkflow = s.isResolved;

      return matchesSearch && matchesStage && matchesAppointment && matchesResolution && matchesOfficer && matchesWorkflow;
    });
  }, [equivalencySurveys, eqSearchQuery, eqStageFilter, eqAppointmentFilter, eqResolutionFilter, eqOfficerFilter, eqWorkflowStatus, activeOfficer]);

  // Claim Request Handler for Admission Supervisor
  const handleClaimAdmissionSurvey = (survey: SurveyResponse) => {
    const updated: SurveyResponse = {
      ...survey,
      serviceEmployee: activeOfficer.nameAr,
      assignedOfficerId: activeOfficer.id,
      isReceived: true,
      receivedAt: new Date().toISOString()
    };
    onUpdateSurvey(updated);
    setClaimToastMessage(`تم استلام المعاملة وتوجيهها لمشرف القبول والتسجيل (${activeOfficer.nameAr}) بنجاح ✓`);
    setTimeout(() => setClaimToastMessage(null), 4000);
  };

  // 1. Send Request to School Principal to Add Student File
  const handleSendToPrincipalForStudentFile = (survey: SurveyResponse) => {
    const targetSchool = survey.assignedRegistrationSchool || survey.schoolName || 'المدرسة';
    const updated: SurveyResponse = {
      ...survey,
      sentToSchoolPrincipal: true,
      sentToPrincipalAt: new Date().toISOString(),
      principalTaskType: 'add_student_file'
    };
    onUpdateSurvey(updated);
    setClaimToastMessage(`تم إرسال الطلب بنجاح إلى مدير ${targetSchool} لإضافة ملف الطالب 🏫✓`);
    setTimeout(() => setClaimToastMessage(null), 4000);
  };

  // 2. Request Opening Vacancy from Planning Officer
  const handleSendToPlanning = (survey: SurveyResponse) => {
    const targetSchool = survey.assignedRegistrationSchool || survey.schoolName || survey.firstSchoolName || '';
    const updated: SurveyResponse = {
      ...survey,
      ...(targetSchool && !survey.assignedRegistrationSchool ? { assignedRegistrationSchool: targetSchool } : {}),
      isVacancyRequest: true,
      vacancyRequestStatus: 'pending',
      referredToPlanningAt: new Date().toISOString(),
      eqReferredToPlanningAt: new Date().toISOString()
    };
    onUpdateSurvey(updated);
    setClaimToastMessage("تم إرسال طلب فتح شاغر بنجاح لمسؤول التخطيط والميزانيات المدرسية 🔓✓");
    setTimeout(() => setClaimToastMessage(null), 4000);
  };

  // 3. Send Request to School Leadership Officer for Follow-up
  const handleSendToLeadership = (survey: SurveyResponse) => {
    const updated: SurveyResponse = {
      ...survey,
      sentToLeadership: true,
      sentToLeadershipAt: new Date().toISOString()
    };
    onUpdateSurvey(updated);
    setClaimToastMessage("تم إرسال متابعة الطلب بنجاح إلى مسؤول القيادة المدرسية للمتابعة والإشراف 👤✓");
    setTimeout(() => setClaimToastMessage(null), 4000);
  };

  // Claim Request Handler for Equivalency Supervisor
  const handleClaimEquivalencySurvey = (survey: SurveyResponse) => {
    const updated: SurveyResponse = {
      ...survey,
      serviceEmployee: activeOfficer.nameAr,
      assignedOfficerId: activeOfficer.id,
      isReceivedByEqOfficer: true,
      receivedByEqOfficerName: activeOfficer.nameAr,
      eqReceivedAt: new Date().toISOString()
    };
    onUpdateSurvey(updated);
    setClaimToastMessage(`تم استلام طلب المعادلة لمشرف القبول معادلة الشهادات (${activeOfficer.nameAr}) بنجاح ✓`);
    setTimeout(() => setClaimToastMessage(null), 4000);
  };

  // Schedule Appointment Handler
  const handleSaveAppointment = () => {
    if (!selectedEqSurvey) return;
    const updated: SurveyResponse = {
      ...selectedEqSurvey,
      hasReviewAppointment: true,
      appointmentDate: appointmentData.date,
      appointmentTime: appointmentData.time,
      appointmentLocationLink: appointmentData.location,
      appointmentNote: appointmentData.note,
      appointmentSetAt: new Date().toISOString(),
      appointmentSetBy: activeOfficer.nameAr,
      serviceEmployee: selectedEqSurvey.serviceEmployee || activeOfficer.nameAr
    };
    onUpdateSurvey(updated);
    setShowAppointmentModal(false);
    setSelectedEqSurvey(null);
    setClaimToastMessage('تم جدولة موعد المراجعة الحضورية للمستفيد بنجاح 📅');
    setTimeout(() => setClaimToastMessage(null), 4000);
  };

  // Approve Equivalency Handler
  const handleApproveEquivalency = (survey: SurveyResponse) => {
    const isStaffed = Boolean(survey.staffingConfirmedAt || survey.principalConfirmedStaffing);
    const updated: SurveyResponse = {
      ...survey,
      isResolved: isStaffed,
      resolvedAt: isStaffed ? new Date().toISOString() : survey.resolvedAt,
      equalizationCompleted: true,
      equalizationNotes: `تم اعتماد معادلة المؤهل ومطابقة الشهادة بواسطة ${activeOfficer.nameAr} بتاريخ ${new Date().toLocaleDateString('ar-SA')}`,
      serviceEmployee: survey.serviceEmployee || activeOfficer.nameAr
    };
    onUpdateSurvey(updated);
    if (isStaffed) {
      setClaimToastMessage('تم اعتماد المعادلة ومطابقتها وأرشفة المعاملة بنجاح ✓');
    } else {
      setClaimToastMessage('تم اعتماد ومطابقة معادلة المؤهل بنجاح. يلزم تسكين الطالب من المدرسة قبل الأرشفة 📄');
    }
    setTimeout(() => setClaimToastMessage(null), 4000);
  };

  // File Upload Handler for Equivalency Certificates from Device (Allows multiple files > 3)
  const handleFileUpload = (survey: SurveyResponse, event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const promises = filesArray.map(file => {
      return new Promise<{ name: string; type: string; data: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            type: file.type || 'application/pdf',
            data: e.target?.result as string
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((newAttachments) => {
      const updatedAttachments = [...(survey.attachments || []), ...newAttachments];
      const uploadedNames = filesArray.map(f => f.name).join('، ');
      onUpdateSurvey({
        ...survey,
        attachments: updatedAttachments,
        equalizationNotes: `${survey.equalizationNotes || ''}\nتم إرفاق ملفات المعادلة (${filesArray.length}): ${uploadedNames} بتاريخ ${new Date().toLocaleDateString('ar-SA')}`
      });
      setClaimToastMessage(`تم رفع وتوثيق (${filesArray.length}) ملف/ملفات معادلة بنجاح 📤 (المجموع الحالي: ${updatedAttachments.length})`);
      setTimeout(() => setClaimToastMessage(null), 4000);
    });

    event.target.value = '';
  };

  // Delete individual attachment handler
  const handleDeleteAttachment = (survey: SurveyResponse, indexToDelete: number) => {
    const currentAttachments = survey.attachments || [];
    const removedItem = currentAttachments[indexToDelete];
    const updatedAttachments = currentAttachments.filter((_, idx) => idx !== indexToDelete);
    onUpdateSurvey({
      ...survey,
      attachments: updatedAttachments
    });
    setClaimToastMessage(`تم حذف الملف المرفق: ${removedItem?.name || ''} 🗑️`);
    setTimeout(() => setClaimToastMessage(null), 3000);
  };

  // Assign To Officer Handler
  const handleAssignToOfficer = () => {
    if (!assignTargetSurvey) return;
    const targetOfficer = DEMO_OFFICERS.find(o => o.nameAr === selectedOfficerForAssign) || DEMO_OFFICERS[0];
    const updated: SurveyResponse = {
      ...assignTargetSurvey,
      serviceEmployee: targetOfficer.nameAr,
      assignedOfficerId: targetOfficer.id,
      assignmentNotes: assignNote || 'تمت الإحالة للمتابعة والدراسة'
    };
    onUpdateSurvey(updated);
    if (onAssignSurvey) {
      onAssignSurvey(assignTargetSurvey.id, targetOfficer.id, targetOfficer.nameAr, assignNote || 'إحالة رسمية', 'admin');
    }
    setClaimToastMessage(`تمت إحالة المعاملة بنجاح إلى المشرف: ${targetOfficer.nameAr} 👤`);
    setTimeout(() => setClaimToastMessage(null), 4000);
    setShowAssignModal(false);
    setAssignTargetSurvey(null);
    setAssignNote('');
  };

  const handleSwitchToOfficer = (officer: OfficerUser) => {
    setActiveOfficer(officer);
    try {
      localStorage.setItem('active_officer_id_v1', officer.id);
    } catch {}

    // Automatically navigate to the officer's dedicated view based on their role
    if (officer.role === 'equivalency_supervisor') {
      setActiveFeature('equivalency_requests');
    } else if (
      officer.role === 'school_planning' ||
      officer.role === 'school_leadership' ||
      officer.role === 'planning_vacancy_supervisor' ||
      officer.role === 'primary_school_supervisor' ||
      officer.role === 'intermediate_school_supervisor' ||
      officer.role === 'secondary_school_supervisor' ||
      officer.role === 'early_childhood_official' ||
      officer.role === 'kindergarten_official'
    ) {
      setActiveFeature('placements');
    } else if (officer.role === 'tech_support_supervisor') {
      setActiveFeature('inquiries');
    } else {
      setActiveFeature('requests');
    }

    setClaimToastMessage(`✅ تم الانتقال بنجاح إلى حساب وصفحة الموظف: (${officer.nameAr})`);
    setTimeout(() => setClaimToastMessage(null), 3500);
  };

  const handleAddUser = (newUser: OfficerUser) => {
    setOfficers(prev => {
      const updated = [...prev, newUser];
      try { localStorage.setItem('officer_users_v4', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setShowAddUserModal(false);
    setClaimToastMessage(`✅ تمت إضافة المستخدم (${newUser.nameAr}) بنجاح`);
    setTimeout(() => setClaimToastMessage(null), 3000);
  };


  // Helper for Inline Calendar Data
  const HIJRI_MONTHS = [
    { value: 1, label: '01 - مُحَرَّم' },
    { value: 2, label: '02 - صَفَر' },
    { value: 3, label: '03 - رَبِيع الأوَّل' },
    { value: 4, label: '04 - رَبِيع الآخِر' },
    { value: 5, label: '05 - جُمَادَى الأُولَى' },
    { value: 6, label: '06 - جُمَادَى الآخِرَة' },
    { value: 7, label: '07 - رَجَب' },
    { value: 8, label: '08 - شَعْبَان' },
    { value: 9, label: '09 - رَمَضَان' },
    { value: 10, label: '10 - شَوَّال' },
    { value: 11, label: '11 - ذُو القَعْدَة' },
    { value: 12, label: '12 - ذُو الحِجَّة' }
  ];

  // Hijri <-> Gregorian conversion algorithms (Kuwaiti / Umm al-Qura approximation)
  const gregorianToHijriParts = (gDate: Date) => {
    let day = gDate.getDate();
    let month = gDate.getMonth();
    let year = gDate.getFullYear();

    let m = month + 1;
    let y = year;
    if (m < 3) {
      y -= 1;
      m += 12;
    }

    let a = Math.floor(y / 100);
    let b = 2 - a + Math.floor(a / 4);
    if (y < 1583) b = 0;
    if (y === 1582) {
      if (m > 10) b = -10;
      if (m === 10) {
        b = 0;
        if (day > 4) b = -10;
      }
    }

    let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
    b = 0;
    if (jd > 2299160) {
      a = Math.floor((jd - 1867216.25) / 36524.25);
      b = 1 + a - Math.floor(a / 4);
    }
    let bb = jd + b + 1524;
    let cc = Math.floor((bb - 122.1) / 365.25);
    let dd = Math.floor(365.25 * cc);
    let ee = Math.floor((bb - dd) / 30.6001);
    day = (bb - dd) - Math.floor(30.6001 * ee);
    month = ee - 1;
    if (ee > 13) {
      cc += 1;
      month = ee - 13;
    }
    year = cc - 4716;

    let wd = (jd + 1) % 7;
    let iyear = 10631 / 30;
    let epochastro = 1948084;
    let shift1 = 8.01 / 60;

    let z = jd - epochastro;
    let cyc = Math.floor(z / 10631);
    z = z - 10631 * cyc;
    let j = Math.floor((z - shift1) / iyear);
    let iy = 30 * cyc + j;
    z = z - Math.floor(j * iyear + shift1);
    let im = Math.floor((z + 28.5001) / 29.5);
    if (im === 13) im = 12;
    let id = z - Math.floor(29.5001 * im - 29);

    return {
      hDay: Math.max(1, Math.min(30, Math.floor(id))),
      hMonth: Math.max(1, Math.min(12, Math.floor(im))),
      hYear: Math.floor(iy)
    };
  };

  const hijriToGregorianString = (hYear: number, hMonth: number, hDay: number) => {
    let iy = hYear;
    let im = hMonth;
    let id = hDay;
    let ii = iy - 1;
    let iln = ii * 354 + Math.floor((3 + 11 * ii) / 30) + id;
    let i = 1;
    while (i < im) {
      iln += (i % 2 === 1) ? 30 : 29;
      i++;
    }
    let jd = iln + 1948440 - 385;

    let b = 0;
    if (jd > 2299160) {
      let a = Math.floor((jd - 1867216.25) / 36524.25);
      b = 1 + a - Math.floor(a / 4);
    }
    let bb = jd + b + 1524;
    let cc = Math.floor((bb - 122.1) / 365.25);
    let dd = Math.floor(365.25 * cc);
    let ee = Math.floor((bb - dd) / 30.6001);
    let day = Math.floor((bb - dd) - Math.floor(30.6001 * ee));
    let month = Math.floor(ee - 1);
    if (ee > 13) {
      cc += 1;
      month = Math.floor(ee - 13);
    }
    let year = Math.floor(cc - 4716);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
  };

  const getSurveyCalData = (s: SurveyResponse) => {
    const initialDate = s.appointmentDate || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
    const parsedDate = new Date(initialDate);
    const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const { hDay, hMonth, hYear } = gregorianToHijriParts(validDate);

    return inlineCalData[s.id] || {
      calendarType: 'gregorian' as const,
      date: initialDate,
      hijriDay: hDay,
      hijriMonth: hMonth,
      hijriYear: hYear,
      time: s.appointmentTime || '09:00 صباحاً',
      locationUrl: s.appointmentLocationLink || 'https://maps.google.com/?q=إدارة+التعليم+قسم+معادلة+الشهادات+والقبول'
    };
  };

  const updateSurveyCalData = (surveyId: string, updates: Partial<{
    calendarType: 'gregorian' | 'hijri';
    date: string;
    hijriDay: number;
    hijriMonth: number;
    hijriYear: number;
    time: string;
    locationUrl: string;
  }>) => {
    setInlineCalData(prev => {
      const current = prev[surveyId] || {
        calendarType: 'gregorian',
        date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        hijriDay: 15,
        hijriMonth: 3,
        hijriYear: 1448,
        time: '09:00 صباحاً',
        locationUrl: 'https://maps.google.com/?q=إدارة+التعليم+قسم+معادلة+الشهادات+والقبول'
      };

      const merged = { ...current, ...updates };

      // If Gregorian date updated, automatically sync Hijri parts
      if (updates.date && !updates.hijriDay && !updates.hijriMonth && !updates.hijriYear) {
        const d = new Date(updates.date);
        if (!isNaN(d.getTime())) {
          const hp = gregorianToHijriParts(d);
          merged.hijriDay = hp.hDay;
          merged.hijriMonth = hp.hMonth;
          merged.hijriYear = hp.hYear;
        }
      }

      // If Hijri parts updated, automatically compute and sync Gregorian date
      if (updates.hijriDay !== undefined || updates.hijriMonth !== undefined || updates.hijriYear !== undefined) {
        const hY = updates.hijriYear !== undefined ? updates.hijriYear : merged.hijriYear;
        const hM = updates.hijriMonth !== undefined ? updates.hijriMonth : merged.hijriMonth;
        const hD = updates.hijriDay !== undefined ? updates.hijriDay : merged.hijriDay;
        const syncGregDate = hijriToGregorianString(hY, hM, hD);
        merged.date = syncGregDate;
        // Ensure Hijri parts are also synced back to merged for immediate UI feedback
        merged.hijriDay = hD;
        merged.hijriMonth = hM;
        merged.hijriYear = hY;
      }

      return {
        ...prev,
        [surveyId]: merged
      };
    });
  };

  const getHijriFormattedDate = (dateStr: string, hijriDay?: number, hijriMonth?: number, hijriYear?: number) => {
    if (hijriDay && hijriMonth && hijriYear) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${hijriYear}/${pad(hijriMonth)}/${pad(hijriDay)} هـ`;
    }
    if (!dateStr) return 'اختر تاريخاً بالروزنامة';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'اختر تاريخاً بالروزنامة';
      const parts = gregorianToHijriParts(d);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${parts.hYear}/${pad(parts.hMonth)}/${pad(parts.hDay)} هـ`;
    } catch {
      return 'اختر تاريخاً بالروزنامة';
    }
  };

  const handleGetGPSLocation = (surveyId: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
          updateSurveyCalData(surveyId, { locationUrl: link });
          if (navigator.clipboard) {
            navigator.clipboard.writeText(link);
          }
          setClaimToastMessage('تم إرفاق إحداثيات موقعك الحالي (GPS) ونسخ الرابط 📍');
          setTimeout(() => setClaimToastMessage(null), 3500);
        },
        () => {
          const defaultLink = 'https://maps.google.com/?q=إدارة+التعليم+قسم+معادلة+الشهادات+والقبول';
          updateSurveyCalData(surveyId, { locationUrl: defaultLink });
          setClaimToastMessage('تم إرفاق وتثبيت رابط موقع المقر في خرائط Google 📍');
          setTimeout(() => setClaimToastMessage(null), 3500);
        }
      );
    } else {
      const defaultLink = 'https://maps.google.com/?q=إدارة+التعليم+قسم+معادلة+الشهادات+والقبول';
      updateSurveyCalData(surveyId, { locationUrl: defaultLink });
      setClaimToastMessage('تم إرفاق رابط خرائط Google بنجاح 📍');
      setTimeout(() => setClaimToastMessage(null), 3500);
    }
  };

  const handleSaveInlineAppointment = (survey: SurveyResponse) => {
    const data = getSurveyCalData(survey);
    const updated: SurveyResponse = {
      ...survey,
      appointmentDate: data.date,
      appointmentTime: data.time,
      appointmentLocationLink: data.locationUrl,
      hasReviewAppointment: true,
      appointmentSetAt: survey.appointmentSetAt || new Date().toISOString(),
      appointmentSetBy: survey.appointmentSetBy || activeOfficer.nameAr,
      equalizationNotes: `${survey.equalizationNotes || ''}\nتم تحديد موعد مراجعة حضوري للمستفيد: ${data.date} (${data.time}) - مقر المراجعة: ${data.locationUrl}`
    };
    onUpdateSurvey(updated);
    setOpenCalendarSurveyId(null);
    setClaimToastMessage(`تم حفظ وإرسال الموعد والموقع بنجاح للمستفيد: ${data.date} (${data.time}) 📅`);
    setTimeout(() => setClaimToastMessage(null), 4000);
  };

  // Render Inline Appointment Scheduler Exactly Matching the User Image
  const renderAppointmentScheduler = (s: SurveyResponse) => {
    const isOpen = openCalendarSurveyId === s.id;
    const cal = getSurveyCalData(s);
    const hijriDate = getHijriFormattedDate(cal.date);

    return (
      <div className="space-y-1.5 text-right font-sans w-full max-w-[400px] mx-auto md:mr-auto md:ml-0">
        {/* Step 2 Header Title */}
        <div className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1.5">
          <span>2. أيقونة تحديد موعد للمستفيد</span>
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
        </div>

        {!isOpen ? (
          <button
            type="button"
            onClick={() => setOpenCalendarSurveyId(s.id)}
            className="w-full py-2 px-3 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-black text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>📅 2. أيقونة تحديد موعد للمستفيد</span>
          </button>
        ) : (
          <div className="space-y-2 animate-fadeIn">
            {/* Top Close Button: إغلاق الروزنامة */}
            <button
              type="button"
              onClick={() => setOpenCalendarSurveyId(null)}
              className="w-full py-2 px-3 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-black text-[11px] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Calendar className="w-4 h-4" />
              <X className="w-3.5 h-3.5" />
              <span>إغلاق الروزنامة</span>
            </button>

            {/* Amber Container matching the exact UI from user image */}
            <div className="p-3 rounded-2xl border-2 border-[#f59e0b] bg-[#fffdf5] dark:bg-[#1a1708] text-slate-900 dark:text-amber-100 shadow-sm space-y-3">
              {/* Row 1: تحديد الروزنامة والتقويم with Greg/Hijri Switch */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 bg-amber-100/60 dark:bg-amber-950/60 p-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                  <button
                    type="button"
                    onClick={() => updateSurveyCalData(s.id, { calendarType: 'gregorian' })}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                      cal.calendarType === 'gregorian'
                        ? 'bg-[#d97706] text-white shadow-xs'
                        : 'text-amber-900 dark:text-amber-300'
                    }`}
                  >
                    <span>📅</span>
                    <span>تاريخ ميلادي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSurveyCalData(s.id, { calendarType: 'hijri' })}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                      cal.calendarType === 'hijri'
                        ? 'bg-[#d97706] text-white shadow-xs'
                        : 'text-amber-900 dark:text-amber-300'
                    }`}
                  >
                    <span>🌙</span>
                    <span>تاريخ هجري</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 font-black text-[10px] text-slate-900 dark:text-white">
                  <span>تحديد الروزنامة والتقويم:</span>
                  <span>📅</span>
                </div>
              </div>

              {/* Row 2: Date Picker & Hijri Equivalent / Switchable Controls */}
              {cal.calendarType === 'hijri' ? (
                /* HIJRI INTERACTIVE PICKER */
                <div className="space-y-1.5 p-2 rounded-xl border border-amber-300 dark:border-amber-700/70 bg-amber-50/40 dark:bg-amber-950/30">
                  <div className="flex items-center justify-between text-[9px] font-black text-amber-900 dark:text-amber-300">
                    <span className="font-mono text-slate-800 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      الميلادي المقابل: {cal.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>🌙</span>
                      <span>اختر التاريخ الهجري (يوم / شهر / سنة):</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {/* Hijri Year */}
                    <div>
                      <label className="block text-[8px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 text-center">السنة الهجرية</label>
                      <select
                        value={cal.hijriYear || 1448}
                        onChange={(e) => updateSurveyCalData(s.id, { hijriYear: parseInt(e.target.value) })}
                        className="w-full py-1 px-1 rounded-lg border border-amber-300 dark:border-amber-700/70 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-800 dark:text-white text-center font-mono cursor-pointer outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {[1445, 1446, 1447, 1448, 1449, 1450].map(y => (
                          <option key={y} value={y}>{y} هـ</option>
                        ))}
                      </select>
                    </div>

                    {/* Hijri Month */}
                    <div>
                      <label className="block text-[8px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 text-center">الشهر الهجري</label>
                      <select
                        value={cal.hijriMonth || 1}
                        onChange={(e) => updateSurveyCalData(s.id, { hijriMonth: parseInt(e.target.value) })}
                        className="w-full py-1 px-1 rounded-lg border border-amber-300 dark:border-amber-700/70 bg-white dark:bg-slate-900 text-[9.5px] font-bold text-slate-800 dark:text-white text-center cursor-pointer outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {HIJRI_MONTHS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Hijri Day */}
                    <div>
                      <label className="block text-[8px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 text-center">اليوم الهجري</label>
                      <select
                        value={cal.hijriDay || 1}
                        onChange={(e) => updateSurveyCalData(s.id, { hijriDay: parseInt(e.target.value) })}
                        className="w-full py-1 px-1 rounded-lg border border-amber-300 dark:border-amber-700/70 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-800 dark:text-white text-center font-mono cursor-pointer outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* GREGORIAN PICKER WITH HIJRI EQUIVALENT CARD */
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Left side: Hijri Equivalent */}
                  <div className="py-1 px-2 rounded-xl border border-amber-300 dark:border-amber-700/70 bg-amber-50/50 dark:bg-amber-950/40 flex flex-col justify-center items-center text-center">
                    <span className="text-[8px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-0.5">
                      <span>🌙</span>
                      <span>المكافئ الهجري:</span>
                    </span>
                    <span className="text-[9px] font-black text-slate-800 dark:text-white font-mono truncate max-w-full">
                      {hijriDate}
                    </span>
                  </div>

                  {/* Right side: Date Picker */}
                  <div>
                    <input
                      type="date"
                      value={cal.date}
                      onChange={(e) => updateSurveyCalData(s.id, { date: e.target.value })}
                      className="w-full py-1 px-2 rounded-xl border border-amber-300 dark:border-amber-700/70 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer text-center font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Row 3: تحديد الساعة والوقت */}
              <div className="space-y-1">
                <div className="flex items-center justify-end gap-1 font-black text-[10px] text-slate-900 dark:text-white">
                  <span>تحديد الساعة والوقت:</span>
                  <span>⏰</span>
                </div>
                <select
                  value={cal.time}
                  onChange={(e) => updateSurveyCalData(s.id, { time: e.target.value })}
                  className="w-full py-1.5 px-3 rounded-xl border border-amber-300 dark:border-amber-700/70 bg-white dark:bg-slate-900 text-xs font-black text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer text-center"
                >
                  <option value="08:00 صباحاً">08:00 صباحاً</option>
                  <option value="08:30 صباحاً">08:30 صباحاً</option>
                  <option value="09:00 صباحاً">09:00 صباحاً</option>
                  <option value="09:30 صباحاً">09:30 صباحاً</option>
                  <option value="10:00 صباحاً">10:00 صباحاً</option>
                  <option value="10:30 صباحاً">10:30 صباحاً</option>
                  <option value="11:00 صباحاً">11:00 صباحاً</option>
                  <option value="11:30 صباحاً">11:30 صباحاً</option>
                  <option value="12:00 مساءً">12:00 مساءً</option>
                  <option value="12:30 مساءً">12:30 مساءً</option>
                  <option value="01:00 مساءً">01:00 مساءً</option>
                  <option value="01:30 مساءً">01:30 مساءً</option>
                </select>
              </div>

              {/* Row 4: إرفاق رابط/بيانات الموقع الحالي لمقر المراجعة */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-end gap-1 font-black text-[10px] text-slate-900 dark:text-white">
                  <span>إرفاق رابط/بيانات الموقع الحالي لمقر المراجعة:</span>
                  <span>📍</span>
                </div>

                {/* GPS and Google Maps Action Buttons */}
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => handleGetGPSLocation(s.id)}
                    className="flex-1 py-1 px-1.5 bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#15803d] border border-[#bbf7d0] rounded-lg text-[8.5px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="تحديد الموقع الجغرافي الحالي وإرفاقه"
                  >
                    <span>📍</span>
                    <span>إرفاق موقعي الحالي (GPS) ونسخ الرابط</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(cal.locationUrl || 'https://maps.google.com', '_blank', 'noopener,noreferrer')}
                    className="py-1 px-2 bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0369a1] border border-[#bae6fd] rounded-lg text-[8.5px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="فتح الموقع في خرائط Google"
                  >
                    <span>🗺️</span>
                    <span>فتح خرائط Google</span>
                  </button>
                </div>

                {/* URL Input Box */}
                <input
                  type="text"
                  value={cal.locationUrl}
                  onChange={(e) => updateSurveyCalData(s.id, { locationUrl: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full py-1.5 px-2 rounded-xl border border-amber-300 dark:border-amber-700/70 bg-white dark:bg-slate-900 text-[9.5px] font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-500 text-left"
                  dir="ltr"
                />
              </div>

              {/* Row 5: Save & Send Button */}
              <button
                type="button"
                onClick={() => handleSaveInlineAppointment(s)}
                className="w-full py-2 px-3 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-black text-[11px] flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>حفظ وإرسال الموعد والموقع للمستفيد</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing appointment info tag if already scheduled */}
        {s.hasReviewAppointment && !isOpen && (
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-1 text-[9.5px]">
            <div className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>موعد محدد: {s.appointmentDate} ({s.appointmentTime})</span>
            </div>
            {s.appointmentLocationLink && (
              <a
                href={s.appointmentLocationLink}
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 dark:text-teal-400 underline text-[9px] font-mono shrink-0"
              >
                الموقع 📍
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  // Export to CSV / Excel (صلاحية حصرية للأدمن أ. سالم محمد الترجمي)
  const handleExportToExcel = () => {
    if (!isSystemAdmin(activeOfficer)) {
      alert('عذراً، تصدير النتائج (Excel / CSV) مقتصر حصرياً على مدير النظام (الأدمن) أ. سالم محمد الترجمي.');
      return;
    }
    const listToExport = activeFeature === 'equivalency_requests' ? filteredEquivalencySurveys : filteredAdmissionSurveys;
    const dataToExport = listToExport.map(s => ({
      'المعرف': s.id,
      'اسم المستفيد / ولي الأمر': s.beneficiaryName || s.parentName || 'غير محدد',
      'رقم الجوال': s.phoneNumber,
      'رقم الهوية الوطنية / الإقامة': s.nationalId || '---',
      'المرحلة الدراسية': s.stage,
      'الصف الدراسي': s.grade || '---',
      'القطاع التعليمي': s.sector,
      'المدرسة المستهدفة': s.schoolName || s.firstSchoolName || '---',
      'الرقم الوزاري': s.schoolCode || '---',
      'نوع المشكلة / الطلب': isSurveyEqualizationRequest(s) ? 'معادلة شهادة ومؤهل دراسي' : getProblemTypeArabicLabel(s.problemType),
      'الموظف مقدم الخدمة': s.serviceEmployee || 'غير مسند',
      'حالة المعالجة': s.isResolved ? 'تم الحل والمطابقة' : 'قيد المعالجة',
      'تاريخ التقديم': new Date(s.createdAt).toLocaleDateString('ar-SA'),
      'موعد المراجعة الحضورية': s.hasReviewAppointment ? `${s.appointmentDate} (${s.appointmentTime || ''})` : 'غير محدد',
      'تقييم الموظف': s.staffSatisfaction ? `${s.staffSatisfaction}/5` : 'غير مقيم',
      'ملاحظات': s.notes || s.equalizationNotes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    const sheetTitle = (activeFeature === 'equivalency_requests' ? 'طلبات معادلة المؤهلات' : 'طلبات القبول والتسجيل').slice(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
    XLSX.writeFile(wb, `MOE_${activeFeature === 'equivalency_requests' ? 'Equivalency' : 'Admission'}_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Open Backup Modal (صلاحية حصرية للأدمن أ. سالم محمد الترجمي)
  const handleOpenBackupModal = () => {
    if (!isSystemAdmin(activeOfficer)) {
      alert('عذراً، أخذ النسخة الاحتياطية (بالعام والشهر والنوع) مقتصر حصرياً على مدير النظام (الأدمن) أ. سالم محمد الترجمي.');
      return;
    }
    setShowDateBackupModal(true);
  };

  // Open Official Report Generator (صلاحية حصرية للأدمن أ. سالم محمد الترجمي)
  const handleOpenGeneralReport = () => {
    if (!isSystemAdmin(activeOfficer)) {
      alert('عذراً، طباعة التقرير العام مقتصرة حصرياً على مدير النظام (الأدمن) أ. سالم محمد الترجمي.');
      return;
    }
    const reportData: ReportExportData = {
      meta: {
        title: 'التقرير الإحصائي العام لمعاملات وشكاوى القبول والتوجيه',
        subtitle: 'الإدارة العامة للتعليم بمنطقة المدينة المنورة - الشؤون التعليمية',
        reportNumber: `ADM-${Math.floor(100000 + Math.random() * 900000)}`,
        department: 'وحدة القبول والتوجيه الطلابي',
        preparer: activeOfficer.nameAr,
        approver: 'مدير إدارة القبول والتوجيه',
        academicYear: '1447 / 1448 هـ',
        hijriDate: new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { dateStyle: 'full' }).format(new Date()),
        gregorianDate: new Date().toLocaleDateString('ar-SA')
      },
      summaryItems: [
        { label: 'إجمالي المعاملات المسجلة', value: surveys.length, icon: 'layers' },
        { label: 'المعاملات المنجزة والمغلقة', value: surveys.filter(s => s.isResolved).length, icon: 'check-circle' },
        { label: 'المعاملات الجارية وقيد المعالجة', value: surveys.filter(s => !s.isResolved).length, icon: 'clock' },
        { label: 'نسبة إنجاز المعاملات', value: `${stats.resRate}%`, icon: 'percent' },
        { label: 'معدل رضا المستفيدين', value: `${stats.avgSat} / 5`, icon: 'star' },
        { label: 'بلاغات المدارس الميدانية', value: principalReports.length, icon: 'alert-triangle' },
        { label: 'معاملات المرحلة الثانوية', value: stageStats.secAdmission, icon: 'graduation-cap' },
        { label: 'معاملات المرحلة المتوسطة', value: stageStats.interAdmission, icon: 'school' },
        { label: 'معاملات المرحلة الابتدائية', value: stageStats.primAdmission, icon: 'book-open' },
        { label: 'معاملات مرحلة الطفولة المبكرة', value: stageStats.earlyChildhoodAdmission, icon: 'baby' },
        { label: 'معاملات معادلات المرحلة الثانوية', value: stageStats.secEq, icon: 'award' },
        { label: 'معاملات معادلات المرحلة المتوسطة', value: stageStats.interEq, icon: 'file-text' },
        { label: 'معاملات معادلات المرحلة الابتدائية', value: stageStats.primEq, icon: 'file-badge' }
      ],
      sections: buildGovernorateReportSections(surveys, principalReports),
      columns: [
        { header: 'المعرف', key: 'id', widthPercent: 12 },
        { header: 'المستفيد', key: 'beneficiary', widthPercent: 20 },
        { header: 'المدرسة / القطاع', key: 'school', widthPercent: 24 },
        { header: 'نوع الطلب', key: 'problem', widthPercent: 18 },
        { header: 'الموظف المختص', key: 'officer', widthPercent: 14 },
        { header: 'الحالة', key: 'status', widthPercent: 12 }
      ],
      rows: (activeFeature === 'equivalency_requests' ? filteredEquivalencySurveys : filteredAdmissionSurveys).slice(0, 80).map(s => ({
        id: `#${s.id.slice(-6)}`,
        beneficiary: s.beneficiaryName || s.parentName || '---',
        school: `${s.schoolName || '---'} (${s.stage})`,
        problem: getProblemTypeArabicLabel(s.problemType),
        officer: s.serviceEmployee || 'غير مسند',
        status: s.isResolved ? 'تم الإنجاز ✓' : 'قيد المعالجة ⏳'
      })),
      recommendations: [
        'الاستمرار في معالجة طلبات التسكين المتبقية وتوزيع الطلاب على المدارس البديلة ذات الشواغر المتاحة.',
        'متابعة البلاغات الميدانية الواردة من مديري المدارس عبر المنظومة الآلية.',
        'الحفاظ على معايير الجودة ومعدلات الرضا المرتفعة لخدمة أولياء الأمور.'
      ]
    };

    setOfficialReportData(reportData);
    setShowOfficialModal(true);
  };

  // Add School to directory
  // Handler for Uploading Schools Excel (.xlsx, .xls, .csv)
  const handleSchoolExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        if (!buffer) {
          setClaimToastMessage('تعذر قراءة محتوى ملف المدارس');
          return;
        }
        const wb = XLSX.read(buffer, { type: 'array', cellText: true, cellDates: true });
        const firstSheet = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheet];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
        if (!rawJson || rawJson.length === 0) {
          setClaimToastMessage('الملف فارغ أو لا يحتوي على صفوف بيانات مقروءة');
          return;
        }
        const rawHeaders = Object.keys(rawJson[0] || {});

        const findCol = (candidates: string[]) => {
          for (const cand of candidates) {
            const normCand = cand.trim().toLowerCase().replace(/[\s_\-]/g, '');
            const found = rawHeaders.find(h => {
              const normH = h.trim().toLowerCase().replace(/[\s_\-]/g, '');
              return normH === normCand || normH.includes(normCand) || normCand.includes(normH);
            });
            if (found) return found;
          }
          return '';
        };

        const schoolNameCol = findCol(['اسم المدرسة', 'اسم المدرسه', 'المدرسة', 'المدرسه', 'اسم المنشأة', 'الاسم', 'مدرسة']);
        const codeCol = findCol(['الرقم الوزاري', 'رقم الوزاري', 'الرمز الوزاري', 'كود المدرسة', 'رمز المدرسة', 'الرقم_الوزاري', 'الكود الوزاري']);
        const stageCol = findCol(['المرحلة', 'المرحلة الدراسية', 'المرحلة التعليمية', 'المرحله']);
        const sectorCol = findCol(['القطاع', 'مكتب التعليم', 'القطاع التعليمي', 'الادارة', 'المنطقة', 'الحي']);
        const genderCol = findCol(['الجنس', 'النوع', 'بنين/بنات', 'بنين وبنات']);
        const principalNameCol = findCol(['اسم مدير المدرسة', 'اسم المدير', 'مدير المدرسة', 'اسم قائد المدرسة', 'قائد المدرسة']);
        const principalCivilIdCol = findCol(['السجل المدني', 'رقم السجل المدني', 'هوية مدير المدرسة', 'رقم الهوية']);
        const principalMobileCol = findCol(['رقم جوال مدير المدرسة', 'جوال مدير المدرسة', 'الجوال', 'رقم الجوال']);

        const parsedSchools: SchoolItem[] = [];

        rawJson.forEach((row, idx) => {
          const rawName = schoolNameCol ? String(row[schoolNameCol] || '').trim() : '';
          const rawCode = codeCol ? String(row[codeCol] || '').trim() : '';
          if (!rawName && !rawCode) return; // skip blank row

          const sName = rawName || ('مدرسة_' + (idx + 1));
          const mCode = rawCode || String(1000 + idx);

          let stage = 'Primary';
          const rawStage = stageCol ? String(row[stageCol] || '') : '';
          if (rawStage.includes('ثانوي')) stage = 'Secondary';
          else if (rawStage.includes('متوسط')) stage = 'Intermediate';
          else if (rawStage.includes('روض') || rawStage.includes('طفول')) stage = 'Kindergarten';
          else if (rawStage.includes('مجمع')) stage = 'All';

          let gender: 'boys' | 'girls' = 'boys';
          const rawGen = genderCol ? String(row[genderCol] || '') : '';
          if (rawGen.includes('بنات') || rawGen.includes('أنثى')) gender = 'girls';

          const sector = sectorCol ? String(row[sectorCol] || '').trim() || 'القطاع الشمالي' : 'القطاع الشمالي';
          const pName = principalNameCol ? String(row[principalNameCol] || '').trim() : '';
          const pCivilId = principalCivilIdCol ? String(row[principalCivilIdCol] || '').trim().replace(/\D/g, '') : '';
          const pMobile = principalMobileCol ? String(row[principalMobileCol] || '').trim() : '';

          parsedSchools.push({
            id: 'sch_' + Date.now() + '_' + idx,
            name: sName,
            nameAr: sName,
            nameEn: sName,
            code: mCode,
            ministryCode: mCode,
            stage,
            sector,
            district: sector,
            gender,
            principalName: pName || undefined,
            principalCivilId: pCivilId || undefined,
            principalId: pCivilId || undefined,
            principalMobile: pMobile || undefined,
            customFields: {
              ...row,
              'اسم المدرسة': sName,
              'الرقم الوزاري': mCode
            }
          });
        });

        if (parsedSchools.length === 0) {
          setClaimToastMessage('لم يتم العثور على سجلات مدارس صالحة في الملف المرفوع');
          return;
        }

        setSchoolParsedData({
          fileName: file.name,
          totalRows: parsedSchools.length,
          rows: parsedSchools,
          rawHeaders
        });
        setShowSchoolImportModal(true);
      } catch (err: any) {
        console.error(err);
        setClaimToastMessage('خطأ في معالجة ملف الإكسل: ' + (err.message || ''));
      } finally {
        if (schoolFileInputRef.current) schoolFileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Commit School Import
  const handleCommitSchoolImport = () => {
    if (!schoolParsedData || schoolParsedData.rows.length === 0) return;
    const newSchools = schoolParsedData.rows;
    if (schoolImportMode === 'replace') {
      onImportSchools(newSchools, true);
      setClaimToastMessage('✅ تم استيراد وتحديث بيانات المدارس بنجاح');
    } else {
      onImportSchools(newSchools, false);
      setClaimToastMessage('✅ تم إضافة المدارس بنجاح');
    }
    setShowSchoolImportModal(false);
    setSchoolParsedData(null);
  };

  // Confirm Clear All Schools
  const handleConfirmClearSchools = () => {
    onImportSchools([], true);
    setShowClearSchoolsConfirmModal(false);
    setClaimToastMessage('🗑️ تم حذف جميع بيانات المدارس الحالية بنجاح');
  };

  // Export Schools Directory to Excel
  const handleExportSchoolsExcel = () => {
    if (schools.length === 0) {
      setClaimToastMessage('لا توجد بيانات مدارس لتصديرها');
      return;
    }
    const rows = schools.map((s, idx) => ({
      'م': idx + 1,
      'اسم المدرسة': s.name || s.nameAr || '',
      'الرقم الوزاري': s.code || s.ministryCode || '',
      'المرحلة': s.stage === 'Secondary' ? 'ثانوي' : s.stage === 'Intermediate' ? 'متوسط' : s.stage === 'Kindergarten' ? 'رياض أطفال' : s.stage === 'All' ? 'مجمع' : 'ابتدائي',
      'القطاع': s.sector || s.district || 'المدينة المنورة',
      'النوع': s.gender === 'girls' ? 'بنات' : 'بنين',
      'اسم مدير المدرسة': s.principalName || (s as any).customFields?.['اسم مدير المدرسة'] || '—',
      'السجل المدني للمدير': s.principalCivilId || (s as any).customFields?.['السجل المدني'] || '—',
      'جوال المدير': s.principalMobile || (s as any).customFields?.['رقم جوال مدير المدرسة'] || '—'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    (ws as any)['!views'] = [{ RTL: true }];
    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, 'دليل المدارس');
    XLSX.writeFile(wb, 'دليل_مدارس_المدينة_المنورة.xlsx');
    setClaimToastMessage('📥 تم تصدير دليل المدارس بنجاح');
  };

  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name || !newSchool.code) return;
    const schoolItem: SchoolItem = {
      id: `sch_${Date.now()}`,
      nameAr: newSchool.name,
      name: newSchool.name,
      ministryCode: newSchool.code,
      code: newSchool.code,
      stage: newSchool.stage,
      sector: newSchool.sector,
      gender: newSchool.gender as any,
      capacity: Number(newSchool.capacity) || 30
    };
    onImportSchools([schoolItem, ...schools]);
    setShowAddSchoolModal(false);
    setNewSchool({ name: '', code: '', stage: 'Primary', sector: 'North', gender: 'boys', capacity: 30 });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#061b28] text-slate-100' : 'bg-[#f4f7f9] text-slate-800'} font-sans`} style={{ direction: 'rtl' }}>
      
      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
        
        {/* 3. DASHBOARD TITLE & FAST EXPORT ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">لوحة التحكم والتحليلات الذكية</h1>
              <p className="text-slate-500 dark:text-teal-400/70 font-bold mt-1 text-sm">عرض حي لأداء الكوادر، شكاوى المستفيدين، والإخطارات المشفرة</p>
           </div>
           <div className="flex flex-wrap gap-3">
              {isSystemAdmin(activeOfficer) && (
                 <>
                    <button 
                      onClick={handleOpenGeneralReport}
                      className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2.5 hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                       <Printer className="w-4 h-4" />
                       طباعة التقرير العام
                    </button>
                    <button 
                      onClick={handleExportToExcel}
                      className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2.5 hover:bg-blue-700 transition-all cursor-pointer"
                    >
                       <Download className="w-4 h-4" />
                       تصدير النتائج (CSV)
                    </button>
                    <button 
                      onClick={handleOpenBackupModal}
                      className="px-5 py-3 bg-[#112d3e] text-emerald-400 border border-emerald-900/30 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2.5 hover:bg-[#16384d] transition-all cursor-pointer"
                    >
                       <Database className="w-4 h-4" />
                       نسخة احتياطية بالعام/الشهر/النوع
                    </button>
                 </>
              )}
              {isSystemAdmin(activeOfficer) && (
                <button 
                  onClick={() => setShowClearAllModal(true)}
                  className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 border border-rose-500/30"
                  title="إجراء الأدمن: مسح وإفراغ جميع الطلبات والمعاملات نهائياً"
                >
                   <Trash2 className="w-4 h-4" />
                   <span>مسح جميع الطلبات (الأدمن)</span>
                </button>
              )}
           </div>

         {/* ACCOUNT SWITCHER BAR - التنقل الفعلي بين حسابات الموظفين */}
         {activeOfficer && (
            <div className={`p-4 rounded-[28px] border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isDark ? 'bg-[#081e2b]/90 border-teal-800/40' : 'bg-white border-slate-200'}`}>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black shrink-0">
                     <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                     <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                       <span>شريط التنقل السريع بين الحسابات والصلاحيات</span>
                       {!isSystemAdmin(activeOfficer) && (
                         <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-black">
                           معاينة نشطة
                         </span>
                       )}
                     </div>
                     <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                       الحساب المفعّل حالياً: <span className="text-teal-600 dark:text-teal-400 font-black">{activeOfficer.nameAr}</span> ({getOfficerRoleTitle(activeOfficer.role)})
                     </div>
                  </div>
               </div>

               {/* Account Switcher Controls */}
               <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                  <span className="text-xs font-black text-slate-400">الدخول بحساب:</span>
                  
                  {/* Dropdown for selecting any registered officer */}
                  <select
                    value={activeOfficer.id}
                    onChange={(e) => {
                      const selected = officers.find(o => o.id === e.target.value);
                      if (selected) handleSwitchToOfficer(selected);
                    }}
                    className="px-3.5 py-2 bg-slate-50 dark:bg-[#061b28] border border-slate-200 dark:border-teal-800/40 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer text-slate-800 dark:text-slate-100 max-w-[220px] truncate"
                  >
                    {officers.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.nameAr} ({getOfficerRoleTitle(o.role)}) {isSystemAdmin(o) ? '★ (الأدمن)' : ''}
                      </option>
                    ))}
                  </select>

                  {/* Quick Click Badges for first officers */}
                  <div className="hidden lg:flex items-center gap-1.5">
                    {officers.slice(0, 4).map(officer => {
                      const isSelected = activeOfficer.id === officer.id;
                      return (
                        <button
                          key={officer.id}
                          type="button"
                          onClick={() => handleSwitchToOfficer(officer)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-400'
                              : isDark
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-teal-900/30'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                          title={`الدخول بحساب ${officer.nameAr}`}
                        >
                          <span>{officer.nameAr.split(' ')[0]}</span>
                          {isSystemAdmin(officer) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Return to Admin Button if currently on a sub-account */}
                  {!isSystemAdmin(activeOfficer) && (
                    <button
                      type="button"
                      onClick={() => {
                        const admin = officers.find(o => isSystemAdmin(o)) || DEMO_OFFICERS[0];
                        handleSwitchToOfficer(admin);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1"
                      title="العودة لحساب مدير النظام الرئيسي"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>حساب الأدمن</span>
                    </button>
                  )}
               </div>
            </div>
         )}
        </div>

        {/* Global Impersonation / Active Account Banner when viewing as sub-account */}
        {!isSystemAdmin(activeOfficer) && (
           <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-teal-900 text-white shadow-xl border border-indigo-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black shrink-0 text-lg">
                    👤
                 </div>
                 <div>
                    <div className="text-sm font-black flex flex-wrap items-center gap-2">
                       <span>أنت مسجل وتتصفح النظام الآن بحساب:</span>
                       <span className="text-teal-300 font-extrabold underline">{activeOfficer.nameAr}</span>
                       <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-300/40 text-teal-200 text-xs font-black">
                          {getOfficerRoleTitle(activeOfficer.role)}
                       </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                       يتم عرض كامل الشاشات والصلاحيات والمعاملات المخصصة لهذا الحساب كما يراها الموظف تماماً.
                    </p>
                 </div>
              </div>

              <button
                 type="button"
                 onClick={() => {
                    const admin = officers.find(o => isSystemAdmin(o)) || DEMO_OFFICERS[0];
                    handleSwitchToOfficer(admin);
                 }}
                 className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-2 shrink-0 active:scale-95"
              >
                 <ShieldCheck className="w-4 h-4" />
                 <span>العودة لحساب الأدمن (أ. سالم الترجمي)</span>
              </button>
           </div>
        )}

        {/* Urgent 2-Business-Days Delayed Requests Alert Banner on Main Screen */}
        {delayedRequestsList.length > 0 && (
           <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white shadow-xl shadow-rose-600/30 border-2 border-rose-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-7 h-7 text-white" />
                 </div>
                 <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                       <span>🚨 رسالة طارئة وعاجلة: يوجد ({delayedRequestsList.length}) معاملة متأخرة عن يومين عمل!</span>
                    </h3>
                    <p className="text-xs sm:text-sm font-bold opacity-90 mt-0.5">
                       تجاوزت هذه المعاملات مهلة التسكين المحددة (2 يوم عمل). يلزم متابعتها فوراً والتواصل مع مدير المدرسة والقيادة المدرسية لإنهاء التسكين.
                    </p>
                 </div>
              </div>
              <button
                 onClick={() => {
                    setActiveFeature('placements');
                    setPlacementsSubTab('leadership');
                 }}
                 className="px-5 py-2.5 bg-white text-rose-900 hover:bg-rose-50 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-2"
              >
                 <span>الانتقال لمتابعة التسكين والمعاملات المتأخرة</span>
                 <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
           </div>
        )}

        {/* 4. KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
           {[
             { label: 'إجمالي التقييمات والمعاملات', value: stats.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
             { label: 'معدل الرضا العام', value: `${stats.avgSat} / 5`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
             { label: 'نسبة حل الطلبات', value: `${stats.resRate}%`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
             { label: 'تنبيهات سلبية فورية', value: stats.negativeAlerts, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' }
           ].map((kpi, idx) => (
             <div key={idx} className={`p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs flex items-center justify-between ${isDark ? 'bg-[#081e2b]' : 'bg-white'}`}>
                <div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</div>
                   <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{kpi.value}</div>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                   <kpi.icon className="w-7 h-7" />
                </div>
             </div>
           ))}
        </div>

        {/* 5. INTERACTIVE BENTO FEATURE GRID (12 Interactive Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
           
           {/* Card 1: طلبات القبول والتسجيل والنقل (مشرف القبول والتسجيل) */}
           {isFeatureAllowedForOfficer('requests') && (
              <div className="md:col-span-1 md:row-span-2">
                 <button 
                   onClick={() => setActiveFeature('requests')}
                   className={`w-full h-full text-right p-8 rounded-[40px] cursor-pointer transition-all flex flex-col items-center justify-center gap-6 relative overflow-hidden ${activeFeature === 'requests' ? 'bg-[#009688] text-white shadow-2xl shadow-teal-500/40 ring-4 ring-teal-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border border-slate-100 dark:border-teal-800/20 hover:border-teal-500'}`}
                 >
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center ${activeFeature === 'requests' ? 'bg-white/20' : 'bg-teal-50 dark:bg-teal-900/30'}`}>
                       <Send className={`w-10 h-10 ${activeFeature === 'requests' ? 'text-white' : 'text-teal-600'}`} />
                    </div>
                    <div className="text-center">
                       <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">طلبات القبول والتسجيل والنقل</h3>
                       <div className="text-xs sm:text-sm font-black opacity-90 mt-1">مشرف القبول والتسجيل</div>
                       <div className={`mt-3 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black border tracking-wide shadow-xs ${activeFeature === 'requests' ? 'bg-white/20 border-white/30' : 'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950 dark:text-teal-200'}`}>
                          ({stats.admissionCount}) معاملة (جديد + نقل)
                       </div>
                    </div>
                    <div className="absolute top-4 right-4">
                       <Briefcase className="w-5 h-5 opacity-50" />
                    </div>
                 </button>
              </div>
           )}

           {/* Card 2: طلبات معادلة المؤهلات والشهادات (مشرف القبول معادلة الشهادات) */}
           {isFeatureAllowedForOfficer('equivalency_requests') && (
              <button 
                onClick={() => setActiveFeature('equivalency_requests')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'equivalency_requests' ? 'bg-indigo-700 text-white border-indigo-700 ring-4 ring-indigo-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-indigo-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'equivalency_requests' ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'}`}>
                    <GraduationCap className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">طلبات معادلة المؤهلات والشهادات</div>
                    <div className="text-xs font-black text-slate-500 dark:text-slate-300 mt-0.5">مشرف معادلة الشهادات</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'equivalency_requests' ? 'bg-white/25 text-white border-white/30' : 'bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-700'}`}>
                       ({stats.equivalencyCount}) طلب معادلة
                    </div>
                 </div>
              </button>
           )}

           {/* Card: شاشة الاستفسارات العامة والتواصل */}
           {isFeatureAllowedForOfficer('inquiries') && (
              <>
                <button 
                  onClick={() => {
                    setActiveFeature('inquiries');
                    setInquiriesDefaultTab('general');
                  }}
                  className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'inquiries' && inquiriesDefaultTab === 'general' ? 'bg-[#009688] text-white border-[#009688] ring-4 ring-teal-500/20 shadow-xl' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-teal-500'}`}
                >
                   <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'inquiries' && inquiriesDefaultTab === 'general' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#009688]'}`}>
                      <Inbox className="w-7 h-7" />
                   </div>
                   <div className="flex-1">
                      <div className="text-sm sm:text-base font-black leading-snug">شاشة الاستفسارات العامة</div>
                      <div className="text-xs font-black text-slate-500 dark:text-slate-300 mt-0.5">الاستفسارات الواردة المتاحة للاستلام</div>
                      <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'inquiries' && inquiriesDefaultTab === 'general' ? 'bg-white/25 text-white border-white/30' : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200'}`}>
                         ({stats.generalInquiriesCount}) عام جديد بانتظار الاستلام
                      </div>
                   </div>
                </button>

                {/* Card: أيقونة استفسارات المسؤول المستلمة (مطلوبة بدقة) */}
                <button 
                  onClick={() => {
                    setActiveFeature('inquiries');
                    setInquiriesDefaultTab('my_claimed');
                  }}
                  className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group relative overflow-hidden ${activeFeature === 'inquiries' && inquiriesDefaultTab === 'my_claimed' ? 'bg-emerald-700 text-white border-emerald-700 ring-4 ring-emerald-500/20 shadow-xl' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-emerald-500'}`}
                >
                   {stats.myPendingInquiriesCount > 0 && (
                     <span className="absolute top-3 left-3 flex h-3 w-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                     </span>
                   )}
                   <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'inquiries' && inquiriesDefaultTab === 'my_claimed' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'}`}>
                      <UserCheck className="w-7 h-7" />
                   </div>
                   <div className="flex-1">
                      <div className="text-sm sm:text-base font-black leading-snug">استفسارات المسؤول المستلمة</div>
                      <div className="text-xs font-black text-slate-500 dark:text-slate-300 mt-0.5">المسندة إليك ({activeOfficer.nameAr})</div>
                      <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'inquiries' && inquiriesDefaultTab === 'my_claimed' ? 'bg-white/25 text-white border-white/30' : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'}`}>
                         ({stats.myClaimedInquiriesCount}) مستلم {stats.myPendingInquiriesCount > 0 ? `(${stats.myPendingInquiriesCount} معلق 🔔)` : ''}
                      </div>
                   </div>
                </button>
              </>
           )}

           {/* Card 3: متابعة ومعالجة بلاغات المدارس */}
           {isFeatureAllowedForOfficer('principal_reports') && (
              <button 
                onClick={() => setActiveFeature('principal_reports')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'principal_reports' ? 'bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-emerald-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'principal_reports' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'}`}>
                    <CheckCircle className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">متابعة ومعالجة بلاغات المدارس</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'principal_reports' ? 'bg-white/25 text-white border-white/30' : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700'}`}>
                       مكتمل ({stats.reportsCount}) ✓
                    </div>
                 </div>
              </button>
           )}

           {/* Card 4: المزامنة والربط الإلكتروني */}
           {isFeatureAllowedForOfficer('sync') && (
              <button 
                onClick={() => setActiveFeature('sync')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'sync' ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-blue-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'sync' ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'}`}>
                    <RefreshCw className={`w-7 h-7 ${unsyncedCount > 0 ? 'animate-spin' : ''}`} />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">المزامنة والربط الإلكتروني</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'sync' ? 'bg-white/25 text-white border-white/30' : 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-700'}`}>
                       {unsyncedCount > 0 ? `${unsyncedCount} غير متزامن` : 'متزامن بالكامل ✓'}
                    </div>
                 </div>
              </button>
           )}

           {/* Card 5: لوحة الإعدادات الشاملة */}
           {isFeatureAllowedForOfficer('settings') && (
              <button 
                onClick={() => setActiveFeature('settings')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'settings' ? 'bg-slate-800 text-white border-slate-800 ring-4 ring-slate-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-slate-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'settings' ? 'bg-white/20 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-600'}`}>
                    <Settings className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">لوحة الإعدادات الشاملة</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'settings' ? 'bg-white/25 text-white border-white/30' : 'bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'}`}>
                       النظام والتكوين
                    </div>
                 </div>
              </button>
           )}

           {/* Card 6: طلبات التسكين والمتابعة بالمدارس */}
           {isFeatureAllowedForOfficer('placements') && (
              <button 
                onClick={() => setActiveFeature('placements')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'placements' ? 'bg-teal-700 text-white border-teal-700 ring-4 ring-teal-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-teal-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'placements' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'}`}>
                    <Building2 className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">طلبات التسكين والمتابعة بالمدارس</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'placements' ? 'bg-white/25 text-white border-white/30' : 'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-700'}`}>
                       متابعة وتدقيق التسكين
                    </div>
                 </div>
              </button>
           )}

           {/* Card 7: منسوبي الإدارة والكوادر والصلاحيات */}
           {isFeatureAllowedForOfficer('staff') && (
              <button 
                onClick={() => setActiveFeature('staff')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'staff' ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-indigo-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'staff' ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'}`}>
                    <Users className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">منسوبي الإدارة والكوادر والصلاحيات</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'staff' ? 'bg-white/25 text-white border-white/30' : 'bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-700'}`}>
                       {DEMO_OFFICERS.length} موظفين
                    </div>
                 </div>
              </button>
           )}

           {/* Card 8: ملاحظات ورسائل المستفيدين */}
           {isFeatureAllowedForOfficer('feedback') && (
              <button 
                onClick={() => setActiveFeature('feedback')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'feedback' ? 'bg-teal-600 text-white border-teal-600 ring-4 ring-teal-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-teal-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'feedback' ? 'bg-white/20 text-white' : 'bg-teal-50 dark:bg-teal-900/40 text-teal-600'}`}>
                    <MessageSquare className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">ملاحظات ورسائل المستفيدين</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'feedback' ? 'bg-white/25 text-white border-white/30' : 'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-700'}`}>
                       {stats.feedbacksCount} رسائل
                    </div>
                 </div>
              </button>
           )}

           {/* Card 9: التحليلات والرسوم البيانية */}
           {isFeatureAllowedForOfficer('analytics') && (
              <button 
                onClick={() => setActiveFeature('analytics')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'analytics' ? 'bg-purple-600 text-white border-purple-600 ring-4 ring-purple-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-purple-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'analytics' ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600'}`}>
                    <BarChart3 className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">التحليلات والرسوم البيانية</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'analytics' ? 'bg-white/25 text-white border-white/30' : 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700'}`}>
                       مخططات تفاعلية
                    </div>
                 </div>
              </button>
           )}

           {/* Card 10: سجل التنبيهات الفورية */}
           {isFeatureAllowedForOfficer('alerts') && (
              <button 
                onClick={() => setActiveFeature('alerts')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'alerts' ? 'bg-rose-600 text-white border-rose-600 ring-4 ring-rose-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-rose-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'alerts' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600'}`}>
                    <Mail className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">سجل التنبيهات الفورية</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'alerts' ? 'bg-white/25 text-white border-white/30' : 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700'}`}>
                       {stats.emailLogsCount} إشعار
                    </div>
                 </div>
              </button>
           )}

           {/* Card 11: دليل المدارس والأرقام الوزارية */}
           {isFeatureAllowedForOfficer('schools') && (
              <button 
                onClick={() => setActiveFeature('schools')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'schools' ? 'bg-teal-600 text-white border-teal-600 ring-4 ring-teal-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-teal-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'schools' ? 'bg-white/20 text-white' : 'bg-teal-50 dark:bg-teal-900/40 text-teal-600'}`}>
                    <School className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">دليل المدارس والأرقام الوزارية</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'schools' ? 'bg-white/25 text-white border-white/30' : 'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-700'}`}>
                       {stats.schoolsCount.toLocaleString('ar-SA')} مدرسة
                    </div>
                 </div>
              </button>
           )}

           {/* Card 12: قياس رضا المستفيدين */}
           {isFeatureAllowedForOfficer('satisfaction') && (
              <button 
                onClick={() => setActiveFeature('satisfaction')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'satisfaction' ? 'bg-amber-600 text-white border-amber-600 ring-4 ring-amber-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-amber-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'satisfaction' ? 'bg-white/20 text-white' : 'bg-amber-50 dark:bg-amber-900/40 text-amber-600'}`}>
                    <Star className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">قياس رضا المستفيدين</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'satisfaction' ? 'bg-white/25 text-white border-white/30' : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700'}`}>
                       مؤشرات الرضا ⭐ ({stats.avgSat})
                    </div>
                 </div>
              </button>
           )}

           {/* Card 13: التقارير */}
           {isFeatureAllowedForOfficer('reports') && (
              <button 
                onClick={() => setActiveFeature('reports')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'reports' ? 'bg-blue-700 text-white border-blue-700 ring-4 ring-blue-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-blue-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'reports' ? 'bg-white/20 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-600'}`}>
                    <FileText className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">التقارير المتقدمة</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'reports' ? 'bg-white/25 text-white border-white/30' : 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-700'}`}>
                       جديد ومطور
                    </div>
                 </div>
              </button>
           )}

           {/* Card 14: بيانات مديري المدارس والربط بالسجل المدني */}
           {isFeatureAllowedForOfficer('principal_data') && (
              <button 
                onClick={() => setActiveFeature('principal_data')}
                className={`p-6 text-right rounded-[32px] border transition-all cursor-pointer flex items-center gap-4 group ${activeFeature === 'principal_data' ? 'bg-emerald-700 text-white border-emerald-700 ring-4 ring-emerald-500/20' : 'bg-white dark:bg-[#081e2b] text-slate-800 dark:text-white border-slate-100 dark:border-teal-800/20 hover:border-emerald-500'}`}
              >
                 <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${activeFeature === 'principal_data' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'}`}>
                    <Users className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug">بيانات مديري المدارس</div>
                    <div className={`mt-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border tracking-wide inline-flex items-center gap-1 shadow-xs ${activeFeature === 'principal_data' ? 'bg-white/25 text-white border-white/30' : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700'}`}>
                       رفع وربط Excel 📊
                    </div>
                 </div>
              </button>
           )}
        </div>
        {/* 6. DYNAMIC ACTIVE VIEW RENDERER */}

        {/* VIEW 1: SCREEN 1 - طلبات القبول والتسجيل والنقل (مشرف القبول والتسجيل) */}
        {activeFeature === 'requests' && (
          <div className="space-y-6">
            
            {/* Header & Job Description Official Banner */}
            <div className={"p-6 rounded-[32px] border " + (isDark ? 'bg-[#081e2b] border-teal-800/30' : 'bg-linear-to-r from-teal-900 to-slate-900 text-white') + " shadow-xl relative overflow-hidden"}>
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-3">
                     <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-black tracking-wide uppercase">
                           وحدة القبول - الشاشة الرسمية الأولى
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black">
                           طلبات التقديم الجديد ونقل الطلاب
                        </span>
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                           <Send className="w-6 h-6 text-teal-400" />
                           شاشة طلبات القبول والتسجيل ونقل الطلاب
                        </h2>
                        <p className="text-xs text-teal-200/80 font-bold mt-1 max-w-3xl leading-relaxed">
                           خاصة بموظفي وحدة القبول (مشرف القبول والتسجيل) - نطاق العمل: استقبال ومعالجة طلبات التسجيل الجديد (سعودي ومقيم) وطلبات نقل الطلاب بين المدارس.
                        </p>
                     </div>
                     <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
                        <Briefcase className="w-4 h-4 text-amber-300 shrink-0" />
                        <span className="font-black text-amber-300">الوصف الوظيفي المعتمد:</span>
                        <span className="font-bold">«استلام المعاملات والشكاوي وتوجيهها للمستفيدين والمتابعة»</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Workflow Classification Tabs */}
            <div className={"p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs " + (isDark ? 'bg-[#081e2b]' : 'bg-white')}>
               <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                     <Activity className="w-5 h-5 text-teal-600" />
                     <h3 className="text-sm font-black text-slate-800 dark:text-white">مراحل استلام وتوجيه معاملات القبول والتسجيل والنقل:</h3>
                  </div>
                  
                  {/* Timeline Option in Bar */}
                  <button
                    type="button"
                    onClick={() => setShowDispatchTimeline(!showDispatchTimeline)}
                    className={`px-3.5 py-2 rounded-2xl text-[11px] font-black flex items-center gap-2 transition-all cursor-pointer border ${
                      showDispatchTimeline
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-teal-200" />
                    <span>خيار: تسلسل تواريخ الإرسال والتحويلات (بالهجري)</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/20 font-bold">
                      {showDispatchTimeline ? 'مُفعّل ✓' : 'إظهار الشريط'}
                    </span>
                  </button>

                  {/* Admin Clear All Requests Option */}
                  {isSystemAdmin(activeOfficer) && (
                    <button
                      type="button"
                      onClick={() => setShowClearAllModal(true)}
                      className="px-3.5 py-2 rounded-2xl text-[11px] font-black flex items-center gap-2 transition-all cursor-pointer border bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-xs active:scale-95"
                      title="مسح وإفراغ كافة الطلبات والمعاملات"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح جميع الطلبات (الأدمن)</span>
                    </button>
                  )}
               </div>
               
               <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-teal-800/10">
                  {[
                    { id: 'new', label: 'وارد جديد (غير مستلم)', count: workflowCounts.new, icon: Inbox },
                    { id: 'my', label: 'معاملاتي المستلمة', count: workflowCounts.my, icon: UserCheck },
                    { id: 'sent_to_school', label: 'المعاملات المرسلة للمدرسة بعد فتح الشاغر', count: workflowCounts.sentToSchool, icon: Building2 },
                    { id: 'archive', label: 'الأرشيف والمنجز', count: workflowCounts.archive, icon: Database }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setWorkflowStatus(btn.id)}
                      className={"px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2.5 transition-all cursor-pointer border " + (workflowStatus === btn.id ? 'bg-[#009688] text-white shadow-md border-teal-700 scale-102 ring-2 ring-teal-500/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-teal-800/40 hover:bg-slate-200 dark:hover:bg-slate-800')}
                    >
                       <btn.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                       <span className="leading-snug">{btn.label}</span>
                       <span className={"px-2.5 py-0.5 rounded-lg text-xs sm:text-sm font-black font-mono border shadow-2xs " + (workflowStatus === btn.id ? 'bg-white/25 text-white border-white/30' : 'bg-slate-200 text-slate-950 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700')}>
                          {btn.count}
                       </span>
                    </button>
                  ))}
               </div>
            </div>

            {/* Table Section */}
            <div className={"rounded-[40px] border border-slate-100 dark:border-teal-800/20 shadow-xs overflow-hidden " + (isDark ? 'bg-[#081e2b]' : 'bg-white')}>
               <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                     <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 font-black text-slate-500 border-b border-slate-100 dark:border-teal-800/20 text-[10px]">
                           <th className="p-3 text-right">المستفيد</th>
                           <th className="p-3 text-right">التفاصيل والقطاع</th>
                           <th className="p-3 text-center">نوع الطلب</th>
                           <th className="p-3 text-center min-w-[340px]">الموظف مقدم الخدمة</th>
                           <th className="p-3 text-center">هل عولج؟</th>
                           <th className="p-3 text-center">التقييمات</th>
                           <th className="p-3 text-center">الإجراءات</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-teal-800/10">
                        {filteredAdmissionSurveys.length > 0 ? (
                          filteredAdmissionSurveys.map((s) => {
                             const cal = getSurveyCalData(s);
                             const isOpen = openCalendarSurveyId === s.id;
                             
                             return (
                               <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all border-b border-slate-100 dark:border-teal-800/10 text-[11px] font-sans">
                                 {/* Column 1: المستفيد */}
                                 <td className="p-3 text-right">
                                    <div className="space-y-1">
                                       <div className="font-black text-xs text-slate-850 dark:text-slate-100 flex items-center justify-start gap-1">
                                          <User className="w-3.5 h-3.5 text-slate-400" />
                                          <span>{s.beneficiaryName || s.parentName || 'غير متوفر'}</span>
                                       </div>
                                       <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                                          <Phone className="w-3 h-3 text-slate-400" />
                                          <span>{s.phoneNumber}</span>
                                       </div>
                                    </div>
                                 </td>

                                 {/* Column 3: التفاصيل والقطاع */}
                                 <td className="p-3 text-right">
                                    <div className="space-y-1">
                                       <div className="font-black text-xs text-purple-950 dark:text-purple-300 flex items-center justify-start gap-1">
                                          <Building2 className="w-3.5 h-3.5 text-purple-600" />
                                          <span>وحدة القبول والشهادات ({s.stage || 'المرحلة المتوسطة'})</span>
                                       </div>
                                       <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                                          <School className="w-3 h-3 text-slate-400" />
                                          <span>الرغبة الأصلية: {s.schoolName || 'متوسطة سعد بن خيثمة الأنصاري'}</span>
                                       </div>
                                       <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                          {s.stage || 'المتوسطة'} • منطقة المدينة المنورة (المقر الرئيسي)
                                       </div>
                                    </div>
                                 </td>

                                 {/* Column 4: نوع الطلب */}
                                 <td className="p-3 text-center">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#faf5ff] text-[#7c3aed] border border-purple-200">
                                       {isSurveyTransferRequest(s) ? "نقل طالب" : isSurveyEqualizationRequest(s) ? "معادلة شهادة" : "قبول وتسجيل"}
                                    </span>
                                 </td>

                                 {/* Column 5: الموظف مقدم الخدمة */}
                                 <td className="p-3 text-center min-w-[340px]">
                                    <div className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-right space-y-3 shadow-xs">
                                       {/* Card Header */}
                                       <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                                          <div className="flex items-center gap-1.5 justify-start">
                                             <School className="w-4 h-4 text-[#009688]" />
                                             <span className="font-black text-[10px] text-slate-800 dark:text-white">
                                                وحدة القبول والشهادات ({s.stage || 'المرحلة المتوسطة'})
                                             </span>
                                          </div>
                                          <span className="px-2 py-0.5 rounded bg-[#009688]/10 text-[#009688] font-black text-[8px] uppercase tracking-wide">
                                             {s.stage === 'primary' || s.stage === 'الابتدائية' ? 'Primary' : s.stage === 'secondary' || s.stage === 'الثانوية' ? 'Secondary' : 'Intermediate'}
                                          </span>
                                       </div>

                                       {/* Status Box & Dispatch Timeline Side by Side Grid */}
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-right">
                                          {/* Status Box */}
                                          <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col justify-between gap-1 shadow-2xs">
                                             <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1">
                                                <span className="text-[9.5px] font-bold text-slate-500 flex items-center gap-1">
                                                   <UserCheck className="w-3 h-3 text-slate-400" />
                                                   <span>حالة المعاملة:</span>
                                                </span>
                                             </div>
                                             <div className="text-[10px] font-bold py-1">
                                                {s.serviceEmployee && s.serviceEmployee !== 'غير مسند' ? (
                                                   <div className="flex flex-col gap-0.5">
                                                      <span className="font-black text-blue-700 dark:text-blue-400 flex items-center gap-1 text-[10px]">
                                                         <UserCheck className="w-3.5 h-3.5" />
                                                         مستلم ({s.serviceEmployee})
                                                      </span>
                                                      <span className="text-[8.5px] text-slate-400 font-bold">جاري العمل على المعاملة</span>
                                                   </div>
                                                ) : (
                                                   <span className="font-black text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-pulse text-[10px]">
                                                      📥 وارد جديد غير مستلم
                                                   </span>
                                                )}
                                             </div>
                                          </div>

                                          {/* Dispatch Timeline Box */}
                                          {showDispatchTimeline && (
                                             <div>
                                                <RequestDispatchTimeline survey={s} compact />
                                             </div>
                                          )}
                                       </div>

                                       {/* 📋 إجراءات مشرف وحدة القبول والتسجيل الخمسة المعتمدة */}
                                       <div className="p-3 rounded-2xl border border-teal-200/80 bg-teal-50/15 dark:bg-teal-950/10 space-y-2.5">
                                          <div className="font-black text-[10px] text-teal-950 dark:text-teal-300 flex items-center justify-between border-b border-teal-200/40 dark:border-teal-800/40 pb-1.5">
                                             <span className="flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-teal-600" />
                                                <span>📋 إجراءات مشرف وحدة القبول والتسجيل:</span>
                                             </span>
                                             <span className="text-[8.5px] font-bold text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-md">
                                                طلب تسجيل جديد
                                             </span>
                                          </div>

                                          <div className="space-y-1.5">
                                             {/* 1. ايقونة استلام الطلب */}
                                             <button
                                                type="button"
                                                onClick={() => handleClaimAdmissionSurvey(s)}
                                                className={`w-full py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-between transition-all shadow-xs active:scale-95 cursor-pointer ${
                                                   s.serviceEmployee && s.serviceEmployee !== 'غير مسند'
                                                      ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900"
                                                      : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20"
                                                }`}
                                                title="استلام الطلب والبدء بالمعالجة"
                                             >
                                                <div className="flex items-center gap-1.5">
                                                   <UserPlus className="w-3.5 h-3.5" />
                                                   <span>1. استلام الطلب</span>
                                                </div>
                                                <span className="text-[8.5px] font-bold">
                                                   {s.serviceEmployee && s.serviceEmployee !== 'غير مسند' ? `مستلم (${s.serviceEmployee}) ✓` : 'انقر للاستلام'}
                                                </span>
                                             </button>

                                             {/* 2. ايقونة استعراض الطلب وعند الاستعراض يجب ان يكون هناك تحديد للمدرسة التي بها امكانية للتسجيل يحددها المشرف المسؤول */}
                                             <button
                                                type="button"
                                                onClick={() => setReviewRegistrationSurvey(s)}
                                                className={`w-full py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-between transition-all shadow-xs active:scale-95 cursor-pointer ${
                                                   s.assignedRegistrationSchool
                                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                                                      : "bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800"
                                                }`}
                                                title="استعراض الطلب وتحديد المدرسة التي بها إمكانية للتسجيل"
                                             >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                   <Eye className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                                   <span className="truncate">2. استعراض الطلب وتحديد مدرسة التسجيل</span>
                                                </div>
                                                <span className="text-[8.5px] font-bold shrink-0 max-w-[120px] truncate">
                                                   {s.assignedRegistrationSchool ? `✓ ${s.assignedRegistrationSchool}` : 'تحديد مدرسة متاحة'}
                                                </span>
                                             </button>

                                             {/* 3. ايقونة ارسال الطلب لمدير المدرسة لإضافة ملف الطالب */}
                                             <button
                                                type="button"
                                                onClick={() => handleSendToPrincipalForStudentFile(s)}
                                                className={`w-full py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-between transition-all shadow-xs active:scale-95 cursor-pointer ${
                                                   s.sentToSchoolPrincipal
                                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900"
                                                      : "bg-[#009688] hover:bg-[#00796b] text-white"
                                                }`}
                                                title="ارسال الطلب لمدير المدرسة لإضافة ملف الطالب"
                                             >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                   <Building2 className="w-3.5 h-3.5 shrink-0" />
                                                   <span className="truncate">3. ارسال الطلب لمدير المدرسة لإضافة ملف الطالب</span>
                                                </div>
                                                <span className="text-[8.5px] font-bold shrink-0">
                                                   {s.sentToSchoolPrincipal ? "تم الإرسال ✓" : "إرسال للمدير"}
                                                </span>
                                             </button>

                                             {/* 4. ايقونة طلب فتح شاغر لمسؤول التخطيط */}
                                             <button
                                                type="button"
                                                onClick={() => handleSendToPlanning(s)}
                                                className={`w-full py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-between transition-all shadow-xs active:scale-95 cursor-pointer ${
                                                   s.isVacancyRequest
                                                      ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900"
                                                      : "bg-blue-600 hover:bg-blue-700 text-white"
                                                }`}
                                                title="طلب فتح شاغر لمسؤول التخطيط"
                                             >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                   <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                                                   <span className="truncate">4. طلب فتح شاغر لمسؤول التخطيط</span>
                                                </div>
                                                <span className="text-[8.5px] font-bold shrink-0">
                                                   {s.isVacancyRequest ? "تم طلب شاغر ✓" : "طلب شاغر"}
                                                </span>
                                             </button>

                                             {/* 5. ايقونة متابعة الطلب لمسؤول القيادة للمتابعة */}
                                             <button
                                                type="button"
                                                onClick={() => handleSendToLeadership(s)}
                                                className={`w-full py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-between transition-all shadow-xs active:scale-95 cursor-pointer ${
                                                   s.sentToLeadership
                                                      ? "bg-[#009688]/10 text-[#009688] border border-[#009688]/20 dark:bg-teal-950/20 dark:text-teal-300 dark:border-teal-900"
                                                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                }`}
                                                title="متابعة الطلب لمسؤول القيادة للمتابعة"
                                             >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                   <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                                   <span className="truncate">5. متابعة الطلب لمسؤول القيادة للمتابعة</span>
                                                </div>
                                                <span className="text-[8.5px] font-bold shrink-0">
                                                   {s.sentToLeadership ? "مرسل للقيادة ✓" : "متابعة القيادة"}
                                                </span>
                                             </button>

                                             {/* Finalize & Resolve Step */}
                                             <div className="pt-1.5 border-t border-teal-200/40 dark:border-teal-800/40">
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      const isStaffed = Boolean(s.staffingConfirmedAt || s.principalConfirmedStaffing);
                                                      if (!isStaffed) {
                                                         setClaimToastMessage("⚠️ تنبيه نظامي: لا يمكن أرشفة المعاملة وإغلاقها إلا بعد تسكين الطالب وإضافة ملفه من قبل مدير المدرسة.");
                                                         setTimeout(() => setClaimToastMessage(null), 5000);
                                                         return;
                                                      }
                                                      const updated = { 
                                                         ...s, 
                                                         isResolved: true, 
                                                         resolvedAt: new Date().toISOString() 
                                                      };
                                                      onUpdateSurvey(updated);
                                                      setClaimToastMessage("تم اعتماد حل الطلب وإغلاقه بنجاح وأرشفته للمستفيد ✓");
                                                      setTimeout(() => setClaimToastMessage(null), 4000);
                                                   }}
                                                   className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9.5px] flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                                                >
                                                   <CheckCircle2 className="w-3 h-3" />
                                                   <span>اعتماد القبول والتسكين النهائي وإغلاق المعاملة</span>
                                                </button>
                                             </div>
                                          </div>
                                       </div>
                                       
                                       {/* Reassignment / Assignment Modal Link */}
                                       <div className="flex justify-end pt-1">
                                          <button
                                             type="button"
                                             onClick={() => {
                                                setAssignTargetSurvey(s);
                                                setSelectedOfficerForAssign(s.serviceEmployee || DEMO_OFFICERS[0].nameAr);
                                                setShowAssignModal(true);
                                             }}
                                             className="text-[#7c3aed] hover:text-[#6d28d9] font-black text-[9.5px] flex items-center gap-1.5 cursor-pointer underline hover:no-underline"
                                          >
                                             <UserPlus className="w-3.5 h-3.5" />
                                             <span>إسناد/إحالة لمشرف</span>
                                          </button>
                                       </div>
                                    </div>
                                 </td>

                                 {/* Column 6: هل عولج */}
                                 <td className="p-3 text-center">
                                    <button
                                       type="button"
                                       onClick={() => {
                                          if (!s.isResolved) {
                                             const isStaffed = Boolean(s.staffingConfirmedAt || s.principalConfirmedStaffing);
                                             if (!isStaffed) {
                                                setClaimToastMessage("⚠️ تنبيه: لا يمكن أرشفة المعاملة أو تمييزها كمعالجة إلا بعد تسكين الطالب من قبل مدير المدرسة.");
                                                setTimeout(() => setClaimToastMessage(null), 5000);
                                                return;
                                             }
                                          }
                                          onToggleResolved(s.id);
                                          setClaimToastMessage(s.isResolved ? "تم تحويل المعاملة إلى تحت الإجراء ⏳" : "تم تمييز المعاملة كمعالجة ومؤرشفة بنجاح! ✓");
                                          setTimeout(() => setClaimToastMessage(null), 3000);
                                       }}
                                       className={"inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer active:scale-95 shadow-2xs " +
                                          (s.isResolved
                                             ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900"
                                             : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
                                          )
                                       }
                                    >
                                       {s.isResolved ? (
                                          <>
                                             <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                             <span>تمت المعالجة ✓</span>
                                          </>
                                       ) : (
                                          <>
                                             <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                             <span>تحت الإجراء ⏳</span>
                                          </>
                                       )}
                                    </button>
                                 </td>

                                 {/* Column 7: التقييمات */}
                                 <td className="p-3 text-center">
                                    <div className="inline-block p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-right space-y-1">
                                       <div className="flex items-center justify-end gap-1 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                                          <span>الموظف: {s.staffSatisfaction || 0}</span>
                                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                       </div>
                                       <div className="flex items-center justify-end gap-1 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                                          <span>الاستقبال: {s.receptionSatisfaction || 0}</span>
                                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                       </div>
                                    </div>
                                 </td>

                                 {/* Column 8: الإجراءات */}
                                 <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                       {/* Comment icon */}
                                       <button
                                          type="button"
                                          onClick={() => {
                                             setClaimToastMessage(`ملاحظات المعاملة: ${s.notes || 'لا توجد ملاحظات إضافية'}`);
                                             setTimeout(() => setClaimToastMessage(null), 5000);
                                          }}
                                          className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition-all cursor-pointer"
                                          title="عرض الملاحظات"
                                       >
                                          <MessageSquare className="w-4 h-4" />
                                       </button>

                                       {/* Delete icon */}
                                       <button
                                          type="button"
                                          onClick={() => {
                                             onDeleteSurvey(s.id);
                                             setClaimToastMessage("تم حذف المعاملة بنجاح ✓");
                                             setTimeout(() => setClaimToastMessage(null), 3000);
                                          }}
                                          className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                                          title="حذف المعاملة"
                                       >
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    </div>
                                 </td>
                               </tr>
                             );
                          })
                        ) : (
                           <tr><td colSpan={8} className="p-10 text-center text-slate-400 font-bold">لا توجد معاملات</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SCREEN 2 - طلبات معادلة المؤهلات والشهادات */}
        {activeFeature === 'equivalency_requests' && (
          <div className="space-y-6">
             {/* Header & Job Description Official Banner */}
             <div className={"p-6 rounded-[32px] border " + (isDark ? 'bg-[#081e2b] border-teal-800/30' : 'bg-linear-to-r from-indigo-900 to-slate-900 text-white') + " shadow-xl relative overflow-hidden"}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                   <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                         <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black tracking-wide uppercase">
                            وحدة المعادلات - الشاشة الرسمية الثانية
                         </span>
                         <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black">
                            طلبات معادلة الشهادات والمؤهلات الدراسية
                         </span>
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <GraduationCap className="w-6 h-6 text-indigo-400" />
                            شاشة طلبات معادلة المؤهلات والشهادات الدراسية
                         </h2>
                         <p className="text-xs text-indigo-200/80 font-bold mt-1 max-w-3xl leading-relaxed">
                            خاصة بموظفي وحدة معادلات الشهادات (مشرف معادلة الشهادات) - نطاق العمل: مراجعة وثائق الطلاب الحاصلين على مؤهلات من خارج المنطقة أو خارج المملكة والمصادقة عليها وتسكين الطلاب بالمدارس.
                         </p>
                      </div>
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
                         <Briefcase className="w-4 h-4 text-amber-300 shrink-0" />
                         <span className="font-black text-amber-300">الوصف الوظيفي المعتمد:</span>
                         <span className="font-bold">«استقبال طلبات معادلة الشهادات ومراجعة الأوراق، التنسيق مع المدارس، وتوجيه التسكين»</span>
                      </div>
                   </div>
                   <button
                      onClick={() => setShowAddUserModal(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black transition-all flex items-center gap-2"
                   >
                      <Plus className="w-4 h-4" />
                      إضافة مستخدم
                   </button>
                </div>
             </div>

             {/* Workflow Classification Tabs */}
             <div className={"p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs " + (isDark ? 'bg-[#081e2b]' : 'bg-white')}>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                   <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-sm font-black text-slate-800 dark:text-white">مراحل معالجة طلبات معادلة الشهادات:</h3>
                   </div>
                   {isSystemAdmin(activeOfficer) && (
                     <button
                       type="button"
                       onClick={() => setShowClearAllModal(true)}
                       className="px-3.5 py-2 rounded-2xl text-[11px] font-black flex items-center gap-2 transition-all cursor-pointer border bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-xs active:scale-95"
                       title="مسح وإفراغ كافة الطلبات والمعاملات"
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                       <span>مسح جميع الطلبات (الأدمن)</span>
                     </button>
                   )}
                </div>
                
                {/* Main Tabs */}
                <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-teal-800/10">
                   {[
                     { id: 'new', label: 'وارد جديد (غير مستلم)', count: equivalencyWorkflowCounts.new, icon: Inbox },
                     { id: 'my', label: 'معاملاتي المستلمة', count: equivalencyWorkflowCounts.my, icon: UserCheck },
                     { id: 'confirmed', label: 'المعاملات المؤكدة بالموعد من المستفيد', count: equivalencyWorkflowCounts.confirmed, icon: CalendarCheck },
                     { id: 'sent_to_school', label: 'المعاملات المرسلة للمدرسة بعد فتح الشاغر لها', count: equivalencyWorkflowCounts.sentToSchool, icon: Building2 },
                     { id: 'archive', label: 'الأرشيف والمنجز', count: equivalencyWorkflowCounts.archive, icon: Database }
                   ].map((btn) => (
                     <button
                       key={btn.id}
                       onClick={() => setEqWorkflowStatus(btn.id)}
                       className={"px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2.5 transition-all cursor-pointer border " + (eqWorkflowStatus === btn.id ? 'bg-indigo-600 text-white shadow-md border-indigo-700 scale-102 ring-2 ring-indigo-500/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-teal-800/40 hover:bg-slate-200 dark:hover:bg-slate-800')}
                     >
                        <btn.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span className="leading-snug">{btn.label}</span>
                        <span className={"px-2.5 py-0.5 rounded-lg text-xs sm:text-sm font-black font-mono border shadow-2xs " + (eqWorkflowStatus === btn.id ? 'bg-white/25 text-white border-white/30' : 'bg-slate-200 text-slate-950 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700')}>
                           {btn.count}
                        </span>
                     </button>
                   ))}
                </div>
             </div>

             {/* Table Section */}
             <div className={"rounded-[40px] border border-slate-100 dark:border-teal-800/20 shadow-xs overflow-hidden " + (isDark ? 'bg-[#081e2b]' : 'bg-white')}>
                {eqWorkflowStatus === 'sent_to_school' && (
                  <div className="p-3.5 bg-teal-500/10 dark:bg-teal-950/40 border-b border-teal-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-950 dark:text-teal-200">
                     <div className="flex items-center gap-2 font-black">
                        <Eye className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>سجل المعاملات المرسلة للمدرسة بعد فتح الشاغر لها (للاطلاع والمتابعة فقط 👁️):</span>
                     </div>
                     <div className="text-[10.5px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-3 py-1 rounded-xl border border-teal-300/60 dark:border-teal-700/60">
                        المعاملات المحالة من مشرف المعادلة إلى مشرف التخطيط لفتح الشاغر ثم التسكين في المدرسة.
                     </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                   <table className="w-full text-right text-xs">
                      <thead>
                         <tr className="bg-slate-50 dark:bg-slate-950 font-black text-slate-500 border-b border-slate-100 dark:border-teal-800/20 text-[10px]">
                            <th className="p-3 text-right">المستفيد</th>
                            <th className="p-3 text-right">التفاصيل والقطاع</th>
                            <th className="p-3 text-center">نوع الطلب</th>
                            <th className="p-3 text-center min-w-[340px]">الموظف مقدم الخدمة</th>
                            <th className="p-3 text-center">هل عولج؟</th>
                            <th className="p-3 text-center">التقييمات</th>
                            <th className="p-3 text-center">الإجراءات</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-teal-800/10">
                         {filteredEquivalencySurveys.length > 0 ? (
                           filteredEquivalencySurveys.map((s) => {
                              const cal = getSurveyCalData(s);
                              const isOpen = openCalendarSurveyId === s.id;
                              
                              return (
                                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all border-b border-slate-100 dark:border-teal-800/10 text-[11px] font-sans">

                                  {/* Column 2: المستفيد */}
                                  <td className="p-3 text-right">
                                     <div className="space-y-1">
                                        <div className="font-black text-xs text-slate-850 dark:text-slate-100 flex items-center justify-start gap-1">
                                           <User className="w-3.5 h-3.5 text-slate-400" />
                                           <span>{s.beneficiaryName || s.parentName || 'غير متوفر'}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                                           <Phone className="w-3 h-3 text-slate-400" />
                                           <span>{s.phoneNumber}</span>
                                        </div>
                                     </div>
                                  </td>

                                  {/* Column 3: التفاصيل والقطاع */}
                                  <td className="p-3 text-right">
                                     <div className="space-y-1">
                                        <div className="font-black text-xs text-purple-950 dark:text-purple-300 flex items-center justify-start gap-1">
                                           <Building2 className="w-3.5 h-3.5 text-purple-600" />
                                           <span>وحدة معادلة الشهادات ({s.stage || s.equalizationStage || 'المرحلة الدراسية'})</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                                           <School className="w-3 h-3 text-slate-400" />
                                           <span>الرغبة الأصلية: {s.schoolName || 'لم تحدد بعد'}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                           {s.stage || 'المعادلة'} • إدارة معادلة الشهادات بمنطقة المدينة المنورة
                                        </div>
                                     </div>
                                  </td>

                                  {/* Column 4: نوع الطلب */}
                                  <td className="p-3 text-center">
                                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#e0f2fe] text-[#0369a1] border border-sky-200">
                                        معادلة شهادة
                                     </span>
                                  </td>

                                  {/* Column 5: الموظف مقدم الخدمة */}
                                  <td className="p-3 text-center min-w-[340px]">
                                     <div className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-right space-y-3 shadow-xs">
                                        {/* Card Header */}
                                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                                           <div className="flex items-center gap-1.5 justify-start">
                                              <School className="w-4 h-4 text-[#009688]" />
                                              <span className="font-black text-[10px] text-slate-800 dark:text-white">
                                                 إدارة المعادلات والقبول ({s.stage || s.equalizationStage || 'عام'})
                                              </span>
                                           </div>
                                           <span className="px-2 py-0.5 rounded bg-[#009688]/10 text-[#009688] font-black text-[8px] uppercase tracking-wide">
                                              {s.stage === 'primary' || s.stage === 'الابتدائية' ? 'Primary' : s.stage === 'secondary' || s.stage === 'الثانوية' ? 'Secondary' : 'Intermediate'}
                                           </span>
                                        </div>

                                        {/* Status Line */}
                                        <div className="flex items-center justify-between text-[10px] font-bold">
                                           <span className="text-slate-400">حالة المعاملة:</span>
                                           {s.serviceEmployee && s.serviceEmployee !== 'غير مسند' ? (
                                              <span className="font-black text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                                 <UserCheck className="w-3.5 h-3.5" />
                                                 مستلم ({s.serviceEmployee})
                                              </span>
                                           ) : (
                                              <span className="font-black text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-pulse">
                                                 📥 وارد جديد غير مستلم
                                              </span>
                                           )}
                                        </div>

                                        {/* Claim Button */}
                                        {!(s.serviceEmployee && s.serviceEmployee !== 'غير مسند') && (
                                           <button
                                              type="button"
                                              onClick={() => handleClaimEquivalencySurvey(s)}
                                              className="w-full py-2 px-3 rounded-xl bg-[#009688] hover:bg-[#00796b] text-white font-black text-[11px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                           >
                                              <UserPlus className="w-3.5 h-3.5" />
                                              <span>استلام طلب المعادلة</span>
                                           </button>
                                        )}

                                        {/*                                         {/* Procedures Purple Container */}
                                        <div className="p-3 rounded-2xl border border-purple-200/80 bg-[#faf5ff] dark:bg-purple-950/10 space-y-3">
                                           <div className="font-black text-[10px] text-purple-950 dark:text-purple-300 flex items-center justify-between">
                                              <span className="flex items-center gap-1.5">
                                                 <FileText className="w-3.5 h-3.5 text-purple-600" />
                                                 <span>📋 إجراءات مسؤول معادلات الشهادات:</span>
                                              </span>
                                           </div>

                                           {/* Step 1 Button */}
                                           <div className="space-y-1">
                                              <div className="text-[9px] font-bold text-slate-500 text-right">1. أيقونة استلام الطلب:</div>
                                              <button
                                                 type="button"
                                                 onClick={() => handleClaimEquivalencySurvey(s)}
                                                 className="w-full py-2 px-3 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black text-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                                              >
                                                 <UserPlus className="w-3.5 h-3.5" />
                                                 <span>1. أيقونة استلام الطلب</span>
                                              </button>
                                           </div>

                                           {/* Step 2 Button */}
                                           <div className="space-y-1">
                                              <div className="text-[9px] font-bold text-slate-500 text-right">2. أيقونة تحديد موعد للمستفيد:</div>
                                              <button
                                                 type="button"
                                                 onClick={() => setOpenCalendarSurveyId(openCalendarSurveyId === s.id ? null : s.id)}
                                                 className="w-full py-2 px-3 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-black text-[10px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                                              >
                                                 <Calendar className="w-3.5 h-3.5" />
                                                 <span>2. أيقونة تحديد موعد للمستفيد</span>
                                              </button>
                                              {openCalendarSurveyId === s.id && (
                                                 <div className="mt-2 text-right">
                                                    {renderAppointmentScheduler(s)}
                                                 </div>
                                              )}
                                           </div>

                                           {/* Step 3 Button */}
                                           <div className="space-y-1 pt-1 border-t border-purple-200/40">
                                              {(s.hasReviewAppointment || s.appointmentConfirmedByBeneficiary) && (
                                               <div className="p-2.5 mb-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[9.5px] font-bold text-emerald-900 dark:text-emerald-200 space-y-1.5 text-right">
                                                  <div className="flex items-center justify-between gap-1 font-black text-emerald-900 dark:text-emerald-200">
                                                     <span className="flex items-center gap-1">
                                                        <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                        <span>الموعد: {s.appointmentDate} ({s.appointmentTime || '09:00 صباحاً'})</span>
                                                     </span>
                                                     {s.appointmentConfirmedByBeneficiary ? (
                                                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[8px]">
                                                           مؤكد من المستفيد ✓
                                                        </span>
                                                     ) : (
                                                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-black text-[8px]">
                                                           بانتظار التأكيد ⏳
                                                        </span>
                                                     )}
                                                  </div>
                                                  <div className="text-[9px] text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                                                     <div>
                                                        <span className="text-slate-500 dark:text-slate-400">📅 تاريخ إحالة تحديد الموعد من المسؤول: </span>
                                                        <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">
                                                           {s.appointmentSetAt 
                                                              ? `${new Date(s.appointmentSetAt).toLocaleDateString('ar-SA')} - ${new Date(s.appointmentSetAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`
                                                              : (s.createdAt ? new Date(s.createdAt).toLocaleDateString('ar-SA') : 'غير مسجل')}
                                                        </span>
                                                     </div>
                                                     <div>
                                                        <span className="text-slate-500 dark:text-slate-400">✅ تاريخ تأكيد الموعد من المستفيد: </span>
                                                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                                                           {s.appointmentConfirmedByBeneficiary
                                                              ? (s.appointmentConfirmedAt 
                                                                    ? `${new Date(s.appointmentConfirmedAt).toLocaleDateString('ar-SA')} - ${new Date(s.appointmentConfirmedAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`
                                                                    : 'تم التأكيد')
                                                              : 'لم يكتمل التأكيد بعد'}
                                                        </span>
                                                     </div>
                                                  </div>
                                               </div>
                                            )}
                                            <div className="text-[9px] font-bold text-slate-500 text-right">3. أيقونة رفع المعادلة من الجهاز:</div>
                                              <label className="w-full py-2 px-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95">
                                                 <Upload className="w-3.5 h-3.5" />
                                                 <span>3. رفع ملفات المعادلة من الجهاز (إمكانية رفع أكثر من 3 ملفات)</span>
                                                 <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => handleFileUpload(s, e)}
                                                    multiple
                                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                 />
                                              </label>
                                              {s.attachments && s.attachments.length > 0 && (
                                                 <div className="flex flex-wrap justify-end gap-1 mt-1">
                                                    {s.attachments.map((att, idx) => (
                                                       <span key={idx} className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-purple-200 text-[8px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                                          <FileText className="w-3 h-3 text-purple-600 shrink-0" />
                                                          <span className="truncate max-w-[120px]">{att.name}</span>
                                                          {att.data && (
                                                             <a href={att.data} download={att.name} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 underline text-[8.5px] font-bold">معاينة</a>
                                                          )}
                                                          <button type="button" onClick={() => handleDeleteAttachment(s, idx)} className="text-rose-500 hover:text-rose-700 font-black cursor-pointer px-1">✕</button>
                                                       </span>
                                                    ))}
                                                 </div>
                                              )}
                                           </div>

                                           {/* Action Buttons under Step 3 */}
                                           <div className="pt-2 border-t border-purple-200/40 space-y-2">
                                              {s.attachments && s.attachments.length > 0 ? (
                                                 <>
                                                    <div className="text-[10px] font-black text-purple-950 dark:text-purple-300 text-right mb-1">الخيارات المتاحة بعد رفع المعادلة:</div>
                                                    
                                                    {/* Option 1: Send to Planning */}
                                                    <button
                                                       type="button"
                                                       onClick={() => {
                                                          const updated = { 
                                                             ...s, 
                                                             isVacancyRequest: true,
                                                             vacancyRequestStatus: 'pending',
                                                             referredToPlanningAt: new Date().toISOString(),
                                                             eqReferredToPlanningAt: new Date().toISOString()
                                                          };
                                                          onUpdateSurvey(updated);
                                                          setClaimToastMessage("تمت إحالة الطلب بنجاح إلى مشرف التخطيط لفتح الشاغر 🔓");
                                                          setTimeout(() => setClaimToastMessage(null), 4000);
                                                       }}
                                                       className={"w-full py-2 px-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer " + 
                                                          (s.isVacancyRequest 
                                                             ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900" 
                                                             : "bg-blue-600 hover:bg-blue-700 text-white"
                                                          )}
                                                    >
                                                       <TrendingUp className="w-3.5 h-3.5" />
                                                       <span>{s.isVacancyRequest ? "تمت الإحالة لمشرف التخطيط ✓" : "طلب فتح شاغر (يرسل لمشرف التخطيط)"}</span>
                                                    </button>

                                                    {/* Option 2: Send to Leadership */}
                                                    <button
                                                       type="button"
                                                       onClick={() => {
                                                          const updated = { 
                                                             ...s, 
                                                             sentToLeadership: true,
                                                             sentToLeadershipAt: new Date().toISOString()
                                                          };
                                                          onUpdateSurvey(updated);
                                                          setClaimToastMessage("تم إرسال الطلب بنجاح إلى مشرف القيادة لمتابعة التسكين 👤");
                                                          setTimeout(() => setClaimToastMessage(null), 4000);
                                                       }}
                                                       className={"w-full py-2 px-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer " + 
                                                          (s.sentToLeadership 
                                                             ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300" 
                                                             : "bg-purple-600 hover:bg-purple-700 text-white"
                                                          )}
                                                    >
                                                       <UserCheck className="w-3.5 h-3.5" />
                                                       <span>{s.sentToLeadership ? "تم الإرسال لمشرف القيادة ✓" : "إرسال لمشرف القيادة لمتابعة التسكين"}</span>
                                                    </button>

                                                    {/* Option 3: Standard Close */}
                                                    <button
                                                       type="button"
                                                       onClick={() => {
                                                          const isStaffed = Boolean(s.staffingConfirmedAt || s.principalConfirmedStaffing);
                                                          if (!isStaffed) {
                                                             setClaimToastMessage("⚠️ تنبيه نظامي: لا يمكن أرشفة المعاملة وإغلاقها إلا بعد تسكين الطالب من قبل مدير المدرسة.");
                                                             setTimeout(() => setClaimToastMessage(null), 5000);
                                                             return;
                                                          }
                                                          const updated = { 
                                                             ...s, 
                                                             isResolved: true,
                                                             resolvedAt: new Date().toISOString()
                                                          };
                                                          onUpdateSurvey(updated);
                                                          setClaimToastMessage("تم إنجاز معاملة المعادلة بنجاح وإغلاقها وأرشفتها ✓");
                                                          setTimeout(() => setClaimToastMessage(null), 4000);
                                                       }}
                                                       className="w-full py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[9px] flex items-center justify-center gap-1 transition-all hover:bg-slate-50 cursor-pointer active:scale-95"
                                                    >
                                                       <CheckCircle2 className="w-3 h-3" />
                                                       <span>اعتماد المعادلة وإغلاق الملف مباشرة</span>
                                                    </button>
                                                 </>
                                              ) : (
                                                 <div className="text-[9px] font-bold text-center text-slate-400 py-1.5 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
                                                    يرجى رفع المعادلة أولاً لتفعيل خيارات التوجيه والمتابعة 📤
                                                 </div>
                                              )}
                                           </div>
                                        </div>
                                        
                                        {/* Reassignment / Assignment Modal Link */}
                                        <div className="flex justify-end pt-1">
                                           <button
                                              type="button"
                                              onClick={() => {
                                                 setAssignTargetSurvey(s);
                                                 setSelectedOfficerForAssign(s.serviceEmployee || DEMO_OFFICERS[0].nameAr);
                                                 setShowAssignModal(true);
                                              }}
                                              className="text-[#7c3aed] hover:text-[#6d28d9] font-black text-[9.5px] flex items-center gap-1.5 cursor-pointer underline hover:no-underline"
                                           >
                                              <UserPlus className="w-3.5 h-3.5" />
                                              <span>إسناد/إحالة لمشرف</span>
                                           </button>
                                        </div>
                                     </div>
                                  </td>

                                  {/* Column 6: هل عولج */}
                                  <td className="p-3 text-center">
                                     <button
                                        type="button"
                                        onClick={() => {
                                           if (!s.isResolved) {
                                              const isStaffed = Boolean(s.staffingConfirmedAt || s.principalConfirmedStaffing);
                                              if (!isStaffed) {
                                                 setClaimToastMessage("⚠️ تنبيه: لا يمكن أرشفة المعاملة أو تمييزها كمعالجة إلا بعد تسكين الطالب من قبل مدير المدرسة.");
                                                 setTimeout(() => setClaimToastMessage(null), 5000);
                                                 return;
                                              }
                                           }
                                           onToggleResolved(s.id);
                                           setClaimToastMessage(s.isResolved ? "تم تحويل المعاملة إلى تحت الإجراء ⏳" : "تم تمييز المعاملة كمعالجة ومؤرشفة بنجاح! ✓");
                                           setTimeout(() => setClaimToastMessage(null), 3000);
                                        }}
                                        className={"inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer active:scale-95 shadow-2xs " +
                                           (s.isResolved
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900"
                                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
                                           )
                                        }
                                     >
                                        {s.isResolved ? (
                                           <>
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>تمت المعالجة ✓</span>
                                           </>
                                        ) : (
                                           <>
                                              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                              <span>تحت الإجراء ⏳</span>
                                           </>
                                        )}
                                     </button>
                                  </td>

                                  {/* Column 7: التقييمات */}
                                  <td className="p-3 text-center">
                                     <div className="inline-block p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-right space-y-1">
                                        <div className="flex items-center justify-end gap-1 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                                           <span>الموظف: {s.staffSatisfaction || 0}</span>
                                           <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        </div>
                                        <div className="flex items-center justify-end gap-1 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                                           <span>الاستقبال: {s.receptionSatisfaction || 0}</span>
                                           <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        </div>
                                     </div>
                                  </td>

                                  {/* Column 8: الإجراءات */}
                                  <td className="p-3 text-center">
                                     <div className="flex items-center justify-center gap-1.5">
                                        {/* Review & Assign School button */}
                                        <button
                                           type="button"
                                           onClick={() => setReviewRegistrationSurvey(s)}
                                           className="p-2 text-purple-600 hover:text-purple-800 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 rounded-xl transition-all cursor-pointer"
                                           title="استعراض الطلب وتحديد مدرسة التسجيل"
                                        >
                                           <Eye className="w-4 h-4" />
                                        </button>

                                        {/* Comment icon */}
                                        <button
                                           type="button"
                                           onClick={() => {
                                              setClaimToastMessage(`ملاحظات المعاملة: ${s.notes || 'لا توجد ملاحظات إضافية'}`);
                                              setTimeout(() => setClaimToastMessage(null), 5000);
                                           }}
                                           className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition-all cursor-pointer"
                                           title="عرض الملاحظات"
                                        >
                                           <MessageSquare className="w-4 h-4" />
                                        </button>

                                        {/* Delete icon */}
                                        <button
                                           type="button"
                                           onClick={() => {
                                              onDeleteSurvey(s.id);
                                              setClaimToastMessage("تم حذف المعاملة بنجاح ✓");
                                              setTimeout(() => setClaimToastMessage(null), 3000);
                                           }}
                                           className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                                           title="حذف المعاملة"
                                        >
                                           <Trash2 className="w-4 h-4" />
                                        </button>
                                     </div>
                                  </td>
                                </tr>
                              );
                           })
                         ) : (
                            <tr><td colSpan={8} className="p-10 text-center text-slate-400 font-bold">لا توجد معاملات معادلة</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {/* VIEW: INQUIRIES & COMMUNICATION (الاستفسارات والتواصل - صفحة مستقلة لمسؤولي القبول) */}
        {activeFeature === 'inquiries' && (
          <div className="space-y-6">
            <AdmissionInquiriesView
              inquiries={inquiries}
              onUpdateInquiries={onUpdateInquiries || (() => {})}
              activeOfficer={activeOfficer}
              isDark={isDark}
              isRtl={isRtl}
              defaultTab={inquiriesDefaultTab}
              onNavigateToRequests={() => setActiveFeature('requests')}
            />
          </div>
        )}

        {/* VIEW 3: SYNC & CLOUD INTEGRATION (المزامنة والربط الإلكتروني) */}
        {activeFeature === 'sync' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs ${isDark ? 'bg-[#081e2b]' : 'bg-white'}`}>
               <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
                        <RefreshCw className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">منظومة المزامنة السحابية وقواعد البيانات</h2>
                        <p className="text-xs font-bold text-slate-400">إدارة تخزين البيانات السحابي والمحلي، النسخ الاحتياطي، وسجلات الربط الآلي.</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={onSyncNow}
                       className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer"
                     >
                        <RefreshCw className="w-4 h-4" />
                        مزامنة الآن فورياً
                     </button>
                     <button 
                       onClick={onTriggerManualBackup}
                       className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer"
                     >
                        <Save className="w-4 h-4" />
                        توليد نسخة احتياطية
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-teal-900/30">
                     <div className="text-xs text-slate-400 font-black">حالة الاتصال بالشبكة</div>
                     <div className="text-lg font-black text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {isOnline ? 'متصل بالسحابة (Online)' : 'غير متصل (Offline)'}
                     </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-teal-900/30">
                     <div className="text-xs text-slate-400 font-black">السجلات بانتظار المزامنة</div>
                     <div className="text-lg font-black text-slate-800 dark:text-white mt-1">
                        {unsyncedCount} سجل
                     </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-teal-900/30">
                     <div className="text-xs text-slate-400 font-black">إجمالي السجلات المخزنة</div>
                     <div className="text-lg font-black text-slate-800 dark:text-white mt-1">
                        {surveys.length} معاملة
                     </div>
                  </div>
               </div>

               {/* System logs table */}
               <div className="border border-slate-100 dark:border-teal-800/20 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 font-black text-xs text-slate-700 dark:text-slate-300">
                     سجلات التكامل والمزامنة الأخيرة
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-teal-800/10 text-xs">
                     {integrationLogs.length > 0 ? (
                       integrationLogs.slice(0, 10).map(log => (
                         <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                            <div>
                               <div className="font-bold text-slate-800 dark:text-white">{log.systemName}</div>
                               <div className="text-[10px] text-slate-400">{log.payloadSent || 'نجحت عملية الربط والمزامنة'}</div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString('ar-SA')}</span>
                         </div>
                       ))
                     ) : (
                       <div className="p-8 text-center text-slate-400">لا توجد سجلات أخطاء أو تعارضات.</div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SETTINGS (لوحة الإعدادات الشاملة) */}
        {activeFeature === 'settings' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs ${isDark ? 'bg-[#081e2b]' : 'bg-white'}`}>
               <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
                        <Settings className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">لوحة الإعدادات الشاملة للنظام</h2>
                        <p className="text-xs font-bold text-slate-400">تخصيص الإشعارات، النسخ الاحتياطي التلقائي، وإدارة قواعد البيانات.</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-teal-900/30 space-y-4">
                     <h3 className="text-sm font-black text-slate-800 dark:text-white">إعدادات الإشعارات والبريد الإلكتروني</h3>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">البريد الإلكتروني المعتمد لإشعارات الإدارة (مفصول بفاصلة):</label>
                        <input 
                          type="text" 
                          value={config.adminEmails}
                          onChange={(e) => onUpdateConfig({ ...config, adminEmails: e.target.value })}
                          className="w-full p-3 bg-white dark:bg-[#061b28] border border-slate-200 dark:border-teal-800/40 rounded-xl text-xs font-bold outline-hidden"
                          placeholder="admin@qabuledu.com, director@qabuledu.com"
                        />
                     </div>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-teal-900/30 space-y-4">
                     <h3 className="text-sm font-black text-slate-800 dark:text-white">النسخ الاحتياطي التلقائي</h3>
                     <div className="flex items-center justify-between">
                        <div>
                           <div className="text-xs font-bold text-slate-700 dark:text-slate-300">تفعيل النسخ الاحتياطي الآلي في الخلفية</div>
                           <div className="text-[10px] text-slate-400">يتم حفظ نسخة احتياطية محلية وسحابية تلقائياً كل فترة محددة.</div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={config.autoBackupEnabled}
                          onChange={(e) => onUpdateConfig({ ...config, autoBackupEnabled: e.target.checked })}
                          className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
                        />
                     </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-3">
                     <div className="flex items-center gap-2 text-rose-600">
                        <ShieldAlert className="w-5 h-5" />
                        <h3 className="text-sm font-black">منطقة العمليات الحساسة (Danger Zone)</h3>
                     </div>
                     <p className="text-xs text-rose-600/80">مسح كافة المعاملات والبيانات المسجلة بالنظام نهائياً. لا يمكن التراجع عن هذه الخطوة.</p>
                     <div className="flex items-center gap-3 pt-2">
                        <button 
                          onClick={() => setShowClearAllModal(true)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs active:scale-95 flex items-center gap-2"
                        >
                           <Trash2 className="w-4 h-4" />
                           مسح كافة البيانات وإعادة التعيين
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* VIEW 5: PLACEMENTS (طلبات التسكين والمتابعة بالمدارس) */}
        {activeFeature === 'placements' && (() => {
          // Resolve current sub-tab based on logged in officer's role
          const resolvedSubTab = placementsSubTab || (
             activeOfficer.role === 'school_planning' ? 'planning' : 
             activeOfficer.role === 'school_leadership' ? 'leadership' : 'general'
          );

          // Filtering logic
          const planningRequests = surveys.filter(s => !s.isResolved && ((s.isVacancyRequest && s.vacancyRequestStatus === 'pending') || s.vacancyRequestStatus === 'returned_no_vacancy' || s.returnedByPrincipal));
          const leadershipRequests = surveys.filter(s => !s.isResolved && (s.sentToLeadership || s.returnedByPrincipal || s.vacancyRequestStatus === 'returned_no_vacancy'));
          const generalPlacements = surveys.filter(s => s.vacancyRequestStatus === 'vacancy_opened' || s.sentToSchoolPrincipal || s.staffingConfirmedAt || s.returnedByPrincipal);

          const isPowerUser = ['admin', 'director', 'supervisor'].includes(activeOfficer.role);

          return (
            <div className="space-y-6 text-right" dir="rtl">
              <div className={`p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs ${isDark ? 'bg-[#081e2b]' : 'bg-white'}`}>
                 
                 {/* Header Block */}
                 <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-teal-800/10">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600">
                          <Building2 className="w-6 h-6" />
                       </div>
                       <div>
                          <h2 className="text-lg font-black text-slate-900 dark:text-white">بوابة التسكين والمتابعة المدرسية الذكية</h2>
                          <p className="text-xs font-bold text-slate-400">
                             {activeOfficer.role === 'school_planning' && "مرحبًا بك مشرف التخطيط (كمال الأحمدي) - دراسة بدائل المدارس واعتماد الشواغر."}
                             {activeOfficer.role === 'school_leadership' && "مرحبًا بك مشرف القيادة (سامي الأحمدي) - متابعة انتظام الطلاب والاتصال المباشر بالمديرين."}
                             {isPowerUser && "لوحة التحكم الشاملة لإدارة الشواغر وإجراءات تسكين المدارس ومتابعتها."}
                          </p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setActiveFeature('requests')}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-200"
                    >
                       <ArrowRight className="w-4 h-4" />
                       <span>العودة للطلبات العامة</span>
                    </button>
                 </div>

                 {/* Segmented Controller / Tabs for authorized/power users only */}
                 {isPowerUser && (
                    <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl mb-6">
                       <button
                          onClick={() => setPlacementsSubTab('planning')}
                          className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${resolvedSubTab === 'planning' ? 'bg-white dark:bg-[#0c2535] text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                       >
                          <TrendingUp className="w-4 h-4" />
                          <span>فتح الشواغر (التخطيط)</span>
                          {planningRequests.length > 0 && (
                             <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-bold">
                                {planningRequests.length}
                             </span>
                          )}
                       </button>
                       <button
                          onClick={() => setPlacementsSubTab('leadership')}
                          className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${resolvedSubTab === 'leadership' ? 'bg-white dark:bg-[#0c2535] text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                       >
                          <UserCheck className="w-4 h-4" />
                          <span>متابعة التسكين (القيادة)</span>
                          {leadershipRequests.length > 0 && (
                             <span className="px-1.5 py-0.5 rounded-md bg-indigo-500 text-white text-[9px] font-bold">
                                {leadershipRequests.length}
                             </span>
                          )}
                       </button>
                       <button
                          onClick={() => setPlacementsSubTab('general')}
                          className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${resolvedSubTab === 'general' ? 'bg-white dark:bg-[#0c2535] text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                       >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>سجل الانتظام والتسكين</span>
                          {generalPlacements.length > 0 && (
                             <span className="px-1.5 py-0.5 rounded-md bg-teal-500 text-white text-[9px] font-bold">
                                {generalPlacements.length}
                             </span>
                          )}
                       </button>
                    </div>
                 )}

                 {/* VIEW CONTENT BY RESOLVED TAB */}
                 <div className="space-y-4">
                    
                    {/* 1. PLANNING WORKSPACE */}
                    {resolvedSubTab === 'planning' && (
                       <div className="space-y-4">
                          <div className="p-4 bg-teal-500/10 rounded-2xl border border-teal-500/20 text-xs sm:text-sm font-bold text-teal-800 dark:text-teal-200 mb-2 flex items-center gap-2.5">
                             <Building2 className="w-5 h-5 text-teal-600 shrink-0" />
                             <span>📌 شاشة التخطيط المدرسي لدراسة واعتماد الشواغر: تُعرض هنا المدارس المحددة من قِبل مسؤولي القبول والتسجيل لدراسة إمكانية الفصول واعتماد فتح الشاغر مباشرة للمدرسة المعنية.</span>
                          </div>

                          {planningRequests.length > 0 ? (
                             planningRequests.map(s => {
                                const assignedSchool = s.assignedRegistrationSchool || s.schoolName || s.firstSchoolName || 'لم تحدد المدرسة بعد';
                                const assignedCode = s.assignedRegistrationSchoolCode || s.schoolCode || '';
                                const supervisorName = s.assignedBySupervisorName || s.serviceEmployee || 'مشرف القبول والتسجيل';
                                const supervisorNotes = s.assignedRegistrationSchoolNotes;
                                const assignedDate = s.assignedRegistrationSchoolAt || s.referredToPlanningAt;

                                return (
                                   <div key={s.id} className="p-6 rounded-3xl border-2 border-slate-200 dark:border-teal-800/40 bg-slate-50/60 dark:bg-slate-900/40 space-y-5 transition-all hover:border-teal-500/50 shadow-xs">
                                      {/* Return reason alert banner if returned by principal */}
                                      {(s.returnedByPrincipal || s.vacancyRequestStatus === 'returned_no_vacancy' || s.principalReturnReason) && (
                                         <div className="p-4 bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl space-y-2 text-rose-900 dark:text-rose-100">
                                            <div className="flex items-center gap-2 font-black text-sm text-rose-700 dark:text-rose-300">
                                               <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce shrink-0" />
                                               <span>🚨 أعيد الطلب من مدير المدرسة ({s.schoolName || s.firstSchoolName || 'المدرسة'}) لعدم توفر شاغر:</span>
                                            </div>
                                            <div className="text-sm font-bold bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 leading-relaxed text-slate-800 dark:text-white">
                                               📌 سبب الإعادة المكتوب من مدير المدرسة: "{s.principalReturnReason || s.unresolvedReason || 'تعذر التسكين لعدم توفر شاغر بالمرحلة/الصف'}"
                                            </div>
                                            {s.returnedAt && (
                                               <div className="text-xs text-slate-500 text-left font-mono">
                                                  تاريخ الإعادة لمشرف التخطيط: {new Date(s.returnedAt).toLocaleString('ar-SA')}
                                               </div>
                                            )}
                                         </div>
                                      )}

                                      {/* Student Details Header */}
                                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-teal-800/20 pb-4">
                                         <div>
                                            <div className="flex items-center gap-3">
                                               <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                                                  {s.beneficiaryName}
                                               </span>
                                               <span className="text-xs sm:text-sm font-mono font-black px-2.5 py-1 bg-teal-100/80 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-lg">
                                                  طلب #{s.id}
                                               </span>
                                            </div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                                               تاريخ تقديم الطلب: {new Date(s.submittedAt || s.createdAt).toLocaleDateString('ar-SA')}
                                            </div>
                                         </div>
                                         <div className="text-xs sm:text-sm px-3.5 py-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl font-black flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-amber-600" />
                                            <span>بانتظار اعتماد فتح الشاغر من التخطيط</span>
                                         </div>
                                      </div>

                                      {/* Request Data Grid - Clear, medium, larger font */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-teal-900/30">
                                         <div>
                                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 block mb-0.5">الهوية الوطنية / الإقامة:</span>
                                            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">{s.nationalId || '---'}</span>
                                         </div>
                                         <div>
                                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 block mb-0.5">رقم جوال ولي الأمر:</span>
                                            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono dir-ltr text-right">{s.phoneNumber || '---'}</span>
                                         </div>
                                         <div>
                                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 block mb-0.5">المرحلة والصف الدراسي:</span>
                                            <span className="text-sm sm:text-base font-black text-teal-700 dark:text-teal-300">{s.stage} ({s.grade || 'غير محدد'})</span>
                                         </div>
                                         <div>
                                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 block mb-0.5">الجنس / نوع التعليم:</span>
                                            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{s.gender === 'boys' ? 'بنين' : s.gender === 'girls' ? 'بنات' : 'غير محدد'}</span>
                                         </div>
                                         <div>
                                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 block mb-0.5">الحي السكني:</span>
                                            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{s.neighborhood || 'غير محدد'}</span>
                                         </div>
                                         <div>
                                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 block mb-0.5">نوع الطلب / الإشكالية:</span>
                                            <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-300">{s.problemType}</span>
                                         </div>
                                      </div>

                                      {/* Beneficiary Details if present */}
                                      {(s.otherProblemDetails || s.notes) && (
                                         <div className="p-4 rounded-xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                            <span className="text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300 block mb-1">📝 شرح وتفاصيل الطلب من المستفيد:</span>
                                            <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">{s.otherProblemDetails || s.notes}</p>
                                         </div>
                                      )}

                                      {/* The School Specified ONLY by Admission Supervisor */}
                                      <div className="p-5 rounded-2xl border-2 border-teal-500/40 bg-teal-50/50 dark:bg-teal-950/30 space-y-3.5">
                                         <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/80 dark:border-teal-800/40 pb-2.5">
                                            <div className="flex items-center gap-2">
                                               <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                               <span className="text-sm sm:text-base font-black text-teal-950 dark:text-teal-200">
                                                  المدرسة المحددة للتسكين من قِبل مسؤول القبول والتسجيل:
                                               </span>
                                            </div>
                                            {assignedDate && (
                                               <span className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-400 font-mono">
                                                  تاريخ التحديد: {new Date(assignedDate).toLocaleString('ar-SA')}
                                               </span>
                                            )}
                                         </div>

                                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1.5">
                                               <div className="text-base sm:text-lg font-black text-teal-900 dark:text-teal-100 flex flex-wrap items-center gap-2.5">
                                                  <span className="bg-teal-600 text-white p-2 rounded-xl">
                                                     <School className="w-5 h-5" />
                                                  </span>
                                                  <span className="text-lg sm:text-xl font-black">{assignedSchool}</span>
                                                  {assignedCode && (
                                                     <span className="text-xs sm:text-sm font-mono px-2.5 py-1 bg-teal-200/80 dark:bg-teal-900 text-teal-900 dark:text-teal-200 rounded-lg font-bold">
                                                        كود المدرسة: {assignedCode}
                                                     </span>
                                                  )}
                                               </div>
                                               <div className="text-xs sm:text-sm font-bold text-teal-800 dark:text-teal-300">
                                                  مشرف القبول والتسجيل المحدد: <strong className="text-slate-900 dark:text-white">{supervisorName}</strong>
                                               </div>
                                            </div>

                                            {/* ايقونة وزر اعتماد فتح الشاغر */}
                                            <button
                                               type="button"
                                               onClick={() => {
                                                  const finalSchool = assignedSchool;
                                                  const updated: SurveyResponse = {
                                                     ...s,
                                                     schoolName: finalSchool,
                                                     assignedRegistrationSchool: finalSchool,
                                                     assignedRegistrationSchoolCode: assignedCode || s.schoolCode,
                                                     vacancyRequestStatus: 'vacancy_opened',
                                                     sentToSchoolPrincipal: true,
                                                     sentToPrincipalAt: new Date().toISOString(),
                                                     vacancyApprovedAt: new Date().toISOString(),
                                                     ...(s.returnedByPrincipal ? { planningReResolvedAt: new Date().toISOString() } : {}),
                                                     isVacancyRequest: false,
                                                     returnedByPrincipal: false,
                                                     vacancyRequestNotes: `تم اعتماد فتح شاغر وتوطين الطالب في المدرسة: ${finalSchool} بواسطة مشرف التخطيط (${activeOfficer.nameAr}) بتاريخ ${new Date().toLocaleDateString('ar-SA')}`
                                                  };
                                                  onUpdateSurvey(updated);
                                                  setClaimToastMessage(`تم بنجاح اعتماد فتح الشاغر للمدرسة "${finalSchool}" وتوجيه الطلب لمدير المدرسة للتسكين فوراً ✓`);
                                                  setTimeout(() => setClaimToastMessage(null), 4000);
                                               }}
                                               className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm sm:text-base font-black transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                                               title="اعتماد فتح الشاغر"
                                            >
                                               <Unlock className="w-5 h-5 shrink-0" />
                                               <span>{s.returnedByPrincipal ? 'معالجة السبب وإعادة تحويل الطلب لمدير المدرسة للتسكين' : 'اعتماد فتح الشاغر'}</span>
                                            </button>
                                         </div>

                                         {supervisorNotes && (
                                            <div className="p-3 bg-white/95 dark:bg-slate-900/90 rounded-xl border border-teal-200 dark:border-teal-800 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                               <span className="text-teal-800 dark:text-teal-300 font-black">💡 توجيه وملاحظات مشرف القبول والتسجيل: </span>
                                               <span>{supervisorNotes}</span>
                                            </div>
                                         )}
                                      </div>

                                      {/* Additional Details Preview Button */}
                                      <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-teal-800/10">
                                         <button
                                            type="button"
                                            onClick={() => setSelectedSurvey(s)}
                                            className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5"
                                         >
                                            <Eye className="w-4 h-4" />
                                            <span>معاينة تفاصيل المستفيد والطلب كاملة</span>
                                         </button>
                                      </div>
                                   </div>
                                );
                             })
                          ) : (
                             <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                لا توجد معاملات جارية لفتح شواغر تحت تصرف مشرف التخطيط حالياً.
                             </div>
                          )}
                       </div>
                    )}

                    {/* 2. LEADERSHIP WORKSPACE */}
                    {resolvedSubTab === 'leadership' && (
                       <div className="space-y-4">
                          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex flex-wrap items-center justify-between gap-2">
                             <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>📌 شاشة المتابعة والتواصل لمشرف القيادة المدرسية: متابعة انتظام الطلاب وسرعة تجاوب مديري المدارس في التسكين.</span>
                             </div>
                             <div className="flex items-center gap-3 text-[11px] font-black">
                                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                   <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block"></span>
                                   شريط أحمر = متأخر عن يوم عمل (24 ساعة)
                                </span>
                                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                   <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                                   شريط أزرق = ضمن المدة المحددة
                                </span>
                             </div>
                          </div>

                          {leadershipRequests.length > 0 ? (
                             leadershipRequests.map(s => {
                                // Determine the timestamp when sent to principal with approval of vacancy
                                const sentTimeStr = s.sentToPrincipalAt || s.referredToPlanningAt || s.submittedAt;
                                const sentDateObj = sentTimeStr ? new Date(sentTimeStr) : new Date();
                                const isValidDate = !isNaN(sentDateObj.getTime());
                                
                                const formattedSentDate = isValidDate 
                                   ? `${sentDateObj.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - الساعة ${sentDateObj.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`
                                   : 'مؤرخة بتاريخ اليوم';

                                // Calculate elapsed time
                                const now = new Date().getTime();
                                const sentTimestamp = isValidDate ? sentDateObj.getTime() : now;
                                const diffMs = now - sentTimestamp;
                                const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                                const diffDays = Math.floor(diffHours / 24);

                                // Check if delayed more than 1 working day (>= 24 hours) and not yet fully completed
                                const isDelayed = diffHours >= 24 && !s.staffingConfirmedAt;

                                return (
                                   <div 
                                      key={s.id} 
                                      className={`p-6 rounded-3xl border-2 transition-all space-y-5 shadow-sm text-right ${
                                         isDelayed 
                                            ? 'border-rose-400 dark:border-rose-700/80 bg-rose-50/50 dark:bg-rose-950/20 border-r-8 border-r-rose-600 dark:border-r-rose-500 ring-2 ring-rose-500/10' 
                                            : 'border-indigo-200 dark:border-indigo-800/40 bg-white dark:bg-slate-900/60 border-r-8 border-r-indigo-600 dark:border-r-indigo-500'
                                      }`}
                                   >
                                      {/* Alert banner if returned by principal */}
                                      {(s.returnedByPrincipal || s.vacancyRequestStatus === 'returned_no_vacancy' || s.principalReturnReason) && (
                                         <div className="p-3.5 bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl space-y-1.5 text-rose-900 dark:text-rose-100">
                                            <div className="flex items-center gap-2 font-black text-xs text-rose-700 dark:text-rose-300">
                                               <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce shrink-0" />
                                               <span>🚨 أعيد الطلب من مدير المدرسة ({s.schoolName || s.firstSchoolName || 'المدرسة'}) لعدم توفر شاغر:</span>
                                            </div>
                                            <div className="text-xs font-bold bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 leading-relaxed text-slate-800 dark:text-white">
                                               📌 سبب الإعادة المكتوب من مدير المدرسة: "{s.principalReturnReason || s.unresolvedReason || 'تعذر التسكين لعدم توفر شاغر بالمرحلة/الصف'}"
                                            </div>
                                            {s.returnedAt && (
                                               <div className="text-[10px] text-slate-500 text-left font-mono">
                                                  تاريخ الإعادة للقيادة والتخطيط: {new Date(s.returnedAt).toLocaleString('ar-SA')}
                                               </div>
                                            )}
                                         </div>
                                      )}

                                      {/* Alert banner if delayed */}
                                      {isDelayed && (
                                         <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-rose-800 dark:text-rose-200">
                                            <div className="flex items-center gap-2 font-black text-xs">
                                               <AlertCircle className="w-5 h-5 text-rose-600 animate-bounce" />
                                               <span>⚠️ تنبيه تأخير: تجاوزت المعاملة يوم عمل كامل ({diffHours} ساعة) منذ إرسالها لمدير المدرسة دون تأكيد التسكين والانتظام!</span>
                                            </div>
                                            <span className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black shadow-xs">
                                               متأخر عن المدة المحددة ({diffDays > 0 ? `${diffDays} يوم و ` : ''}{diffHours % 24} ساعة)
                                            </span>
                                         </div>
                                      )}

                                      {/* Top Header with prominent badges */}
                                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                                         <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isDelayed ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700'}`}>
                                               <UserCheck className="w-6 h-6" />
                                            </div>
                                            <div>
                                               <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{s.beneficiaryName}</span>
                                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                     رقم الهوية: <strong className="font-mono text-slate-900 dark:text-white">{s.nationalId || '---'}</strong>
                                                  </span>
                                               </div>
                                               <div className="text-xs text-slate-500 mt-1 font-bold flex flex-wrap items-center gap-3">
                                                  <span>رقم الطلب: <strong className="font-mono text-indigo-600 dark:text-indigo-400">#{s.id.slice(-6).toUpperCase()}</strong></span>
                                                  <span>•</span>
                                                  <span>رقم الجوال للتواصل: <strong className="font-mono text-slate-800 dark:text-slate-200" dir="ltr">{s.phoneNumber}</strong></span>
                                               </div>
                                            </div>
                                         </div>

                                         <div className="flex items-center gap-2">
                                            {isDelayed ? (
                                               <span className="px-3.5 py-1.5 bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl text-xs font-black border border-rose-300 dark:border-rose-800 flex items-center gap-1.5 shadow-xs">
                                                  <Clock className="w-4 h-4 text-rose-600" />
                                                  <span>متأخر عن يوم عمل ⚠️</span>
                                               </span>
                                            ) : (
                                               <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                                                  <Clock className="w-4 h-4 text-emerald-600" />
                                                  <span>ضمن المدة النظامية ✓</span>
                                               </span>
                                            )}
                                         </div>
                                      </div>

                                      {/* High-visibility Request Details Grid (Bold & High Contrast) */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-100/70 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                                         
                                         {/* School Target */}
                                         <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                            <div className="text-[10px] font-bold text-slate-500">المدرسة المعتمدة للتسكين:</div>
                                            <div className="text-sm font-black text-indigo-700 dark:text-indigo-400 mt-1 truncate" title={s.schoolName || s.firstSchoolName || ''}>
                                               🏫 {s.schoolName || s.firstSchoolName || 'لم تحدد'}
                                            </div>
                                         </div>

                                         {/* Stage and Grade */}
                                         <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                            <div className="text-[10px] font-bold text-slate-500">المرحلة والصف الدراسي:</div>
                                            <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                               🎓 {s.stage} - {s.grade || 'غير محدد'}
                                            </div>
                                         </div>

                                         {/* Neighborhood & Gender */}
                                         <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                            <div className="text-[10px] font-bold text-slate-500">الحي والنوع:</div>
                                            <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                               📍 {s.neighborhood || '---'} ({s.gender === 'boys' ? 'بنين' : s.gender === 'girls' ? 'بنات' : 'مشترك'})
                                            </div>
                                         </div>

                                         {/* Equivalency & Attachments */}
                                         <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                            <div className="text-[10px] font-bold text-slate-500">حالة معادلة المؤهل:</div>
                                            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                               <CheckCircle2 className="w-4 h-4" />
                                               <span>معادلة مؤكدة ومرفوعة</span>
                                            </div>
                                         </div>
                                      </div>

                                      {/* Sent to Principal Timestamp Banner (Explicit requirement) */}
                                      <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                                         isDelayed 
                                            ? 'bg-rose-100/60 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100' 
                                            : 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
                                      }`}>
                                         <div className="flex items-center gap-2 font-black">
                                            <Calendar className={`w-4 h-4 ${isDelayed ? 'text-rose-600' : 'text-indigo-600'}`} />
                                            <span>📅 تاريخ ووقت إرسال الطلب لمدير المدرسة باعتماد فتح الشاغر:</span>
                                            <span className="font-bold underline decoration-2 underline-offset-4">{formattedSentDate}</span>
                                         </div>
                                         <div className="font-bold text-[11px]">
                                            <span>المدة المنقضية منذ الإرسال: </span>
                                            <strong className={`font-black ${isDelayed ? 'text-rose-700 dark:text-rose-300' : 'text-indigo-700 dark:text-indigo-300'}`}>
                                               {diffHours} ساعة {diffDays > 0 ? `(${diffDays} يوم)` : ''}
                                            </strong>
                                         </div>
                                      </div>

                                      {/* Full 7-Step Dispatch & LifeCycle Timeline */}
                                      <div className="pt-2">
                                         <RequestDispatchTimeline survey={s} />
                                      </div>

                                      {/* Show Follow up logs if any */}
                                      {s.leadershipFollowUpConfirmed && (
                                         <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
                                            <div className="font-black flex items-center gap-2">
                                               <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                               <span>تمت المتابعة وتوثيق الاتصال المباشر بمدير المدرسة بنجاح:</span>
                                            </div>
                                            <div className="font-bold text-sm bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                                               "{s.leadershipFollowUpNotes}"
                                            </div>
                                            <div className="text-[10px] text-slate-500 text-left pt-1 font-mono">
                                               تاريخ التوثيق: {new Date(s.leadershipFollowUpAt || '').toLocaleString('ar-SA')}
                                            </div>
                                         </div>
                                      )}

                                      {/* Input Area for Leadership Notes */}
                                      <div>
                                         <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                                            📝 تقرير وملاحظات المتابعة والاتصال المباشر مع مدير المدرسة:
                                         </label>
                                         <textarea
                                            value={leadershipNotesText[s.id] || ''}
                                            onChange={(e) => setLeadershipNotesText({ ...leadershipNotesText, [s.id]: e.target.value })}
                                            placeholder="اكتب تفاصيل المتابعة مع المدير لتأكيد حجز المقعد وتسكين الطالب فوراً بالفصل الدراسي..."
                                            className="w-full p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[75px] resize-y"
                                         />
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                         <button
                                            type="button"
                                            onClick={() => setSelectedSurvey(s)}
                                            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                                         >
                                            معاينة تفاصيل الملف بالكامل
                                         </button>
                                         <button
                                            type="button"
                                            onClick={() => {
                                               const notes = leadershipNotesText[s.id]?.trim() || "تم الاتصال المباشر بمدير المدرسة والتأكيد على حجز المقعد وتسكين الطالب فوراً بالفصل";
                                               const updated = {
                                                  ...s,
                                                  leadershipFollowUpConfirmed: true,
                                                  leadershipFollowUpNotes: notes,
                                                  leadershipFollowUpAt: new Date().toISOString()
                                               };
                                               onUpdateSurvey(updated);
                                               setClaimToastMessage("تم تأكيد وتوثيق المتابعة مع مدير المدرسة بنجاح ✓");
                                               setTimeout(() => setClaimToastMessage(null), 4000);
                                            }}
                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                                         >
                                            <Send className="w-4 h-4" />
                                            <span>تأكيد المتابعة مع المدير لتسريع التسكين</span>
                                         </button>
                                      </div>
                                   </div>
                                );
                             })
                          ) : (
                             <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                لا توجد معاملات معلقة لدى مشرف القيادة لمتابعة تسكينها حالياً.
                             </div>
                          )}
                       </div>
                    )}

                    {/* 3. GENERAL VIEW & ARCHIVE */}
                    {resolvedSubTab === 'general' && (
                       <div className="divide-y divide-slate-100 dark:divide-teal-800/10">
                          {generalPlacements.length > 0 ? (
                             generalPlacements.map(s => (
                               <div key={s.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                                  <div>
                                     <div className="font-black text-sm text-slate-900 dark:text-white">
                                        {s.beneficiaryName} <span className="text-xs font-bold text-slate-400">({s.stage} - {s.grade || '---'})</span>
                                     </div>
                                     <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4">
                                        <span>المدرسة المحددة للتوطين: <strong className="text-teal-600">{s.schoolName || s.firstSchoolName || '---'}</strong></span>
                                        {s.leadershipFollowUpConfirmed && (
                                           <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓ تمت متابعة القيادة</span>
                                        )}
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <span className={`px-3 py-1 rounded-full text-xs font-black border ${s.staffingConfirmedAt ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800'}`}>
                                        {s.staffingConfirmedAt ? 'تم التسكين النهائي ✓' : 'بانتظار إفادة المدرسة بالانتظام'}
                                     </span>
                                     <button 
                                       onClick={() => setSelectedSurvey(s)}
                                       className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black cursor-pointer transition-all"
                                     >
                                        معاينة الملف
                                     </button>
                                  </div>
                               </div>
                             ))
                          ) : (
                             <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                لا توجد معاملات جارية في مرحلة التسكين والانتظام النهائي حالياً.
                             </div>
                          )}
                       </div>
                    )}

                 </div>
              </div>
            </div>
          );
        })()}

        {/* VIEW 6: STAFF DIRECTORY (منسوبي الإدارة والكوادر والصلاحيات) */}
        {activeFeature === 'staff' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs ${isDark ? 'bg-[#081e2b]' : 'bg-white'}`}>
               {/* Header Section */}
               <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-teal-800/20">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 shadow-inner">
                        <Users className="w-6 h-6" />
                     </div>
                     <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-lg font-black text-slate-900 dark:text-white">منسوبي الإدارة والكوادر والصلاحيات</h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                            {officers.length} كادر مسجل
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">سجل المشرفين والموظفين، استيراد وتحديث الأسماء إكسل، حذف وتحديد الكوادر دفعة واحدة.</p>
                     </div>
                  </div>

                  {/* Excel Import & Update & Add User Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                     {/* Hidden File Inputs */}
                     <input 
                        ref={fileInputImportRef}
                        type="file" 
                        className="hidden" 
                        accept=".xlsx, .xls, .csv" 
                        onChange={(e) => {
                           if (e.target.files && e.target.files[0]) {
                              handleImportUsers(e.target.files[0], false);
                              e.target.value = '';
                           }
                        }} 
                     />
                     <input 
                        ref={fileInputUpdateRef}
                        type="file" 
                        className="hidden" 
                        accept=".xlsx, .xls, .csv" 
                        onChange={(e) => {
                           if (e.target.files && e.target.files[0]) {
                              handleImportUsers(e.target.files[0], true);
                              e.target.value = '';
                           }
                        }} 
                     />

                     {/* استيراد إكسل (إضافة دون حذف القديم) */}
                     <button
                        type="button"
                        onClick={() => fileInputImportRef.current?.click()}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95" 
                        title="إضافة أسماء جديدة من ملف إكسل دون حذف الأسماء القديمة"
                     >
                        <FileText className="w-4 h-4" />
                        <span>استيراد إكسل</span>
                     </button>

                     {/* تحديث إكسل (تحديث الأسماء دون حذف القديم) */}
                     <button
                        type="button"
                        onClick={() => fileInputUpdateRef.current?.click()}
                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95" 
                        title="تحديث بيانات الموظفين المسجلين دون حذف أي اسم سابق"
                     >
                        <RefreshCw className="w-4 h-4" />
                        <span>تحديث إكسل</span>
                     </button>

                     {/* إضافة مستخدم يدوي */}
                     <button
                        type="button"
                        onClick={() => setShowAddUserModal(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                     >
                        <Plus className="w-4 h-4" />
                        <span>إضافة مستخدم</span>
                     </button>
                  </div>
               </div>

               {/* Batch Multi-Select Actions Bar */}
               <div className="p-3.5 mb-5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200 dark:border-teal-800/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                     <label className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-100 cursor-pointer select-none">
                        <input
                           type="checkbox"
                           className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer"
                           checked={officers.length > 0 && selectedOfficerIds.length === officers.length}
                           onChange={(e) => {
                              if (e.target.checked) {
                                 setSelectedOfficerIds(officers.map(o => o.id));
                              } else {
                                 setSelectedOfficerIds([]);
                              }
                           }}
                        />
                        <span>تحديد الكل ({selectedOfficerIds.length} من {officers.length})</span>
                     </label>

                     {selectedOfficerIds.length > 0 && (
                        <span className="text-[11px] font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-xl">
                           تم تحديد {selectedOfficerIds.length} مستخدم
                        </span>
                     )}
                  </div>

                  {selectedOfficerIds.length > 0 && (
                     <button
                        type="button"
                        onClick={() => {
                           const toDelete = officers.filter(o => selectedOfficerIds.includes(o.id));
                           setOfficersToDeleteModal(toDelete);
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                     >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف المحددين دفعة واحدة ({selectedOfficerIds.length})</span>
                     </button>
                  )}
               </div>

               {/* Quick Info Bar */}
               <div className="p-3.5 mb-6 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
                     <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                     <span>اضغط على اسم أي موظف للدخول إلى صفحته، أو حدد الموظفين لحذفهم دفعة واحدة من سلة المهملات.</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                     🛡️ عمليات الحذف تتم بتأكيد فوري وآمن
                  </div>
               </div>

               {/* Users Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {officers.map(officer => {
                     const isCurrUserAdmin = officer.role === 'admin' || isSystemAdmin(officer);
                     const isSelected = selectedOfficerIds.includes(officer.id);

                     return (
                        <div 
                           key={officer.id} 
                           className={`p-5 rounded-2xl border transition-all ${
                              isSelected 
                                 ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-md' 
                                 : 'border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-400'
                           } space-y-4`}
                        >
                           {/* User Top Row: Checkbox + Avatar + Name (Clickable) + Role Badge */}
                           <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                 {/* Selection Checkbox */}
                                 <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer shrink-0"
                                    checked={isSelected}
                                    onChange={(e) => {
                                       e.stopPropagation();
                                       setSelectedOfficerIds(prev => 
                                          prev.includes(officer.id) 
                                             ? prev.filter(id => id !== officer.id)
                                             : [...prev, officer.id]
                                       );
                                    }}
                                    title="تحديد هذا المستخدم للحذف"
                                 />

                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                                    isCurrUserAdmin 
                                       ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' 
                                       : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                 }`}>
                                    {officer.nameAr ? officer.nameAr.charAt(0) : 'م'}
                                 </div>

                                 <div className="min-w-0">
                                    <button
                                       type="button"
                                       onClick={() => setEditingOfficer(officer)}
                                       className="font-black text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-right cursor-pointer truncate block w-full"
                                       title="اضغط للدخول على صفحة الموظف وتعديلها"
                                    >
                                       {officer.nameAr}
                                    </button>
                                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                       <span>نشط بالنظام</span>
                                    </div>
                                 </div>
                              </div>

                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 ${
                                 isCurrUserAdmin
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60'
                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60'
                              }`}>
                                 {getOfficerRoleTitle(officer.role)}
                              </span>
                           </div>

                           {/* Civil ID & Contact Info */}
                           <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200/60 dark:border-teal-800/20">
                              <div className="flex items-center justify-between">
                                 <span className="text-slate-400 text-[11px]">السجل المدني:</span>
                                 <strong className="font-mono font-bold">{officer.nationalId || '---'}</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                 <span className="text-slate-400 text-[11px]">الجوال:</span>
                                 <strong className="font-mono font-bold">{officer.mobile || '---'}</strong>
                              </div>
                              {officer.personalEmail && (
                                 <div className="flex items-center justify-between truncate">
                                    <span className="text-slate-400 text-[11px]">البريد:</span>
                                    <span className="font-mono text-[11px] text-slate-500 truncate max-w-[180px]">{officer.personalEmail}</span>
                                 </div>
                              )}
                           </div>

                           {/* Approved Job Description if present */}
                           {officer.roleDescription && (
                              <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 font-bold leading-relaxed">
                                 <span className="font-black text-amber-700 dark:text-amber-400">الوصف الوظيفي المعتمد:</span> {officer.roleDescription}
                              </div>
                           )}

                           {/* Card Footer Actions */}
                           <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-teal-800/20">
                              <button
                                 type="button"
                                 onClick={() => setEditingOfficer(officer)}
                                 className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                 <User className="w-3.5 h-3.5" />
                                 <span>تعديل الصلاحيات</span>
                              </button>

                              {/* زر سلة المهملات - تأكيد فوري عبر نافذة النظام */}
                              <button
                                 type="button"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setOfficersToDeleteModal([officer]);
                                 }}
                                 className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 border border-rose-200/60 dark:border-rose-900/40"
                                 title="حذف هذا المستخدم"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
          </div>
        )}

        {/* VIEW 7: FEEDBACK MESSAGES (ملاحظات ورسائل المستفيدين) */}
        {activeFeature === 'feedback' && (
          <div className="space-y-6">
            <BeneficiaryFeedbackView 
              feedbacks={beneficiaryFeedbacks}
              onUpdateFeedbacks={onUpdateBeneficiaryFeedbacks}
              activeOfficer={activeOfficer}
              isDark={isDark}
              isRtl={isRtl}
            />
          </div>
        )}

        {/* VIEW 8: ANALYTICS & CHARTS (التحليلات والرسوم البيانية) */}
        {activeFeature === 'analytics' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs ${isDark ? 'bg-[#081e2b]' : 'bg-white'}`}>
               <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600">
                        <BarChart3 className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">التحليلات والرسوم البيانية المتقدمة</h2>
                        <p className="text-xs font-bold text-slate-400">مؤشرات الأداء وتوزيع الطلبات حسب القطاع، المرحلة، ونوع المشكلة.</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Distribution by Stage */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-teal-900/30">
                     <h3 className="font-black text-sm text-slate-800 dark:text-white mb-4">التوزيع حسب المراحل الدراسية</h3>
                     {['Primary', 'Intermediate', 'Secondary', 'Kindergarten'].map(stg => {
                       const count = surveys.filter(s => s.stage === stg).length;
                       const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                       const stageNames: Record<string, string> = { Primary: 'ابتدائي', Intermediate: 'متوسط', Secondary: 'ثانوي', Kindergarten: 'رياض أطفال' };

                       return (
                         <div key={stg} className="mb-3 space-y-1">
                            <div className="flex justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                               <span>{stageNames[stg] || stg}</span>
                               <span>{count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                         </div>
                       );
                     })}
                  </div>

                  {/* Distribution by Problem Type */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-teal-900/30">
                     <h3 className="font-black text-sm text-slate-800 dark:text-white mb-4">التوزيع حسب نوع المشكلة</h3>
                     {['new_registration_saudi', 'new_registration_resident', 'vacancies_unavailable', 'student_density'].map(prob => {
                       const count = surveys.filter(s => s.problemType === prob).length;
                       const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

                       return (
                         <div key={prob} className="mb-3 space-y-1">
                            <div className="flex justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                               <span>{getProblemTypeArabicLabel(prob as ProblemType)}</span>
                               <span>{count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* VIEW 9: ALERTS & EMAIL LOGS (سجل التنبيهات الفورية) */}
        {activeFeature === 'alerts' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs ${isDark ? 'bg-[#081e2b]' : 'bg-white'}`}>
               <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
                        <Mail className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">سجل التنبيهات الفورية وإشعارات النظام</h2>
                        <p className="text-xs font-bold text-slate-400">سجل الرسائل والإشعارات الإلكترونية المرسلة للمسؤولين والمدارس.</p>
                     </div>
                  </div>
               </div>

               <div className="divide-y divide-slate-100 dark:divide-teal-800/10 text-xs">
                  {emailLogs.length > 0 ? (
                    emailLogs.map(log => (
                      <div key={log.id} className="py-3.5 flex items-center justify-between">
                         <div>
                            <div className="font-black text-slate-800 dark:text-white">{log.subject}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">إلى: {log.recipientEmail} | الحالة: {log.status}</div>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(log.sentAt).toLocaleTimeString('ar-SA')}</span>
                            <button 
                              onClick={() => onDeleteEmailLog(log.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-slate-400">لا توجد سجلات تنبيهات مسجلة حالياً.</div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* VIEW 10: SCHOOLS DIRECTORY (دليل المدارس والأرقام الوزارية) */}
        {activeFeature === 'schools' && (
          <div className="space-y-6">
            {/* Hidden Excel File Input for Schools */}
            <input 
              type="file" 
              ref={schoolFileInputRef} 
              onChange={handleSchoolExcelUpload} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />

            <div className={`p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs ${isDark ? 'bg-[#081e2b]' : 'bg-white'}`}>
               <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600">
                        <School className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">
                          دليل المدارس والأرقام الوزارية ({schools.length.toLocaleString('ar-SA')} مدرسة)
                        </h2>
                        <p className="text-xs font-bold text-slate-400">البحث في دليل مدارس منطقة المدينة المنورة، الرموز الوزارية، والطاقة الاستيعابية.</p>
                     </div>
                  </div>
                  
                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-2.5">
                     {/* Export Schools */}
                     <button 
                       type="button"
                       onClick={handleExportSchoolsExcel}
                       className={`px-3.5 py-2 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                         isDark ? 'bg-slate-900 border-teal-800/40 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                       }`}
                       title="تصدير دليل المدارس الحالي إلى ملف إكسل"
                     >
                        <Download className="w-3.5 h-3.5 text-teal-600" />
                        <span>تصدير Excel</span>
                     </button>

                     {/* Upload Schools Excel */}
                     <button 
                       type="button"
                       onClick={() => schoolFileInputRef.current?.click()}
                       className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                       title="رفع واستيراد ملف إكسل لدليل المدارس والأرقام الوزارية"
                     >
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع ملف الإكسل</span>
                     </button>

                     {/* Add School Manually */}
                     <button 
                       type="button"
                       onClick={() => setShowAddSchoolModal(true)}
                       className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                       title="إضافة مدرسة يدوياً للدليل"
                     >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة مدرسة جديدة</span>
                     </button>

                     {/* Clear Current Schools Data */}
                     <button 
                       type="button"
                       onClick={() => setShowClearSchoolsConfirmModal(true)}
                       className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                       title="حذف وتفريغ جميع بيانات المدارس الحالية"
                     >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>حذف البيانات الحالية</span>
                     </button>
                  </div>
               </div>

               <div className="mb-4">
                  <input 
                    type="text" 
                    value={schoolSearchQuery}
                    onChange={(e) => setSchoolSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المدرسة، الرقم الوزاري، أو القطاع..."
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-teal-800/40 rounded-2xl text-xs font-bold outline-hidden"
                  />
               </div>

               <div className="max-h-[500px] overflow-y-auto border border-slate-100 dark:border-teal-800/20 rounded-2xl">
                  <table className="w-full text-right text-xs">
                     <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 font-black text-slate-500">
                        <tr>
                           <th className="p-3">اسم المدرسة</th>
                           <th className="p-3">الرقم الوزاري</th>
                           <th className="p-3">المرحلة</th>
                           <th className="p-3">القطاع</th>
                           <th className="p-3">النوع</th>
                           <th className="p-3 text-center">إجراءات</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-teal-800/10">
                        {schools.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <School className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                                <div className="font-bold text-sm text-slate-700 dark:text-slate-200">لا توجد مدارس مسجلة حالياً في الدليل</div>
                                <p className="text-xs text-slate-400 max-w-sm">تم تفريغ الدليل. يمكنك رفع ملف إكسل يحتوي على بيانات المدارس أو إضافة مدرسة جديدة.</p>
                                <button
                                  type="button"
                                  onClick={() => schoolFileInputRef.current?.click()}
                                  className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
                                >
                                  <Upload className="w-4 h-4" />
                                  <span>رفع ملف الإكسل الآن</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          schools
                            .filter(s => 
                              (s.name || s.nameAr || '').includes(schoolSearchQuery) || 
                              (s.code || s.ministryCode || '').includes(schoolSearchQuery) || 
                              (s.sector || s.district || '').includes(schoolSearchQuery)
                            )
                            .slice(0, 100)
                            .map(school => (
                              <tr key={school.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                 <td className="p-3 font-bold text-slate-800 dark:text-white">{school.name || school.nameAr}</td>
                                 <td className="p-3 font-mono text-teal-600">{school.code || school.ministryCode}</td>
                                 <td className="p-3">{school.stage}</td>
                                 <td className="p-3">{school.sector || school.district || '—'}</td>
                                 <td className="p-3">{school.gender === 'boys' ? 'بنين' : 'بنات'}</td>
                                 <td className="p-3 text-center">
                                    <button 
                                      onClick={() => onDeleteSchool(school.id)}
                                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                                      title="حذف المدرسة"
                                    >
                                       <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                 </td>
                              </tr>
                            ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}
        {/* VIEW 11: SATISFACTION (قياس رضا المستفيدين) */}
        {activeFeature === 'satisfaction' && (
          <div className="space-y-6">
            <BeneficiarySatisfactionView 
              surveys={surveys}
              onUpdateSurvey={onUpdateSurvey}
              activeOfficer={activeOfficer}
              isDark={isDark}
              isRtl={isRtl}
            />
          </div>
        )}

        {/* VIEW 12: REPORTS GENERATOR (التقارير - جديد ومطور) */}
        {activeFeature === 'reports' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs ${isDark ? 'bg-[#081e2b]' : 'bg-white'}`}>
               <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
                        <FileText className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">منظومة التقارير الرسمية المتقدمة</h2>
                        <p className="text-xs font-bold text-slate-400">توليد وطباعة التقارير المعتمدة بختم وترويسة وزارة التعليم.</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-teal-900/30 space-y-3">
                     <div className="font-black text-sm text-slate-800 dark:text-white">التقرير الإحصائي العام الشامل</div>
                     <p className="text-xs text-slate-500 leading-relaxed">تقرير متكامل لجميع المعاملات، نسب الإنجاز، ومؤشرات الرضا لرفعه للقيادات.</p>
                     <button 
                       onClick={handleOpenGeneralReport}
                       className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                     >
                        <Printer className="w-4 h-4" />
                        معاينة وطباعة التقرير (PDF/Word)
                     </button>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-teal-900/30 space-y-3">
                     <div className="font-black text-sm text-slate-800 dark:text-white">تصدير قاعدة البيانات المفلترة (Excel)</div>
                     <p className="text-xs text-slate-500 leading-relaxed">تصدير جدول المعاملات الحالي مع كافة الحقول الإحصائية بصيغة XLSX.</p>
                     <button 
                       onClick={handleExportToExcel}
                       className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                     >
                        <Download className="w-4 h-4" />
                        تحميل جدول الإكسل المعتمد
                     </button>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-teal-900/30 space-y-3">
                     <div className="font-black text-sm text-slate-800 dark:text-white">النسخ الاحتياطي بالتاريخ والنوع</div>
                     <p className="text-xs text-slate-500 leading-relaxed">تصفية وحفظ نسخة احتياطية مخصصة حسب السنة، الشهر، والمرحلة الدراسية.</p>
                     <button 
                       onClick={handleOpenBackupModal}
                       className="w-full py-2.5 bg-[#112d3e] text-emerald-400 hover:bg-[#16384d] rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                     >
                        <Database className="w-4 h-4" />
                        تخصيص النسخة الاحتياطية
                     </button>
                  </div>
               </div>

               {/* المؤشرات الإحصائية العامة للتقرير الإحصائي العام الشامل - مقسم إلى أجزاء المحافظات */}
               <div className="mt-8 pt-6 border-t border-slate-100 dark:border-teal-900/30 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                     <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-[#006C70] dark:text-teal-300">
                           <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
                              التقرير الإحصائي العام الشامل (مقسم حسب المحافظات والقطاعات)
                           </h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                              يشمل جميع الأيقونات الـ 13 المعتمدة مقسمة لكل محافظة: المدينة المنورة، الحناكية، خيبر، بدر، وادي الفرع، المهد، ينبع، العلا
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={handleOpenGeneralReport}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                     >
                        <Printer className="w-4 h-4" />
                        معاينة وتصدير التقرير الشامل (PDF/Word/Excel)
                     </button>
                  </div>

                  {/* أزرار التبديل والفلترة بين أجزاء المحافظات */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-900/80 p-2 rounded-2xl border border-slate-200/80 dark:border-teal-900/40">
                     <button
                        type="button"
                        onClick={() => setSelectedReportsGovPart('all')}
                        className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                           selectedReportsGovPart === 'all'
                              ? 'bg-[#006C70] text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                     >
                        عرض جميع المحافظات (8)
                     </button>
                     {governorateStatsList.map(g => (
                        <button
                           key={g.id}
                           type="button"
                           onClick={() => setSelectedReportsGovPart(g.id)}
                           className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                              selectedReportsGovPart === g.id
                                 ? 'bg-[#006C70] text-white shadow-xs'
                                 : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                           }`}
                        >
                           {g.name}
                        </button>
                     ))}
                  </div>

                  {/* مؤشرات الإجمالي العام (تظهر عند اختيار الكل) */}
                  {selectedReportsGovPart === 'all' && (
                     <div className="bg-gradient-to-r from-teal-900/5 via-slate-50 to-teal-900/5 dark:from-teal-950/20 dark:via-slate-900 dark:to-teal-950/20 p-4 sm:p-5 rounded-2xl border border-teal-800/20 dark:border-teal-900/40 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-teal-800/10 dark:border-teal-900/30">
                           <div className="text-xs font-black text-[#006C70] dark:text-teal-300 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#006C70] dark:bg-teal-400"></span>
                              <span>المؤشرات الإجمالية العامة للمنطقة ككل (13 أيقونة معتمدة)</span>
                           </div>
                           <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              مجموع كافة المحافظات والمكاتب التابعة للإدارة
                           </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                           {/* 1. إجمالي المعاملات المسجلة */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 group-hover:scale-110 transition-transform">
                                    <Layers className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">إجمالي المعاملات</span>
                              </div>
                              <div className="text-base font-black text-slate-900 dark:text-white">{surveys.length}</div>
                           </div>
                           {/* 2. المعاملات المنجزة والمغلقة */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 group-hover:scale-110 transition-transform">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">المعاملات المنجزة</span>
                              </div>
                              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">{surveys.filter(s => s.isResolved).length}</div>
                           </div>
                           {/* 3. المعاملات الجارية وقيد المعالجة */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 group-hover:scale-110 transition-transform">
                                    <Clock className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">المعاملات الجارية</span>
                              </div>
                              <div className="text-base font-black text-amber-600 dark:text-amber-400">{surveys.filter(s => !s.isResolved).length}</div>
                           </div>
                           {/* 4. نسبة إنجاز المعاملات */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/50 text-[#006C70] dark:text-teal-400 group-hover:scale-110 transition-transform">
                                    <Percent className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">نسبة الإنجاز</span>
                              </div>
                              <div className="text-base font-black text-[#006C70] dark:text-teal-400">{stats.resRate}%</div>
                           </div>
                           {/* 5. معدل رضا المستفيدين */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-500 group-hover:scale-110 transition-transform">
                                    <Star className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">معدل الرضا</span>
                              </div>
                              <div className="text-base font-black text-amber-500">{stats.avgSat} / 5</div>
                           </div>
                           {/* 6. بلاغات المدارس الميدانية */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 group-hover:scale-110 transition-transform">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">بلاغات المدارس</span>
                              </div>
                              <div className="text-base font-black text-rose-600 dark:text-rose-400">{principalReports.length}</div>
                           </div>
                           {/* 7. معاملات المرحلة الثانوية */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 group-hover:scale-110 transition-transform">
                                    <GraduationCap className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">المرحلة الثانوية</span>
                              </div>
                              <div className="text-base font-black text-purple-600 dark:text-purple-400">{stageStats.secAdmission}</div>
                           </div>
                           {/* 8. معاملات المرحلة المتوسطة */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-600 group-hover:scale-110 transition-transform">
                                    <School className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">المرحلة المتوسطة</span>
                              </div>
                              <div className="text-base font-black text-sky-600 dark:text-sky-400">{stageStats.interAdmission}</div>
                           </div>
                           {/* 9. معاملات المرحلة الابتدائية */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">المرحلة الابتدائية</span>
                              </div>
                              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">{stageStats.primAdmission}</div>
                           </div>
                           {/* 10. معاملات مرحلة الطفولة المبكرة */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-pink-50 dark:bg-pink-950/50 text-pink-500 group-hover:scale-110 transition-transform">
                                    <Baby className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">الطفولة المبكرة</span>
                              </div>
                              <div className="text-base font-black text-pink-500">{stageStats.earlyChildhoodAdmission}</div>
                           </div>
                           {/* 11. معاملات معادلات المرحلة الثانوية */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 group-hover:scale-110 transition-transform">
                                    <Award className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">معادلات الثانوية</span>
                              </div>
                              <div className="text-base font-black text-indigo-600 dark:text-indigo-400">{stageStats.secEq}</div>
                           </div>
                           {/* 12. معاملات معادلات المرحلة المتوسطة */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 group-hover:scale-110 transition-transform">
                                    <FileText className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">معادلات المتوسطة</span>
                              </div>
                              <div className="text-base font-black text-cyan-600 dark:text-cyan-400">{stageStats.interEq}</div>
                           </div>
                           {/* 13. معاملات معادلات المرحلة الابتدائية */}
                           <div onClick={handleOpenGeneralReport} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between hover:border-teal-500/50 transition-all cursor-pointer group shadow-2xs">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-600 group-hover:scale-110 transition-transform">
                                    <FileBadge className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">معادلات الابتدائية</span>
                              </div>
                              <div className="text-base font-black text-teal-600 dark:text-teal-400">{stageStats.primEq}</div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* قائمة أجزاء المحافظات (تشمل جميع الأيقونات الـ 13 لكل جزء) */}
                  <div className="space-y-4">
                     {governorateStatsList
                        .filter(g => selectedReportsGovPart === 'all' || g.id === selectedReportsGovPart)
                        .map(g => (
                           <GovernoratePartCard 
                              key={g.id} 
                              data={g} 
                              onOpenReport={handleOpenGeneralReport}
                              isDark={isDark}
                           />
                        ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* VIEW 13: PRINCIPALS DATABASE & EXCEL LINKING (بيانات مديري المدارس والربط بالسجل المدني) */}
        {activeFeature === 'principal_data' && (
          <PrincipalsDatabaseView
            schools={schools}
            onUpdateSchools={onImportSchools}
            onDeleteSchool={onDeleteSchool}
            activeOfficer={activeOfficer}
            isDark={isDark}
            isRtl={isRtl}
          />
        )}
      </main>

      
        {/* MODAL 1: REQUEST DOSSIER DETAILS MODAL */}
      {selectedSurvey && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white dark:bg-[#081e2b] rounded-[32px] max-w-2xl w-full p-6 space-y-6 border border-slate-100 dark:border-teal-800/40 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-4 dark:border-teal-800/20">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 font-black">
                       #{selectedSurvey.id.slice(-4)}
                    </div>
                    <div>
                       <h3 className="font-black text-base text-slate-900 dark:text-white">{selectedSurvey.beneficiaryName || selectedSurvey.parentName}</h3>
                       <p className="text-xs text-slate-400 font-mono">{selectedSurvey.phoneNumber} | السجل: {selectedSurvey.nationalId || '---'}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedSurvey(null)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                 <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <span className="text-slate-400">المرحلة والصف:</span>
                    <div className="font-bold text-slate-800 dark:text-white mt-0.5">{selectedSurvey.stage} {selectedSurvey.grade ? `- ${selectedSurvey.grade}` : ''}</div>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <span className="text-slate-400">المدرسة المستهدفة:</span>
                    <div className="font-bold text-slate-800 dark:text-white mt-0.5">{selectedSurvey.schoolName || selectedSurvey.firstSchoolName || '---'}</div>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <span className="text-slate-400">نوع الطلب:</span>
                    <div className="font-bold text-teal-600 mt-0.5">{getProblemTypeArabicLabel(selectedSurvey.problemType)}</div>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <span className="text-slate-400">الموظف المختص:</span>
                    <div className="font-bold text-slate-800 dark:text-white mt-0.5">{selectedSurvey.serviceEmployee || 'غير مسند'}</div>
                 </div>
              </div>

              {selectedSurvey.notes && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1">
                   <span className="text-slate-400 font-bold">تفاصيل وملاحظات الطلب:</span>
                   <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedSurvey.notes}</p>
                </div>
              )}

              {/* Hijri Dispatch Timeline Component */}
              <RequestDispatchTimeline survey={selectedSurvey} />

              <div className="flex items-center justify-between pt-4 border-t dark:border-teal-800/20">
                 <button 
                    onClick={() => {
                      if (!selectedSurvey.isResolved) {
                        const isStaffed = Boolean(selectedSurvey.staffingConfirmedAt || selectedSurvey.principalConfirmedStaffing);
                        if (!isStaffed) {
                          setClaimToastMessage("⚠️ تنبيه نظامي: لا يمكن أرشفة المعاملة وإغلاقها إلا بعد تسكين الطالب من قبل مدير المدرسة.");
                          setTimeout(() => setClaimToastMessage(null), 5000);
                          return;
                        }
                      }
                      onToggleResolved(selectedSurvey.id);
                      setSelectedSurvey(prev => prev ? { ...prev, isResolved: !prev.isResolved } : null);
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all ${selectedSurvey.isResolved ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                  >
                     {selectedSurvey.isResolved ? 'إعادة الطلب لقيد المعالجة' : 'اعتماد حل الطلب وإغلاقه ✓'}
                  </button>
                 <button 
                   onClick={() => setSelectedSurvey(null)}
                   className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black cursor-pointer"
                 >
                    إغلاق
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL 2: ADD SCHOOL MODAL */}
      {showAddSchoolModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
           <form onSubmit={handleAddSchool} className="bg-white dark:bg-[#081e2b] rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-100 dark:border-teal-800/40 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3 dark:border-teal-800/20">
                 <h3 className="font-black text-base text-slate-900 dark:text-white">إضافة مدرسة جديدة للدليل</h3>
                 <button type="button" onClick={() => setShowAddSchoolModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">اسم المدرسة:</label>
                 <input 
                   type="text" 
                   required
                   value={newSchool.name}
                   onChange={e => setNewSchool({ ...newSchool, name: e.target.value })}
                   className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-bold outline-hidden"
                   placeholder="مدرسة الإمام الشافعي الابتدائية"
                 />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">الرقم الوزاري:</label>
                    <input 
                      type="text" 
                      required
                      value={newSchool.code}
                      onChange={e => setNewSchool({ ...newSchool, code: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-bold outline-hidden"
                      placeholder="12345"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">المرحلة:</label>
                    <select 
                      value={newSchool.stage}
                      onChange={e => setNewSchool({ ...newSchool, stage: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-bold outline-hidden"
                    >
                       <option value="Primary">ابتدائي</option>
                       <option value="Intermediate">متوسط</option>
                       <option value="Secondary">ثانوي</option>
                       <option value="Kindergarten">رياض أطفال</option>
                    </select>
                 </div>
              </div>

              <div className="flex gap-3 pt-2">
                 <button type="submit" className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black cursor-pointer">
                    حفظ المدرسة
                 </button>
                 <button type="button" onClick={() => setShowAddSchoolModal(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black cursor-pointer">
                    إلغاء
                 </button>
              </div>
           </form>
        </div>
      )}

            {/* MODAL: CLEAR ALL SCHOOLS CONFIRMATION */}
      {showClearSchoolsConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`rounded-3xl max-w-md w-full p-6 space-y-5 border shadow-2xl ${
            isDark ? 'bg-[#081e2b] border-teal-800/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 border-b pb-4 border-rose-100 dark:border-rose-900/30">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  تأكيد حذف بيانات المدارس الحالية
                </h3>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  تفريغ دليل المدارس والأرقام الوزارية
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-bold">
              هل أنت متأكد من رغبتك في حذف جميع بيانات المدارس الحالية؟ سيتم تفريغ دليل المدارس بالكامل ({schools.length} مدرسة).
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>ملاحظة: يمكنك إعادة رفع دليل المدارس في أي وقت عبر خيار "رفع ملف الإكسل".</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearSchoolsConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmClearSchools}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف البيانات الحالية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW & IMPORT SCHOOLS EXCEL */}
      {showSchoolImportModal && schoolParsedData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`rounded-3xl max-w-2xl w-full p-6 space-y-5 border shadow-2xl max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#081e2b] border-teal-800/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 dark:border-teal-800/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    معاينة واستيراد ملف إكسل دليل المدارس
                  </h3>
                  <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">
                    الملف: <span className="text-teal-600">{schoolParsedData.fileName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSchoolImportModal(false);
                  setSchoolParsedData(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-teal-800/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs font-bold text-slate-400">إجمالي المدارس المقروءة</div>
                <div className="text-xl font-black text-teal-600 font-mono mt-1">{schoolParsedData.totalRows} مدرسة</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-teal-800/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs font-bold text-slate-400">الأعمدة المكتشفة في الملف</div>
                <div className="text-xs font-black text-slate-700 dark:text-slate-200 mt-2 truncate">
                  {schoolParsedData.rawHeaders.slice(0, 5).join(' • ')}
                </div>
              </div>
            </div>

            {/* Import Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">اختر طريقة حفظ وتحديث الدليل في النظام:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                  schoolImportMode === 'merge' ? 'bg-teal-500/10 border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-teal-800/30'
                }`}>
                  <input
                    type="radio"
                    name="schoolImportMode"
                    checked={schoolImportMode === 'merge'}
                    onChange={() => setSchoolImportMode('merge')}
                    className="mt-1 accent-teal-600"
                  />
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">دمج وتحديث المدارس الحالية (موصى به)</div>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">تحديث بيانات المدارس القائمة وإضافة المدارس الجديدة دون مسح السجلات السابقة.</p>
                  </div>
                </label>

                <label className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                  schoolImportMode === 'replace' ? 'bg-teal-500/10 border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-teal-800/30'
                }`}>
                  <input
                    type="radio"
                    name="schoolImportMode"
                    checked={schoolImportMode === 'replace'}
                    onChange={() => setSchoolImportMode('replace')}
                    className="mt-1 accent-teal-600"
                  />
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">استبدال كامل الدليل بالملف الجديد</div>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">مسح دليل المدارس الحالي واعتماد المدارس والأرقام الوزارية الموجودة في هذا الملف فقط.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Table Preview */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-700 dark:text-slate-300">معاينة أولية من المدارس المقروءة:</div>
              <div className="border border-slate-200 dark:border-teal-800/30 rounded-xl overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className={`sticky top-0 ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'} font-black text-[11px]`}>
                    <tr>
                      <th className="p-2.5">اسم المدرسة</th>
                      <th className="p-2.5">الرقم الوزاري</th>
                      <th className="p-2.5">المرحلة</th>
                      <th className="p-2.5">القطاع</th>
                      <th className="p-2.5">النوع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-teal-800/10">
                    {schoolParsedData.rows.slice(0, 8).map((sch, i) => (
                      <tr key={sch.id || i} className="hover:bg-teal-50/20">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{sch.name || sch.nameAr}</td>
                        <td className="p-2.5 font-mono text-teal-600">{sch.code || sch.ministryCode}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{sch.stage}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{sch.sector || sch.district || '—'}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{sch.gender === 'boys' ? 'بنين' : 'بنات'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-teal-800/20">
              <button
                type="button"
                onClick={() => {
                  setShowSchoolImportModal(false);
                  setSchoolParsedData(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCommitSchoolImport}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-teal-900/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد وحفظ دليل المدارس ({schoolParsedData.totalRows} مدرسة)</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 3: OFFICIAL REPORT MODAL */}
      {showOfficialModal && officialReportData && (
        <OfficialReportModal 
          isOpen={showOfficialModal}
          onClose={() => setShowOfficialModal(false)}
          reportData={officialReportData}
          isDark={isDark}
          isRtl={isRtl}
        />
      )}

      {/* MODAL 4: DATE BACKUP MODAL */}
      {showDateBackupModal && (
        <DateBackupModal 
          isOpen={showDateBackupModal}
          onClose={() => setShowDateBackupModal(false)}
          surveys={surveys}
          officers={DEMO_OFFICERS}
          activeOfficer={activeOfficer}
          isDark={isDark}
          isRtl={isRtl}
        />
      )}

      {/* MODAL 5: CONFIRM DELETE ALL SURVEYS (MODAL COMPATIBLE WITH IFRAME) */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#081e2b] rounded-[32px] max-w-lg w-full p-6 space-y-5 border-2 border-rose-500/30 shadow-2xl relative text-right">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4 dark:border-teal-800/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 shadow-inner">
                  <Trash2 className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-black text-base text-rose-600 dark:text-rose-400">تأكيد حذف وإفراغ جميع الطلبات (Admin)</h3>
                  <p className="text-xs text-slate-400">إجراء إداري شامل لمسح قاعدة بيانات المعاملات</p>
                </div>
              </div>
              <button 
                onClick={() => setShowClearAllModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Message */}
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-black text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>تحذير هام جداً: هذا الإجراء نهائي ولا يمكن التراجع عنه!</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                سيتم حذف كافة الطلبات والمعاملات المسجلة بقاعدة البيانات وتصفير الإحصائيات بالكامل.
              </p>
            </div>

            {/* Summary of Data to be deleted */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-teal-900/30">
                <div className="text-lg font-black text-rose-600">{surveys.length}</div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">طلب ومعاملة</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-teal-900/30">
                <div className="text-lg font-black text-amber-600">{principalReports.length}</div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">بلاغ مدرسة</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-teal-900/30">
                <div className="text-lg font-black text-indigo-600">{emailLogs.length}</div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">إشعار فوري</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => {
                  onClearAllSurveys();
                  setShowClearAllModal(false);
                  setClearSuccessToast(true);
                  setTimeout(() => setClearSuccessToast(false), 4000);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                نعم، تأكيد الحذف النهائي الشامل
              </button>
              <button 
                onClick={() => setShowClearAllModal(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black cursor-pointer transition-all"
              >
                إلغاء وتراجع
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {clearSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-black animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span>تم حذف وإفراغ جميع الطلبات والمعاملات بنجاح ✓</span>
        </div>
      )}

      {/* MODAL 6: EQUIVALENCY APPOINTMENT SCHEDULING MODAL */}
      {showAppointmentModal && selectedEqSurvey && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#081e2b] rounded-[32px] max-w-lg w-full p-6 space-y-5 border border-slate-100 dark:border-indigo-800/40 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b pb-4 dark:border-indigo-800/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">تحديد موعد مراجعة حضورية لمعادلة المؤهل</h3>
                  <p className="text-xs text-slate-400 font-mono">الطلب: #{selectedEqSurvey.id.slice(-6)} | المستفيد: {selectedEqSurvey.beneficiaryName || selectedEqSurvey.parentName}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAppointmentModal(false);
                  setSelectedEqSurvey(null);
                }} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1">
              <div className="font-black text-indigo-700 dark:text-indigo-300">بيانات الشهادة والمرحلة:</div>
              <p className="text-slate-600 dark:text-slate-300">
                المرحلة: <span className="font-bold">{selectedEqSurvey.stage === 'Primary' ? 'ابتدائي' : selectedEqSurvey.stage === 'Intermediate' ? 'متوسط' : selectedEqSurvey.stage === 'Secondary' ? 'ثانوي' : selectedEqSurvey.stage}</span> | 
                الجهة: <span className="font-bold">{selectedEqSurvey.schoolName || 'خارج المملكة'}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1.5">تاريخ المراجعة المقترح:</label>
                <input 
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1.5">وقت المراجعة والنافذة الزمنية:</label>
                <input 
                  type="text"
                  value={appointmentData.time}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="مثال: 09:30 صباحاً - 10:30 صباحاً"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1.5">مقر الاستقبال والملاحظات للمستفيد:</label>
                <input 
                  type="text"
                  value={appointmentData.location}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="صالة استقبال المستفيدين - وحدة القبول والتسجيل - الدور الأرضي"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={handleSaveAppointment}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <CalendarCheck className="w-4 h-4" />
                حفظ وإرسال الموعد للمستفيد ✓
              </button>
              <button 
                onClick={() => {
                  setShowAppointmentModal(false);
                  setSelectedEqSurvey(null);
                }} 
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black cursor-pointer transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: ASSIGN TO OFFICER MODAL */}
      {showAssignModal && assignTargetSurvey && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#081e2b] rounded-[32px] max-w-lg w-full p-6 space-y-5 border border-slate-100 dark:border-purple-800/40 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b pb-4 dark:border-purple-800/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">إسناد وإحالة المعاملة لمشرف مختص</h3>
                  <p className="text-xs text-slate-400 font-mono">الطلب: #{assignTargetSurvey.id.slice(-6)} | المستفيد: {assignTargetSurvey.beneficiaryName || assignTargetSurvey.parentName}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignTargetSurvey(null);
                }} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1.5">اختر المشرف المسؤول:</label>
                <select
                  value={selectedOfficerForAssign}
                  onChange={(e) => setSelectedOfficerForAssign(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-purple-900/50 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-hidden focus:border-purple-500 cursor-pointer"
                >
                  {DEMO_OFFICERS.map(o => (
                    <option key={o.id} value={o.nameAr}>
                      {o.nameAr} - ({o.roleDescription || o.workField || o.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1.5">ملاحظات وتوجيهات الإحالة:</label>
                <textarea
                  rows={3}
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="اكتب التوجيهات أو الملاحظات الخاصة بدراسة ومتابعة هذه المعاملة..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-purple-900/50 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-hidden focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={handleAssignToOfficer}
                className="flex-1 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                تأكيد الإسناد والإحالة ✓
              </button>
              <button 
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignTargetSurvey(null);
                }} 
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black cursor-pointer transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: CUSTOM DELETE SURVEY CONFIRMATION MODAL */}
      {deleteSurveyId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#081e2b] rounded-[32px] max-w-md w-full p-6 space-y-5 border border-rose-100 dark:border-rose-900/40 shadow-2xl text-right">
            <div className="flex items-center gap-3 border-b pb-4 dark:border-rose-900/20">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">تأكيد حذف المعاملة</h3>
                <p className="text-xs text-slate-400 font-bold">إجراء حساس ولا يمكن التراجع عنه</p>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
              هل أنت متأكد تماماً من رغبتك في حذف هذه المعاملة بشكل نهائي من النظام؟ سيتم مسح كافة البيانات والمرفقات المرتبطة بها فوراً.
            </p>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  onDeleteSurvey(deleteSurveyId);
                  setDeleteSurveyId(null);
                  setClaimToastMessage("تم حذف المعاملة بنجاح ✓");
                  setTimeout(() => setClaimToastMessage(null), 3000);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                نعم، تأكيد الحذف النهائي
              </button>
              <button 
                onClick={() => setDeleteSurveyId(null)} 
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black cursor-pointer transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: Registration Review & School Assignment Modal */}
      {reviewRegistrationSurvey && (
        <RegistrationReviewModal
          isOpen={Boolean(reviewRegistrationSurvey)}
          onClose={() => setReviewRegistrationSurvey(null)}
          survey={reviewRegistrationSurvey}
          schools={schools}
          onUpdateSurvey={(updated) => {
            onUpdateSurvey(updated);
            setReviewRegistrationSurvey(updated);
          }}
          activeOfficer={activeOfficer}
          onClaimSurvey={handleClaimAdmissionSurvey}
          onSendToPrincipal={handleSendToPrincipalForStudentFile}
          onSendToPlanning={handleSendToPlanning}
          onSendToLeadership={handleSendToLeadership}
          isDark={isDark}
        />
      )}


      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onAdd={handleAddUser}
          isDark={isDark}
        />
      )}

      {editingOfficer && (
        <UserDetailModal
          officer={editingOfficer}
          onClose={() => setEditingOfficer(null)}
          onSave={(updated) => {
            setOfficers(prev => {
              const updatedList = prev.map(o => o.id === updated.id ? updated : o);
              try { localStorage.setItem('officer_users_v4', JSON.stringify(updatedList)); } catch {}
              return updatedList;
            });
            // إذا كان الموظف المعدل هو نفس الحساب النشط حالياً، حدث بياناته فوراً
            if (activeOfficer.id === updated.id) {
              setActiveOfficer(updated);
            }
            setEditingOfficer(null);
            setClaimToastMessage(`تم حفظ وتحديث بيانات الموظف (${updated.nameAr}) والصلاحيات بنجاح ✅`);
            setTimeout(() => setClaimToastMessage(null), 3000);
          }}
          onDelete={(id) => {
            const officerToRemove = officers.find(o => o.id === id);
            setOfficers(prev => {
              const updatedList = prev.filter(o => o.id !== id);
              try { localStorage.setItem('officer_users_v4', JSON.stringify(updatedList)); } catch {}
              return updatedList;
            });
            setEditingOfficer(null);
            setClaimToastMessage(`تم حذف المستخدم (${officerToRemove?.nameAr || ''}) بنجاح`);
            setTimeout(() => setClaimToastMessage(null), 3000);
          }}
          isAdmin={activeOfficer.role === 'admin' || isSystemAdmin(activeOfficer)}
          isDark={isDark}
        />
      )}

      {/* MODAL: Confirmation for Single & Bulk Officer Deletion */}
      {officersToDeleteModal && officersToDeleteModal.length > 0 && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn" 
          onClick={() => setOfficersToDeleteModal(null)}
          dir="rtl"
        >
          <div 
            className="bg-white dark:bg-[#081e2b] text-slate-900 dark:text-white p-6 sm:p-7 rounded-[32px] max-w-md w-full border border-slate-100 dark:border-teal-800/40 shadow-2xl space-y-4" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">تأكيد حذف المستخدمين</h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  {officersToDeleteModal.length === 1 
                    ? `هل أنت متأكد من حذف الموظف (${officersToDeleteModal[0].nameAr}) نهائياً؟` 
                    : `هل أنت متأكد من حذف ${officersToDeleteModal.length} مستخدمين محددين دفعة واحدة؟`}
                </p>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-teal-800/30 text-xs font-bold">
              {officersToDeleteModal.map(o => (
                <div key={o.id} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="font-black text-slate-800 dark:text-slate-200">{o.nameAr}</span>
                  <span className="text-[10px] text-slate-400">{getOfficerRoleTitle(o.role)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const idsToDelete = officersToDeleteModal.map(o => o.id);
                  setOfficers(prev => {
                    const updated = prev.filter(o => !idsToDelete.includes(o.id));
                    try {
                      localStorage.setItem('officer_users_v4', JSON.stringify(updated));
                      localStorage.setItem('officer_users_v3', JSON.stringify(updated));
                    } catch {}
                    return updated;
                  });
                  setSelectedOfficerIds(prev => prev.filter(id => !idsToDelete.includes(id)));
                  setOfficersToDeleteModal(null);
                  setClaimToastMessage(`✅ تم حذف ${idsToDelete.length} مستخدم بنجاح`);
                  setTimeout(() => setClaimToastMessage(null), 3500);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
              >
                نعم، احذف نهائياً ({officersToDeleteModal.length})
              </button>
              <button
                type="button"
                onClick={() => setOfficersToDeleteModal(null)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim / Action Toast Notification */}
      {claimToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#009688] text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-black animate-fadeIn border border-white/20">
          <CheckCircle2 className="w-5 h-5 text-teal-200" />
          <span>{claimToastMessage}</span>
        </div>
      )}

    </div>
  );
}
