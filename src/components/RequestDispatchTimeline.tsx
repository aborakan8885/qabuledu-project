import React from 'react';
import { SurveyResponse } from '../types';
import { formatHijriFullDateTime } from '../utils/hijriDate';
import { Send, TrendingUp, UserCheck, Building2, CheckCircle2, Clock, Calendar } from 'lucide-react';

interface RequestDispatchTimelineProps {
  survey: SurveyResponse;
  compact?: boolean;
}

export const RequestDispatchTimeline: React.FC<RequestDispatchTimelineProps> = ({ survey, compact = false }) => {
  // Step 1: Beneficiary Submission
  const step1 = formatHijriFullDateTime(survey.createdAt || survey.submittedAt);
  
  // Step 2: Referral to Planning
  const hasPlanning = Boolean(survey.isVacancyRequest || survey.referredToPlanningAt);
  const step2 = formatHijriFullDateTime(survey.referredToPlanningAt || (hasPlanning ? survey.createdAt : null));

  // Step 3: Referral to Leadership
  const hasLeadership = Boolean(survey.sentToLeadership || survey.sentToLeadershipAt);
  const step3 = formatHijriFullDateTime(survey.sentToLeadershipAt || (hasLeadership ? survey.createdAt : null));

  // Step 4: Referral to School Principal
  const hasPrincipal = Boolean(survey.sentToSchoolPrincipal || survey.sentToPrincipalAt);
  const step4 = formatHijriFullDateTime(survey.sentToPrincipalAt || (hasPrincipal ? survey.createdAt : null));

  // Step 5: Principal Staffing Confirmation
  const hasStaffing = Boolean(survey.staffingConfirmedAt || survey.principalConfirmedStaffing);
  const step5 = formatHijriFullDateTime(survey.staffingConfirmedAt || (hasStaffing ? survey.resolvedAt : null));

  const steps = [
    {
      id: 'beneficiary',
      title: '1. تاريخ إرسال الطلب من المستفيد',
      entity: 'المستفيد (ولي الأمر / الطالب)',
      timeInfo: step1,
      isDone: true,
      icon: Send,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dotColor: 'bg-emerald-500'
    },
    {
      id: 'planning',
      title: '2. تاريخ إحالة الطلب من مشرف القبول إلى التخطيط',
      entity: 'مشرف التخطيط والميزانيات',
      timeInfo: step2,
      isDone: hasPlanning,
      icon: TrendingUp,
      badgeColor: hasPlanning 
        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dotColor: hasPlanning ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
    },
    {
      id: 'leadership',
      title: '3. تاريخ إحالة الطلب لمشرف القيادة المدرسية',
      entity: 'مشرف القيادة المدرسية',
      timeInfo: step3,
      isDone: hasLeadership,
      icon: UserCheck,
      badgeColor: hasLeadership 
        ? 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dotColor: hasLeadership ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
    },
    {
      id: 'principal',
      title: '4. تاريخ إحالة الطلب إلى مدير المدرسة',
      entity: 'مدير المدرسة المباشرة',
      timeInfo: step4,
      isDone: hasPrincipal,
      icon: Building2,
      badgeColor: hasPrincipal 
        ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dotColor: hasPrincipal ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
    },
    {
      id: 'staffing',
      title: '5. تاريخ تسكين الطالب واعتماد القبول نهائياً',
      entity: 'إكمال التسكين من المدرسة',
      timeInfo: step5,
      isDone: hasStaffing,
      icon: CheckCircle2,
      badgeColor: hasStaffing 
        ? 'bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-700'
        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dotColor: hasStaffing ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
    }
  ];

  if (compact) {
    return (
      <div className="p-2.5 rounded-xl border border-teal-200/80 bg-teal-50/20 dark:bg-teal-950/20 dark:border-teal-900/40 space-y-1.5 text-right font-sans h-full flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-teal-200/50 dark:border-teal-900/40 pb-1">
          <span className="font-black text-[9px] text-teal-900 dark:text-teal-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-teal-600 shrink-0" />
            <span>تسلسل تواريخ إرسال المعاملة:</span>
          </span>
          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 shrink-0">
            هجري 🕋
          </span>
        </div>

        <div className="space-y-1 text-right font-sans">
          {steps.map((st) => (
            <div key={st.id} className="flex items-center justify-between gap-1 text-[8.5px]">
              <div className="flex items-center gap-1 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dotColor}`} />
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                  {st.title.split('.')[1] || st.title}:
                </span>
              </div>
              <span className={`font-mono text-[8px] font-black shrink-0 ${st.isDone ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400'}`}>
                {st.isDone ? (st.timeInfo.hijriStr || st.timeInfo.fullStr) : 'لم يرسل ⏳'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/40 via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/30 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-900/40 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-teal-600 text-white">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-xs text-slate-900 dark:text-white">
              تسلسل وتواريخ إرسال المعاملة والتحويلات (بالهجري وبالساعة)
            </h4>
            <p className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400">
              تتبع زمني دقيق لإرسال وإحالة المعاملة بين المستفيد والجهات الرسمية المعنية.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-teal-600 text-white text-[10px] font-black shadow-xs">
          التاريخ الهجري الرسمي 🕋
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 relative">
        {steps.map((st, idx) => {
          const IconComponent = st.icon;
          return (
            <div
              key={st.id}
              className={`p-2.5 rounded-2xl border text-right space-y-1.5 transition-all relative ${st.badgeColor}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/30">
                  مرحلة {idx + 1}
                </span>
                <IconComponent className="w-3.5 h-3.5 opacity-80" />
              </div>

              <div className="font-black text-[10px] leading-snug">
                {st.title}
              </div>

              <div className="text-[9px] font-bold opacity-80 border-t border-current/10 pt-1">
                الجهة: {st.entity}
              </div>

              <div className="font-mono text-[9.5px] font-black text-right pt-0.5">
                {st.isDone ? (
                  <span className="inline-block bg-white/80 dark:bg-black/40 px-2 py-1 rounded-lg border border-current/20 shadow-2xs">
                    {st.timeInfo.fullStr}
                  </span>
                ) : (
                  <span className="text-slate-400 font-bold italic">
                    لم تتم الإحالة بعد ⏳
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
