import React from 'react';
import { SurveyResponse } from '../types';
import { formatHijriFullDateTime } from '../utils/hijriDate';
import { checkRequestDelayStatus } from '../utils/delayUtils';
import { Send, TrendingUp, UserCheck, Building2, CheckCircle2, Clock, Calendar, AlertTriangle, RotateCcw } from 'lucide-react';

interface RequestDispatchTimelineProps {
  survey: SurveyResponse;
  compact?: boolean;
}

export const RequestDispatchTimeline: React.FC<RequestDispatchTimelineProps> = ({ survey, compact = false }) => {
  // Check delay status
  const delayStatus = checkRequestDelayStatus(survey);

  // Step 1: Beneficiary submission / Equivalency request creation
  const step1Time = formatHijriFullDateTime(survey.createdAt || survey.submittedAt);
  
  // Step 2: Referral from Equivalency Supervisor to Planning
  const hasPlanningReferral = Boolean(
    survey.eqReferredToPlanningAt || 
    survey.referredToPlanningAt || 
    survey.isVacancyRequest
  );
  const step2Time = formatHijriFullDateTime(
    survey.eqReferredToPlanningAt || survey.referredToPlanningAt || (hasPlanningReferral ? survey.createdAt : null)
  );

  // Step 3: Vacancy Approval by Planning & Sending to School Principal
  const hasVacancyApproved = Boolean(
    survey.vacancyApprovedAt || 
    survey.sentToPrincipalAt || 
    survey.vacancyRequestStatus === 'vacancy_opened' || 
    survey.sentToSchoolPrincipal
  );
  const step3Time = formatHijriFullDateTime(
    survey.vacancyApprovedAt || survey.sentToPrincipalAt || (hasVacancyApproved ? survey.createdAt : null)
  );

  // Step 4: Dispatch to School Leadership Supervisor
  const hasLeadershipDispatch = Boolean(survey.sentToLeadership || survey.sentToLeadershipAt);
  const step4Time = formatHijriFullDateTime(
    survey.sentToLeadershipAt || (hasLeadershipDispatch ? survey.createdAt : null)
  );

  // Step 5: Action by Principal (Return or Initial Placement)
  const isReturnedByPrincipal = Boolean(
    survey.returnedByPrincipal || 
    survey.returnedAt || 
    survey.principalReturnedAt || 
    survey.principalReturnReason || 
    survey.vacancyRequestStatus === 'returned_no_vacancy'
  );
  const hasInitialPlacement = Boolean(
    survey.staffingConfirmedAt || 
    survey.principalConfirmedStaffing || 
    survey.vacancyRequestStatus === 'staffing_confirmed'
  );
  const step5Time = formatHijriFullDateTime(
    survey.returnedAt || survey.principalReturnedAt || survey.staffingConfirmedAt || null
  );

  // Step 6: Planning re-resolution date after principal return
  const hasPlanningReResolution = Boolean(survey.planningReResolvedAt);
  const step6Time = formatHijriFullDateTime(survey.planningReResolvedAt || null);

  // Step 7: Final Placement Confirmation after resolving reason
  const hasFinalPlacement = Boolean(
    survey.finalStaffingConfirmedAt || 
    (hasPlanningReResolution && (survey.staffingConfirmedAt || survey.principalConfirmedStaffing || survey.isResolved))
  );
  const step7Time = formatHijriFullDateTime(
    survey.finalStaffingConfirmedAt || (hasFinalPlacement ? survey.staffingConfirmedAt : null)
  );

  const steps = [
    {
      id: 'beneficiary',
      title: '1. إرسال المعاملة من المستفيد / مشرف المعادلة',
      entity: 'المستفيد / مشرف معادلة المؤهلات',
      timeInfo: step1Time,
      isDone: true,
      icon: Send,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dotColor: 'bg-emerald-500'
    },
    {
      id: 'referral_to_planning',
      title: '2. تاريخ الإحالة من مشرف المعادلة إلى مشرف التخطيط',
      entity: 'مشرف معادلة الشهادات → مشرف التخطيط',
      timeInfo: step2Time,
      isDone: hasPlanningReferral,
      icon: TrendingUp,
      badgeColor: hasPlanningReferral 
        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dotColor: hasPlanningReferral ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
    },
    {
      id: 'vacancy_approval',
      title: '3. تاريخ اعتماد فتح الشاغر والإرسال لمدير المدرسة',
      entity: 'مشرف التخطيط والميزانيات المدرسية',
      timeInfo: step3Time,
      isDone: hasVacancyApproved,
      icon: Building2,
      badgeColor: hasVacancyApproved 
        ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dotColor: hasVacancyApproved ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
    },
    {
      id: 'leadership_referral',
      title: '4. تاريخ الإحالة لمشرف القيادة لمتابعة التسكين',
      entity: 'مشرف القيادة المدرسية (متابعة التسكين)',
      timeInfo: step4Time,
      isDone: hasLeadershipDispatch,
      icon: UserCheck,
      badgeColor: hasLeadershipDispatch 
        ? 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dotColor: hasLeadershipDispatch ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
    },
    {
      id: 'principal_action',
      title: isReturnedByPrincipal 
        ? '5. تاريخ الإعادة من المدرسة (لأي سبب يعيق التسكين)'
        : '5. تاريخ الاعتماد والتسكين الأولي من مدير المدرسة',
      entity: 'مدير المدرسة المباشرة',
      timeInfo: step5Time,
      isDone: isReturnedByPrincipal || hasInitialPlacement,
      isReturnNote: isReturnedByPrincipal,
      returnReason: survey.principalReturnReason || 'تعذر التسكين لعدم توفر شاغر بالصف أو المرحلة',
      icon: isReturnedByPrincipal ? AlertTriangle : CheckCircle2,
      badgeColor: isReturnedByPrincipal
        ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
        : hasInitialPlacement
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dotColor: isReturnedByPrincipal ? 'bg-rose-600' : hasInitialPlacement ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
    },
    {
      id: 'planning_reresolution',
      title: '6. تاريخ الإعادة/المعالجة من التخطيط بعد معالجة السبب',
      entity: 'مشرف التخطيط (معالجة سبب الإعادة)',
      timeInfo: step6Time,
      isDone: hasPlanningReResolution,
      icon: RotateCcw,
      badgeColor: hasPlanningReResolution 
        ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dotColor: hasPlanningReResolution ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
    },
    {
      id: 'final_staffing',
      title: '7. تاريخ التسكين النهائي بعد معالجة السبب',
      entity: 'التسكين النهائي بالمدرسة',
      timeInfo: step7Time,
      isDone: hasFinalPlacement || (hasInitialPlacement && !isReturnedByPrincipal),
      icon: CheckCircle2,
      badgeColor: (hasFinalPlacement || (hasInitialPlacement && !isReturnedByPrincipal))
        ? 'bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-700'
        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dotColor: (hasFinalPlacement || (hasInitialPlacement && !isReturnedByPrincipal)) ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
    }
  ];

  if (compact) {
    return (
      <div className="p-3 rounded-2xl border border-teal-200/80 bg-teal-50/20 dark:bg-teal-950/20 dark:border-teal-900/40 space-y-2 text-right font-sans h-full flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-teal-200/50 dark:border-teal-900/40 pb-1.5">
          <span className="font-black text-[9.5px] text-teal-900 dark:text-teal-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>تسلسل المعاملة بالتاريخ والساعة (مُدَقق هجرياً):</span>
          </span>
          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 shrink-0">
            توقيت أم القرى 🕋
          </span>
        </div>

        {delayStatus.isDelayed && (
          <div className="p-2 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-800 dark:text-rose-200 text-[8.5px] font-black flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>🚨 تنبيه عاجل: متأخرة أكثر من يومين عمل عن التسكين!</span>
          </div>
        )}

        <div className="space-y-1.5 text-right font-sans">
          {steps.map((st) => (
            <div key={st.id} className="space-y-0.5">
              <div className="flex items-center justify-between gap-1 text-[8.5px]">
                <div className="flex items-center gap-1 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dotColor}`} />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {st.title.split('.')[1] || st.title}:
                  </span>
                </div>
                <span className={`font-mono text-[8px] font-black shrink-0 ${st.isDone ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400'}`}>
                  {st.isDone ? (st.timeInfo.fullStr) : 'لم يرسل ⏳'}
                </span>
              </div>
              {st.isDone && st.isReturnNote && (
                <div className="mr-3 p-1 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 text-[8px] font-bold border border-rose-200 dark:border-rose-800/60">
                  📌 السبب المكتوب أمام التاريخ: "{st.returnReason}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/40 via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/30 shadow-xs space-y-4">
      {/* Delayed Urgent Banner inside Timeline if applicable */}
      {delayStatus.isDelayed && (
        <div className="p-4 bg-rose-500/20 border-2 border-rose-500/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-rose-900 dark:text-rose-100 shadow-md animate-pulse">
          <div className="flex items-center gap-2.5 font-black text-xs md:text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>🚨 تنبيه طارئ وعاجل: هذه المعاملة متأخرة عن التسكين لأكثر من يومين عمل ({delayStatus.delayWorkingDays} أيام عمل)! يلزم المتابعة والاتصال المباشر لإنهاء التسكين.</span>
          </div>
          <span className="px-3 py-1 bg-rose-600 text-white rounded-xl text-xs font-black shadow-xs">
            إجراء طارئ مطلوب
          </span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-900/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-teal-600 text-white shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-white">
              تسلسل وتواريخ إرسال المعاملة والتحويلات من الجميع (بالتاريخ والساعة)
            </h4>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              تتبع زمني شامل وموثق باليوم، التاريخ الهجري، والساعة الدقيقة لإجراءات الإحالة والتسكين.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-black shadow-xs">
          التاريخ الهجري والساعة 🕋
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {steps.map((st, idx) => {
          const IconComponent = st.icon;
          return (
            <div
              key={st.id}
              className={`p-3 rounded-2xl border text-right space-y-2 transition-all relative ${st.badgeColor}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded bg-white/70 dark:bg-black/40">
                  مرحلة {idx + 1}
                </span>
                <IconComponent className="w-4 h-4 opacity-80" />
              </div>

              <div className="font-black text-xs leading-snug">
                {st.title}
              </div>

              <div className="text-[9.5px] font-bold opacity-80 border-t border-current/10 pt-1">
                الجهة: {st.entity}
              </div>

              {/* Show date and time or pending */}
              <div className="font-mono text-[10px] font-black text-right pt-0.5">
                {st.isDone ? (
                  <div className="space-y-1">
                    <span className="inline-block bg-white/90 dark:bg-black/50 px-2.5 py-1 rounded-xl border border-current/20 shadow-2xs leading-relaxed text-[10.5px]">
                      {st.timeInfo.fullStr}
                    </span>
                    {st.isReturnNote && (
                      <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 text-[10px] font-bold leading-relaxed">
                        📌 <strong>سبب الإعادة المكتوب أمام التاريخ:</strong> "{st.returnReason}"
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 font-bold italic text-[10px]">
                    لم بتم الإجراء بعد ⏳
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
