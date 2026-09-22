with open('src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Verify start of block around line 1986 (index 1985)
start_idx = -1
for i in range(1980, 2000):
    if '{/* Claim Button */}' in lines[i]:
        start_idx = i
        break

end_idx = -1
for i in range(start_idx, start_idx + 180):
    if 'اعتماد القبول والتسكين النهائي وإغلاق المعاملة' in lines[i]:
        # end is after the closing </div> of this section
        for j in range(i, i + 10):
            if lines[j].strip() == '</div>':
                end_idx = j + 1
                break
        break

print(f"Found block from index {start_idx} to {end_idx}")

new_code = '''                                       {/* 📋 إجراءات مشرف وحدة القبول والتسجيل الخمسة المعتمدة */}
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
'''

lines[start_idx:end_idx] = [new_code]

with open('src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Replacement successful!")
