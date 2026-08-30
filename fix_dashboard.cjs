const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const anchorStart = '{/* 6. DYNAMIC ACTIVE VIEW RENDERER */}';
const anchorEnd = '{/* MODAL 1: REQUEST DOSSIER DETAILS MODAL */}';

const startIdx = content.indexOf(anchorStart);
const endIdx = content.indexOf(anchorEnd);

if (startIdx === -1 || endIdx === -1) {
    console.error('Anchors not found. Start:', startIdx, 'End:', endIdx);
    process.exit(1);
}

const admissionViewCode = `
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

                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
                     <button 
                       onClick={() => setActiveFeature('equivalency_requests')}
                       className="px-5 py-3 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-black flex items-center gap-2.5 transition-all shadow-lg shadow-indigo-900/40 cursor-pointer active:scale-95"
                     >
                        <GraduationCap className="w-4 h-4" />
                        <span>الانتقال لشاشة معادلة المؤهلات</span>
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                     </button>
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
               </div>
               
               <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-teal-800/10">
                  {[
                    { id: 'all', label: 'الجميع', count: workflowCounts.all, icon: Grid },
                    { id: 'new', label: 'وارد جديد (غير مستلم)', count: workflowCounts.new, icon: Inbox },
                    { id: 'my', label: 'معاملاتي المستلمة', count: workflowCounts.my, icon: UserCheck },
                    { id: 'archive', label: 'الأرشيف والمنجز', count: workflowCounts.archive, icon: Database }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setWorkflowStatus(btn.id)}
                      className={"px-4 py-2.5 rounded-xl text-[11px] font-black flex items-center gap-2 transition-all cursor-pointer " + (workflowStatus === btn.id ? 'bg-[#009688] text-white shadow-md scale-102' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')}
                    >
                       <btn.icon className="w-3.5 h-3.5" />
                       <span>{btn.label}</span>
                       <span className={"px-2 py-0.5 rounded-md text-[9px] font-bold " + (workflowStatus === btn.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300')}>
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
                        <tr className="bg-slate-50 dark:bg-slate-950 font-black text-slate-500 border-b border-slate-100 dark:border-teal-800/20">
                           <th className="p-4">المستفيد</th>
                           <th className="p-4">التفاصيل</th>
                           <th className="p-4 text-center">الموظف المستلم</th>
                           <th className="p-4 text-center">الإجراءات</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-teal-800/10">
                        {filteredAdmissionSurveys.length > 0 ? (
                          filteredAdmissionSurveys.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-all group">
                               <td className="p-4 font-black">{s.beneficiaryName || s.parentName}</td>
                               <td className="p-4">وحدة القبول - {s.stage}</td>
                               <td className="p-4">
                                  <div className="space-y-2">
                                     <div className="text-center text-[10px] font-bold text-slate-500">
                                        الحالة: <span className="font-black text-teal-700">{s.serviceEmployee && s.serviceEmployee !== 'غير مسند' ? 'مستلم (' + s.serviceEmployee + ')' : '📥 وارد جديد'}</span>
                                     </div>
                                     {!(s.serviceEmployee && s.serviceEmployee !== 'غير مسند') && (
                                       <button onClick={() => handleClaimAdmissionSurvey(s)} className="w-full py-1.5 px-3 rounded-xl bg-[#009688] text-white font-black text-[10px] cursor-pointer">استلام الطلب</button>
                                     )}
                                     <div className="p-2 rounded-xl border border-purple-100 bg-purple-50/10">
                                        {!(s.serviceEmployee && s.serviceEmployee !== 'غير مسند') && (
                                          <button onClick={() => handleClaimAdmissionSurvey(s)} className="w-full py-1.5 px-2 rounded-lg bg-[#7c3aed] text-white font-black text-[9px] mb-2 cursor-pointer">أيقونة استلام الطلب</button>
                                        )}
                                        {renderAppointmentScheduler(s)}
                                     </div>
                                  </div>
                               </td>
                               <td className="p-4 text-center">
                                  <button onClick={() => onDeleteSurvey(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                               </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold">لا توجد معاملات</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}
`;

const equivalencyViewCode = `
        {/* VIEW 2: SCREEN 2 - طلبات معادلة المؤهلات والشهادات */}
        {activeFeature === 'equivalency_requests' && (
          <div className="space-y-6">
             <div className={"p-6 rounded-[32px] border border-slate-100 dark:border-teal-800/20 shadow-xs " + (isDark ? 'bg-[#081e2b]' : 'bg-white')}>
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">سجل طلبات معادلة المؤهلات والشهادات</h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-right text-xs">
                      <thead>
                         <tr className="bg-slate-50 dark:bg-slate-950 font-black text-slate-500 border-b border-slate-100 dark:border-teal-800/20">
                            <th className="p-4">المستفيد</th>
                            <th className="p-4">الحالة</th>
                            <th className="p-4 text-center">الإجراءات</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-teal-800/10">
                         {filteredEquivalencySurveys.length > 0 ? (
                           filteredEquivalencySurveys.map((s) => (
                             <tr key={s.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="p-4 font-black">{s.beneficiaryName || s.parentName}</td>
                                <td className="p-4">
                                   <div className="space-y-2">
                                      <div className="text-center text-[10px] font-bold text-slate-500">
                                         الحالة: <span className="font-black text-indigo-700">{s.serviceEmployee && s.serviceEmployee !== 'غير مسند' ? 'مستلم (' + s.serviceEmployee + ')' : '📥 وارد جديد'}</span>
                                      </div>
                                      {!(s.serviceEmployee && s.serviceEmployee !== 'غير مسند') && (
                                        <button onClick={() => handleClaimEquivalencySurvey(s)} className="w-full py-1.5 px-3 rounded-xl bg-teal-600 text-white font-black text-[10px] cursor-pointer">استلام الطلب</button>
                                      )}
                                      <div className="p-2 rounded-xl border border-purple-100 bg-purple-50/10">
                                         {!(s.serviceEmployee && s.serviceEmployee !== 'غير مسند') && (
                                           <button onClick={() => handleClaimEquivalencySurvey(s)} className="w-full py-1.5 px-2 rounded-lg bg-[#7c3aed] text-white font-black text-[9px] mb-2 cursor-pointer">أيقونة استلام الطلب</button>
                                         )}
                                         {renderAppointmentScheduler(s)}
                                      </div>
                                   </div>
                                </td>
                                <td className="p-4 text-center">
                                   <button onClick={() => onDeleteSurvey(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                </td>
                             </tr>
                           ))
                         ) : (
                           <tr><td colSpan={3} className="p-10 text-center text-slate-400 font-bold">لا توجد طلبات معادلة</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )
`;

const restOfViews = content.substring(content.indexOf('{/* VIEW 3: SYNC & CLOUD INTEGRATION (المزامنة والربط الإلكتروني) */}'), endIdx);

const finalReplacement = anchorStart + "\n" + admissionViewCode + equivalencyViewCode + restOfViews + "\n        ";
const newContent = content.substring(0, startIdx) + finalReplacement + content.substring(endIdx);
fs.writeFileSync('src/components/Dashboard.tsx', newContent, 'utf8');
console.log('Successfully stabilized Dashboard dynamic views with all views preserved');

