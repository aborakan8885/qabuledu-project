import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Loader2,
  Check
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import {
  auth,
  db,
  findStaffByCivilId,
  getUserProfile
} from '../firebase';
import { UserProfile, UserPermissions } from '../types';

interface OfficerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userRole: 'admin' | 'officer', userEmail: string, profile?: UserProfile) => void;
}

const STAFF_CREDS_STORAGE_KEY = 'staff_civil_credentials_v1';

function getStoredStaffCreds(): Record<string, { uid: string; password: string }> {
  try {
    const raw = localStorage.getItem(STAFF_CREDS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveStoredStaffCred(civilId: string, uid: string, password: string) {
  try {
    const current = getStoredStaffCreds();
    current[civilId] = { uid, password };
    localStorage.setItem(STAFF_CREDS_STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

export default function OfficerLoginModal({
  isOpen,
  onClose,
  onLoginSuccess
}: OfficerLoginModalProps) {
  // الخطوات الثلاث لتسجيل الدخول بالسجل المدني:
  // 1: إدخال السجل المدني وجلب البيانات من Firestore
  // 2: عرض البيانات (الاسم، الجهة، الصلاحيات) للتأكيد
  // 3: تعيين كلمة المرور وتأكيدها (أو تسجيل الدخول إذا كان لديه uid مسبقاً)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [civilId, setCivilId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [retrievedStaff, setRetrievedStaff] = useState<{ id: string; data: any } | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanCivilId = civilId.trim();
  const storedCred = cleanCivilId ? getStoredStaffCreds()[cleanCivilId] : undefined;
  const hasExistingUid = Boolean(
    retrievedStaff?.data?.uid ||
    retrievedStaff?.data?.authUid ||
    retrievedStaff?.data?.passwordSet ||
    storedCred?.uid
  );

  const handleClose = () => {
    setStep(1);
    setCivilId('');
    setPassword('');
    setConfirmPassword('');
    setRetrievedStaff(null);
    setErrorMessage(null);
    onClose();
  };

  // الخطوة 1: المستخدم يدخل السجل المدني ويضغط "جلب البيانات" (البحث في Firestore في مجموعة users عن حقل civilId)
  const handleRetrieveStaffData = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanId = civilId.trim();

    if (!cleanId || cleanId.length < 10) {
      setErrorMessage('يرجى إدخال رقم سجل مدني صحيح مكون من 10 أرقام.');
      return;
    }

    setLoading(true);
    try {
      const staffDoc = await findStaffByCivilId(cleanId);
      if (!staffDoc) {
        setErrorMessage('السجل غير مسجل. يرجى التأكد من إضافة السجل من قبل مدير النظام أولاً.');
        setRetrievedStaff(null);
      } else {
        setRetrievedStaff(staffDoc);
        setStep(2);
      }
    } catch (err: any) {
      console.warn('⚠️ [Firestore Staff Lookup Note]:', err?.message || err);
      setErrorMessage('تعذر الاتصال بقاعدة البيانات للتحقق من السجل. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // الخطوة 3: تأكيد كلمة المرور، إنشاء الحساب أو تسجيل الدخول ببريد وهمي مشتق من السجل المدني، وتحديث uid في Firestore
  const handleCompleteAuthStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password || password.length < 6) {
      setErrorMessage('يجب أن تتكون كلمة المرور من 6 خانات على الأقل.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين. يرجى إعادة التأكيد بدقة.');
      return;
    }

    if (!retrievedStaff) {
      setErrorMessage('حدث خطأ في استدعاء بيانات المنسوب. يرجى إعادة المحاولة من الخطوة الأولى.');
      setStep(1);
      return;
    }

    setLoading(true);
    const cleanId = civilId.trim();
    const syntheticEmail = `${cleanId}@qabul.madinah.sa`;

    try {
      let resolvedUid = '';

      try {
        if (hasExistingUid) {
          // الموظف يملك حساباً مسبقاً (لديه uid بالفعل): تسجيل الدخول بنفس البريد الوهمي وكلمة المرور
          try {
            const loginCred = await signInWithEmailAndPassword(auth, syntheticEmail, password);
            resolvedUid = loginCred.user.uid;
          } catch (loginErr: any) {
            if (loginErr?.code === 'auth/user-not-found') {
              const createCred = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
              resolvedUid = createCred.user.uid;
            } else {
              throw loginErr;
            }
          }
        } else {
          // إنشاء حساب جديد باستخدام createUserWithEmailAndPassword ببريد وهمي مشتق من السجل المدني
          try {
            const createCred = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
            resolvedUid = createCred.user.uid;
          } catch (createErr: any) {
            if (createErr?.code === 'auth/email-already-in-use') {
              const loginCred = await signInWithEmailAndPassword(auth, syntheticEmail, password);
              resolvedUid = loginCred.user.uid;
            } else {
              throw createErr;
            }
          }
        }
      } catch (authProviderErr: any) {
        // معالجة حالة عدم تفعيل مزود Email/Password في إعدادات Firebase Console (auth/operation-not-allowed)
        if (
          authProviderErr?.code === 'auth/operation-not-allowed' ||
          authProviderErr?.code === 'auth/admin-restricted-operation'
        ) {
          const existingCred = getStoredStaffCreds()[cleanId];
          const existingStaffPwd = retrievedStaff.data.password || existingCred?.password;

          if (hasExistingUid && existingStaffPwd && existingStaffPwd !== password) {
            setErrorMessage('كلمة المرور المدخلة غير صحيحة لهذا السجل المدني.');
            setLoading(false);
            return;
          }

          resolvedUid =
            retrievedStaff.data.uid ||
            retrievedStaff.data.authUid ||
            existingCred?.uid ||
            `uid_${cleanId}`;

          saveStoredStaffCred(cleanId, resolvedUid, password);
        } else {
          throw authProviderErr;
        }
      }

      saveStoredStaffCred(cleanId, resolvedUid, password);

      // تحديث مستند الموظف في Firestore وإضافة uid
      if (resolvedUid && retrievedStaff.id) {
        try {
          const userRef = doc(db, 'users', retrievedStaff.id);
          await updateDoc(userRef, {
            uid: resolvedUid,
            authUid: resolvedUid,
            passwordSet: true,
            lastLoginAt: new Date().toISOString()
          });
        } catch (updateErr) {
          console.warn('⚠️ [Firestore Note]: Could not update uid on users doc:', updateErr);
        }
      }

      // جلب الملف الشخصي والصلاحيات التي حددها الأدمن في قاعدة البيانات
      const profile = await getUserProfile(resolvedUid);
      const effectiveProfile: UserProfile = profile || {
        uid: resolvedUid,
        civilId: cleanId,
        nationalId: cleanId,
        nameAr: retrievedStaff.data.nameAr || retrievedStaff.data.displayName || retrievedStaff.data.name || 'منسوب معتمد',
        displayName: retrievedStaff.data.displayName || retrievedStaff.data.nameAr || 'منسوب معتمد',
        email: syntheticEmail,
        role: retrievedStaff.data.role || (cleanId === '1068575628' ? 'admin' : 'officer'),
        permissions: retrievedStaff.data.permissions || {},
        workField: retrievedStaff.data.workField || retrievedStaff.data.unit || '',
        unit: retrievedStaff.data.unit || retrievedStaff.data.workField || '',
        mobile: retrievedStaff.data.mobile || ''
      };

      const resolvedRole: 'admin' | 'officer' =
        effectiveProfile.role === 'admin' || cleanId === '1068575628' ? 'admin' : 'officer';

      try {
        sessionStorage.setItem(
          'verified_officer_profile_v1',
          JSON.stringify({ role: resolvedRole, profile: effectiveProfile })
        );
      } catch {}

      onLoginSuccess(resolvedRole, syntheticEmail, effectiveProfile);
      handleClose();
    } catch (err: any) {
      console.warn('⚠️ [FirebaseAuth Civil ID Auth Note]:', err?.code, err?.message);
      if (
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        setErrorMessage('كلمة المرور المدخلة غير صحيحة لهذا السجل المدني.');
      } else if (err?.code === 'auth/weak-password') {
        setErrorMessage('كلمة المرور ضعيفة جداً. يجب أن تكون 6 خانات على الأقل.');
      } else if (err?.code === 'auth/too-many-requests') {
        setErrorMessage('تم حظر المحاولات مؤقتاً لتكرار الخطأ. يرجى الانتظار قليلاً.');
      } else {
        setErrorMessage(err?.message || 'حدث خطأ أثناء التحقق من الحساب.');
      }
    } finally {
      setLoading(false);
    }
  };

  // عرض الصلاحيات التي حددها الأدمن في قاعدة البيانات
  const renderPermissionsSummary = (perms?: UserPermissions | any, role?: string) => {
    if (role === 'admin' || cleanCivilId === '1068575628') {
      return (
        <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[11px] font-bold">
          ✓ كامل صلاحيات مدير النظام (تعديل، حذف، تقارير، إدارة منسوبين)
        </span>
      );
    }

    if (!perms || typeof perms !== 'object') {
      return <span className="text-slate-400">الصلاحيات الافتراضية للموظف</span>;
    }

    const labelMap: Record<string, string> = {
      canViewInquiries: 'الاستفسارات والتواصل',
      canViewGeneralInquiries: 'الاستفسارات العامة',
      canViewEquivalencyRequests: 'معادلة الشهادات',
      canViewSchoolTransfers: 'نقل الطلاب والشواغر',
      canViewDashboard: 'لوحة المؤشرات والتقارير',
      canViewFeedback: 'رعاية المستفيدين',
      canViewAlerts: 'التنبيهات العاجلة',
      canViewSchools: 'دليل المدارس والمديرين',
      canViewStaff: 'إدارة المنسوبين',
      canViewSettings: 'إعدادات النظام',
      canViewSync: 'المزامنة السحابية',
      canViewPrincipalData: 'بيانات مديري المدارس',
      canTrackNewRegistrationRequests: 'متابعة التسجيل الجديد',
      canTrackSchoolTransferRequests: 'متابعة طلبات النقل',
      canTrackEquivalencyRequests: 'متابعة طلبات المعادلة',
      canTrackVacancyReferrals: 'إحالات فتح الشواغر',
      canEdit: 'صلاحية التعديل',
      canDelete: 'صلاحية الحذف',
      canViewReports: 'رؤية التقارير'
    };

    const granted: string[] = [];
    Object.entries(perms).forEach(([key, val]) => {
      if (val === true) {
        granted.push(labelMap[key] || key);
      }
    });

    if (granted.length === 0) {
      return <span className="text-slate-400">الصلاحيات الأساسية المعتمدة للمهمة</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {granted.map((item, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold"
          >
            ✓ {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 text-right relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute left-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            بوابة دخول منسوبي الإدارة
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            التحقق الآمن برقم السجل المدني والصلاحيات المعتمدة في قاعدة البيانات
          </p>
        </div>

        {/* شريط الخطوات الثلاث */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
              1
            </div>
            <span>جلب البيانات</span>
          </div>
          <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
              2
            </div>
            <span>تأكيد البيانات</span>
          </div>
          <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
              3
            </div>
            <span>كلمة المرور</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* الخطوة 1: إدخال رقم السجل المدني والضغط على "جلب البيانات" */}
        {step === 1 && (
          <form onSubmit={handleRetrieveStaffData} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                رقم السجل المدني (10 أرقام) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={civilId}
                  onChange={(e) => setCivilId(e.target.value.replace(/\D/g, ''))}
                  placeholder="10xxxxxxxx"
                  autoFocus
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-left font-mono font-bold"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                أدخل رقم السجل المدني المسجل في مجموعة المنسوبين (users) لاستدعاء بياناتك وصلاحياتك.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || civilId.length < 10}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري جلب البيانات من قاعدة البيانات...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>جلب البيانات</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* الخطوة 2: عرض البيانات (الاسم، الجهة، الصلاحيات) للتأكيد */}
        {step === 2 && retrievedStaff && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                <span className="text-slate-500 dark:text-slate-400">الاسم:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {retrievedStaff.data.nameAr || retrievedStaff.data.displayName || retrievedStaff.data.name || 'منسوب معتمد'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                <span className="text-slate-500 dark:text-slate-400">الجهة / الوحدة:</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-300">
                  {retrievedStaff.data.workField || retrievedStaff.data.unit || 'وحدة القبول والتسجيل'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                <span className="text-slate-500 dark:text-slate-400">الصفة / الدور:</span>
                <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-200/60 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200">
                  {retrievedStaff.data.roleDescription || (retrievedStaff.data.role === 'admin' ? 'مدير النظام (أدمن)' : 'مسؤول قبول معتمد')}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                <span className="text-slate-500 dark:text-slate-400">رقم السجل المدني:</span>
                <span className="font-mono font-bold">{civilId}</span>
              </div>

              <div className="pt-1">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">الصلاحيات الممنوحة:</span>
                {renderPermissionsSummary(retrievedStaff.data.permissions, retrievedStaff.data.role)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setErrorMessage(null);
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                رجوع
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  setErrorMessage(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد البيانات والمتابعة</span>
              </button>
            </div>
          </div>
        )}

        {/* الخطوة 3: كتابة كلمة المرور وتأكيدها (أو تسجيل الدخول إذا كان لديه uid مسبقاً) */}
        {step === 3 && (
          <form onSubmit={handleCompleteAuthStep} className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {hasExistingUid ? 'كلمة المرور الخاصة بك *' : 'كلمة المرور الجديدة *'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 خانات على الأقل"
                  autoFocus
                  className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-left font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                تأكيد كلمة المرور *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور للتأكيد"
                  className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-left font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setErrorMessage(null);
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                رجوع
              </button>
              <button
                type="submit"
                disabled={loading || password.length < 6 || password !== confirmPassword}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق والدخول...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{hasExistingUid ? 'تسجيل الدخول للوحة التحكم' : 'تعيين كلمة المرور والدخول'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
