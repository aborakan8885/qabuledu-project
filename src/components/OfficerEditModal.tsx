import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { OfficerUser } from '../types';

interface OfficerEditModalProps {
  officer: OfficerUser;
  onClose: () => void;
  onUpdate: (officer: OfficerUser) => void;
  isDark: boolean;
}

export default function OfficerEditModal({ officer, onClose, onUpdate, isDark }: OfficerEditModalProps) {
  const [formData, setFormData] = useState<OfficerUser>({ ...officer });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
       <form onSubmit={handleSubmit} className="bg-white dark:bg-[#081e2b] rounded-[32px] max-w-md w-full p-6 space-y-4 border border-slate-100 dark:border-teal-800/40 shadow-2xl">
          <div className="flex items-center justify-between border-b pb-3 dark:border-teal-800/20">
             <h3 className="font-black text-lg text-slate-900 dark:text-white">تعديل بيانات الموظف: {officer.nameAr}</h3>
             <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
             </button>
          </div>

          <div className="space-y-3">
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الاسم</label>
                <input 
                   type="text" 
                   value={formData.nameAr} 
                   onChange={e => setFormData({...formData, nameAr: e.target.value})}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-teal-800/40 rounded-xl text-sm"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الوصف الوظيفي</label>
                <input 
                   type="text" 
                   value={formData.role} 
                   onChange={e => setFormData({...formData, role: e.target.value})}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-teal-800/40 rounded-xl text-sm"
                />
             </div>
             <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-2">الصلاحيات</label>
                <div className="grid grid-cols-1 gap-2">
                   {[
                     { key: 'canTrackNewRegistrationRequests', label: 'متابعة طلبات طلب تسجيل جديد' },
                     { key: 'canTrackSchoolTransferRequests', label: 'متابعة طلبات النقل بين المدارس' },
                     { key: 'canTrackEquivalencyRequests', label: 'متابعة طلبات طلب معادلة الشهادات' },
                     { key: 'canTrackVacancyReferrals', label: 'متابعة الاحالات لفتح شاغر' },
                     { key: 'canTrackPlacementPrimary', label: 'متابعة الاحالات لمتابعة التسكين للمرحلة الابتدائية' },
                     { key: 'canTrackPlacementIntermediate', label: 'متابعة الاحالات لمتابعة التسكين للمرحلة المتوسطة' },
                     { key: 'canTrackPlacementSecondary', label: 'متابعة الاحالات لمتابعة التسكين للمرحلة الثانوية' },
                     { key: 'canTrackPlacementEarlyChildhood', label: 'متابعة الاحالات لمتابعة التسكين للطفولة المبكرة' },
                     { key: 'canTrackPlacementKindergarten', label: 'متابعة الاحالات لمتابعة التسكين لمرحلة رياض الاطفال' },
                   ].map(({ key, label }) => (
                     <label key={key} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                       <input 
                         type="checkbox" 
                         checked={!!(formData.permissions as any)?.[key]}
                         onChange={e => {
                           const newPermissions = { ...(formData.permissions || {}), [key]: e.target.checked };
                           setFormData({...formData, permissions: newPermissions as any});
                         }}
                         className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                       />
                       {label}
                     </label>
                   ))}
                </div>
             </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl text-xs font-black cursor-pointer">إلغاء</button>
             <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-2">
                <Save className="w-4 h-4" />
                حفظ التعديلات
             </button>
          </div>
       </form>
    </div>
  );
}
