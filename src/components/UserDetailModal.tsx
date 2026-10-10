import React, { useState } from 'react';
import { OfficerUser, UserPermissions, OfficerRole } from '../types';
import { motion } from 'motion/react';
import { X, Trash2, Save, User, Shield, Briefcase, Phone, Mail, CreditCard } from 'lucide-react';

export default function UserDetailModal({ 
  officer, 
  onClose, 
  onSave, 
  onDelete,
  isAdmin,
  isDark = false 
}: { 
  officer: OfficerUser, 
  onClose: () => void, 
  onSave: (updatedOfficer: OfficerUser) => void, 
  onDelete?: (officerId: string) => void,
  isAdmin: boolean,
  isDark?: boolean 
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<OfficerUser>({ 
    ...officer,
    permissions: officer.permissions || {} 
  });

  const roles: { label: string, value: OfficerRole }[] = [
    { label: 'مدير النظام (أدمن - كامل الصلاحيات)', value: 'admin' },
    { label: 'مدير الإدارة', value: 'director' },
    { label: 'مدير وحدة القبول', value: 'manager_admission_unit' },
    { label: 'مشرف وحدة القبول والتوجيه', value: 'supervisor' },
    { label: 'مشرف القبول دعم فني', value: 'tech_support_supervisor' },
    { label: 'مشرف القبول معادلة الشهادات', value: 'equivalency_supervisor' },
    { label: 'مشرف التخطيط فتح الشواغر', value: 'planning_vacancy_supervisor' },
    { label: 'مشرف التخطيط المدرسي', value: 'school_planning' },
    { label: 'مشرف القيادة المدرسية', value: 'school_leadership' },
    { label: 'مشرف الإدارة المدرسية للمرحلة الابتدائية', value: 'primary_school_supervisor' },
    { label: 'مشرف الإدارة المدرسية للمرحلة المتوسطة', value: 'intermediate_school_supervisor' },
    { label: 'مشرف الإدارة المدرسية للمرحلة الثانوية', value: 'secondary_school_supervisor' },
    { label: 'مسؤول الطفولة المبكرة', value: 'early_childhood_official' },
    { label: 'مسؤول رياض الأطفال', value: 'kindergarten_official' },
  ];

  // Specific 9 tracking permissions requested by the user
  const trackingPermissions: { key: keyof UserPermissions, label: string }[] = [
    { key: 'canTrackNewRegistrationRequests', label: 'متابعة طلبات طلب تسجيل جديد' },
    { key: 'canTrackSchoolTransferRequests', label: 'متابعة طلبات النقل بين المدارس' },
    { key: 'canTrackEquivalencyRequests', label: 'متابعة طلبات طلب معادلة الشهادات' },
    { key: 'canTrackVacancyReferrals', label: 'متابعة الاحالات لفتح شاغر' },
    { key: 'canTrackPlacementPrimary', label: 'متابعة الاحالات لمتابعة التسكين للمرحلة الابتدائية' },
    { key: 'canTrackPlacementIntermediate', label: 'متابعة الاحالات لمتابعة التسكين للمرحلة المتوسطة' },
    { key: 'canTrackPlacementSecondary', label: 'متابعة الاحالات لمتابعة التسكين للمرحلة الثانوية' },
    { key: 'canTrackPlacementEarlyChildhood', label: 'متابعة الاحالات لمتابعة التسكين للطفولة المبكرة' },
    { key: 'canTrackPlacementKindergarten', label: 'متابعة الاحالات لمتابعة التسكين لمرحلة رياض الاطفال' },
  ];

  // System & general portal permissions
  const generalPermissions: { key: keyof UserPermissions, label: string }[] = [
    { key: 'canViewDashboard', label: 'لوحة التحكم والمؤشرات' },
    { key: 'canViewInquiries', label: 'الاستفسارات والتواصل' },
    { key: 'canViewEquivalencyRequests', label: 'طلبات معادلة الشهادات' },
    { key: 'canViewSchoolTransfers', label: 'طلبات التسكين والمتابعة' },
    { key: 'canViewFeedback', label: 'ملاحظات وبلاغات المستفيدين' },
    { key: 'canViewStaff', label: 'منسوبي الإدارة والكوادر' },
    { key: 'canViewSchools', label: 'دليل المدارس والارقام الوزارية' },
    { key: 'canViewPrincipalData', label: 'بيانات مديري المدارس' },
    { key: 'canViewAlerts', label: 'سجل التنبيهات الفورية' },
    { key: 'canViewSettings', label: 'لوحة الإعدادات الشاملة' },
    { key: 'canViewSync', label: 'المزامنة والربط الإلكتروني' },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-2xl p-6 sm:p-8 rounded-[32px] shadow-2xl max-h-[92vh] overflow-y-auto border ${
          isDark 
            ? 'bg-[#081e2b] text-white border-teal-800/40' 
            : 'bg-white text-slate-900 border-slate-100'
        }`}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100 dark:border-teal-800/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black">{formData.nameAr || 'ملف الموظف'}</h3>
              <p className="text-xs font-bold text-slate-400">تعديل بيانات الكادر الوظيفي والصلاحيات الممنوحة</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); onClose(); }} className="space-y-5">
          {/* Main User Info Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 dark:text-teal-400/80 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                الاسم الرباعي:
              </label>
              <input 
                type="text" 
                placeholder="الاسم الرباعي" 
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-[#061b28] text-xs font-bold outline-hidden focus:ring-2 focus:ring-indigo-500" 
                value={formData.nameAr} 
                onChange={e => setFormData({...formData, nameAr: e.target.value})} 
                disabled={!isAdmin} 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 dark:text-teal-400/80 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                السجل المدني (الهوية):
              </label>
              <input 
                type="text" 
                placeholder="السجل المدني (10 أرقام)" 
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-[#061b28] text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-indigo-500" 
                value={formData.nationalId || ''} 
                onChange={e => setFormData({...formData, nationalId: e.target.value})} 
                disabled={!isAdmin} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 dark:text-teal-400/80 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                البريد الوزاري:
              </label>
              <input 
                type="email" 
                placeholder="البريد الوزاري المعتمد" 
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-[#061b28] text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-indigo-500" 
                value={formData.personalEmail || ''} 
                onChange={e => setFormData({...formData, personalEmail: e.target.value})} 
                disabled={!isAdmin} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 dark:text-teal-400/80 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                رقم الجوال:
              </label>
              <input 
                type="text" 
                placeholder="رقم الجوال (05xxxxxxxx)" 
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-[#061b28] text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-indigo-500" 
                value={formData.mobile || ''} 
                onChange={e => setFormData({...formData, mobile: e.target.value})} 
                disabled={!isAdmin} 
              />
            </div>
          </div>
          
          {/* Role Dropdown */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-black text-slate-700 dark:text-teal-300 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              المهمة / الدور الوظيفي (شريط الأيقونة المنسدلة):
            </label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-[#061b28] text-xs font-bold outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer" 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value as OfficerRole})} 
              disabled={!isAdmin}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value} className="bg-white dark:bg-[#081e2b]">
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Job Description directly below Role Dropdown as requested */}
          <div className="space-y-1 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
            <label className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-600" />
              الوصف الوظيفي (المعتمد أسفل شريط الأيقونة المنسدلة للمهمة):
            </label>
            <textarea 
              rows={3}
              placeholder="اكتب الوصف الوظيفي والمسؤوليات الموكلة لهذا الموظف بالتفصيل..." 
              className="w-full p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-[#061b28] text-xs font-bold leading-relaxed outline-hidden focus:ring-2 focus:ring-amber-500" 
              value={formData.roleDescription || ''} 
              onChange={e => setFormData({...formData, roleDescription: e.target.value})} 
              disabled={!isAdmin} 
            />
          </div>

          {/* 9 Requested Follow-up / Tracking Permissions */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                صلاحيات متابعة الطلبات والإحالات الخاصة:
              </h4>
              <span className="text-[10px] font-bold text-slate-400">9 صلاحيات متابعة معتمدة</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
              {trackingPermissions.map(perm => (
                <label 
                  key={perm.key} 
                  className={`flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                    formData.permissions?.[perm.key] 
                      ? 'bg-indigo-600/10 text-indigo-900 dark:text-indigo-200 font-black' 
                      : 'text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer"
                    checked={!!formData.permissions?.[perm.key]} 
                    onChange={e => setFormData({
                      ...formData, 
                      permissions: { ...formData.permissions, [perm.key]: e.target.checked }
                    })} 
                    disabled={!isAdmin} 
                  />
                  <span className="text-[11px] leading-tight">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* General System Permissions */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700 dark:text-teal-300">صلاحيات الشاشات والبوابات:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061b28] border border-slate-200/60 dark:border-teal-800/30">
              {generalPermissions.map(perm => (
                <label key={perm.key} className="flex items-center gap-2 p-1.5 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-3.5 h-3.5 rounded-md accent-teal-600 cursor-pointer"
                    checked={!!formData.permissions?.[perm.key]} 
                    onChange={e => setFormData({
                      ...formData, 
                      permissions: { ...formData.permissions, [perm.key]: e.target.checked }
                    })} 
                    disabled={!isAdmin} 
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons: Save & Delete */}
          {isAdmin && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-teal-800/30">
              {showDeleteConfirm ? (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                  <div className="text-xs font-black text-rose-800 dark:text-rose-300">
                    ⚠️ تأكيد نهائي: هل أنت متأكد من حذف حساب ({formData.nameAr}) نهائياً؟
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete?.(officer.id);
                        onClose();
                      }}
                      className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      نعم، احذف نهائياً
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-2 px-3.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    type="submit" 
                    className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات والصلاحيات</span>
                  </button>
                  
                  {onDelete && (
                    <button 
                      type="button" 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="py-3 px-5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-98"
                      title="حذف هذا المستخدم"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف المستخدم</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
