import React from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  Percent,
  Star,
  AlertTriangle,
  GraduationCap,
  School,
  BookOpen,
  Baby,
  Award,
  FileText,
  FileBadge
} from 'lucide-react';
import { GovernorateCalculatedData } from '../utils/governorateStats';

interface GovernoratePartCardProps {
  data: GovernorateCalculatedData;
  onOpenReport?: () => void;
  isDark?: boolean;
}

export const GovernoratePartCard: React.FC<GovernoratePartCardProps> = ({
  data,
  onOpenReport,
  isDark = false
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-teal-900/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all">
      {/* Top Banner Header matching image.png */}
      <div className="bg-[#006C70] px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">📍</span>
          <h4 className="text-sm sm:text-base font-black text-white tracking-wide">
            {data.name}
          </h4>
        </div>
        <div className="bg-white/15 backdrop-blur-xs text-white text-[10.5px] sm:text-xs font-bold px-3 py-1 rounded-full border border-white/20 shadow-xs">
          13 مؤشر إحصائي معتمد
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-3.5 sm:p-4 space-y-3">
        {/* Quick summary metrics header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400">
            المؤشرات الرسمية المعتمدة لجميع المراحل والمعادلات
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              إجمالي المعاملات: <strong className="text-slate-900 dark:text-white font-black">{data.totalSurveys}</strong>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
              نسبة الإنجاز: <strong className="font-black">{data.resolutionRate}%</strong>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
              معدل الرضا: <strong className="font-black">{data.avgSatisfaction} / 5</strong>
            </span>
          </div>
        </div>

        {/* 13 Indicators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5">
          {/* 1. إجمالي المعاملات المسجلة */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">إجمالي المعاملات</span>
              <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 group-hover:scale-110 transition-transform shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-slate-900 dark:text-white">{data.totalSurveys}</div>
          </div>

          {/* 2. المعاملات المنجزة والمغلقة */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">المعاملات المنجزة</span>
              <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-emerald-600 dark:text-emerald-400">{data.resolvedSurveys}</div>
          </div>

          {/* 3. المعاملات الجارية وقيد المعالجة */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">المعاملات الجارية</span>
              <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 group-hover:scale-110 transition-transform shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-amber-600 dark:text-amber-400">{data.inProgressSurveys}</div>
          </div>

          {/* 4. نسبة إنجاز المعاملات */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">نسبة الإنجاز</span>
              <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/50 text-[#006C70] dark:text-teal-400 group-hover:scale-110 transition-transform shrink-0">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-[#006C70] dark:text-teal-400">{data.resolutionRate}%</div>
          </div>

          {/* 5. معدل رضا المستفيدين */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">معدل الرضا</span>
              <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-500 group-hover:scale-110 transition-transform shrink-0">
                <Star className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-amber-500">{data.avgSatisfaction} / 5</div>
          </div>

          {/* 6. بلاغات المدارس الميدانية */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">بلاغات المدارس</span>
              <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 group-hover:scale-110 transition-transform shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-rose-600 dark:text-rose-400">{data.principalReportsCount}</div>
          </div>

          {/* 7. معاملات المرحلة الثانوية */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">المرحلة الثانوية</span>
              <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 group-hover:scale-110 transition-transform shrink-0">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-purple-600 dark:text-purple-400">{data.secAdmission}</div>
          </div>

          {/* 8. معاملات المرحلة المتوسطة */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">المرحلة المتوسطة</span>
              <div className="p-1 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-600 group-hover:scale-110 transition-transform shrink-0">
                <School className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-sky-600 dark:text-sky-400">{data.interAdmission}</div>
          </div>

          {/* 9. معاملات المرحلة الابتدائية */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">المرحلة الابتدائية</span>
              <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-emerald-600 dark:text-emerald-400">{data.primAdmission}</div>
          </div>

          {/* 10. معاملات مرحلة الطفولة المبكرة */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">الطفولة المبكرة</span>
              <div className="p-1 rounded-md bg-pink-50 dark:bg-pink-950/50 text-pink-500 group-hover:scale-110 transition-transform shrink-0">
                <Baby className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-pink-500">{data.earlyChildhoodAdmission}</div>
          </div>

          {/* 11. معاملات معادلات المرحلة الثانوية */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">معادلات الثانوية</span>
              <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 group-hover:scale-110 transition-transform shrink-0">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-indigo-600 dark:text-indigo-400">{data.secEq}</div>
          </div>

          {/* 12. معاملات معادلات المرحلة المتوسطة */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">معادلات المتوسطة</span>
              <div className="p-1 rounded-md bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 group-hover:scale-110 transition-transform shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-cyan-600 dark:text-cyan-400">{data.interEq}</div>
          </div>

          {/* 13. معاملات معادلات المرحلة الابتدائية */}
          <div 
            onClick={onOpenReport}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">معادلات الابتدائية</span>
              <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-600 group-hover:scale-110 transition-transform shrink-0">
                <FileBadge className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-black text-center text-teal-600 dark:text-teal-400">{data.primEq}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
