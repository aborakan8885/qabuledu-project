import React, { useState } from 'react';
import { OfficerUser, OfficerRole } from '../types';
import { motion } from 'motion/react';
import { X, UserPlus, Briefcase, User, CreditCard, Mail, Phone } from 'lucide-react';

export default function AddUserModal({ 
  onClose, 
  onAdd, 
  isDark = false 
}: { 
  onClose: () => void, 
  onAdd: (user: OfficerUser) => void, 
  isDark?: boolean 
}) {
  const [formData, setFormData] = useState<Partial<OfficerUser>>({
    id: 'emp_' + Math.random().toString(36).substr(2, 9),
    nameAr: '',
    role: 'supervisor',
    mobile: '',
    isActive: true,
    workField: '',
    roleDescription: '',
    assignedStage: 'الكل',
    personalEmail: '',
    nationalId: '',
    permissions: {}
  });

  const roles: { label: string, value: OfficerRole }[] = [
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
    { label: 'مدير الإدارة', value: 'director' },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-lg p-6 sm:p-8 rounded-[32px] shadow-2xl border ${
          isDark 
            ? 'bg-[#081e2b] text-white border-teal-800/40' 
            : 'bg-white text-slate-900 border-slate-100'
        }`}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-teal-800/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shadow-inner">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">إضافة مستخدم جديد</h3>
              <p className="text-xs font-bold text-slate-400">إضافة عضو جديد لمنسوبي الإدارة وتحديد دوره</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onAdd(formData as OfficerUser); onClose(); }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-500 dark:text-teal-400/80 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              الاسم الرباعي:
            </label>
            <input 
              type="text" 
              placeholder="الاسم الرباعي كاملاً" 
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-[#061b28] text-xs font-bold outline-hidden focus:ring-2 focus:ring-indigo-500" 
              value={formData.nameAr || ''} 
              onChange={e => setFormData({...formData, nameAr: e.target.value})} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 dark:text-teal-400/80 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                السجل المدني:
              </label>
              <input 
                type="text" 
                placeholder="السجل المدني (10 أرقام)" 
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-[#061b28] text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-indigo-500" 
                value={formData.nationalId || ''} 
                onChange={e => setFormData({...formData, nationalId: e.target.value})} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 dark:text-teal-400/80 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                رقم الجوال:
              </label>
              <input 
                type="text" 
                placeholder="05xxxxxxxx" 
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-[#061b28] text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-indigo-500" 
                value={formData.mobile || ''} 
                onChange={e => setFormData({...formData, mobile: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-500 dark:text-teal-400/80 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              البريد الوزاري:
            </label>
            <input 
              type="email" 
              placeholder="example@moe.gov.sa" 
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-[#061b28] text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-indigo-500" 
              value={formData.personalEmail || ''} 
              onChange={e => setFormData({...formData, personalEmail: e.target.value})} 
            />
          </div>

          {/* Role Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-700 dark:text-teal-300 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              المهمة / الدور الوظيفي (شريط الأيقونة المنسدلة):
            </label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-teal-800/40 bg-slate-50 dark:bg-[#061b28] text-xs font-bold outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer" 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value as OfficerRole})}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value} className="bg-white dark:bg-[#081e2b]">
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Job Description directly below Role Dropdown */}
          <div className="space-y-1 bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
            <label className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-600" />
              الوصف الوظيفي (أسفل شريط الأيقونة المنسدلة للمهمة):
            </label>
            <textarea 
              rows={2}
              placeholder="الوصف الوظيفي المعتمد للمهمة..." 
              className="w-full p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-[#061b28] text-xs font-bold leading-relaxed outline-hidden focus:ring-2 focus:ring-amber-500" 
              value={formData.roleDescription || ''} 
              onChange={e => setFormData({...formData, roleDescription: e.target.value})} 
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة المستخدم واعتماده</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
