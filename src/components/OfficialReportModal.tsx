import React, { useState, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  Archive,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  LayoutTemplate,
  Sliders,
  Maximize2
} from 'lucide-react';
import { saveAs } from 'file-saver';
import {
  ReportExportData,
  analyzeIdealOrientation,
  exportReportToPdf,
  exportReportToWord,
  exportReportToExcel,
  exportReportAllFormats
} from '../utils/reportExporter';
import { getPortraitKlicheSvg, getLandscapeKlicheSvg } from '../utils/klicheAssets';

interface OfficialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportExportData;
  isDark?: boolean;
  isRtl?: boolean;
}

export const OfficialReportModal: React.FC<OfficialReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  isDark = false,
  isRtl = true
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'word' | 'excel'>('pdf');
  const [orientationMode, setOrientationMode] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [statusState, setStatusState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [previewTab, setPreviewTab] = useState<'visual' | 'data'>('visual');

  const previewContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Compute effective orientation
  const effectiveOrientation =
    orientationMode === 'auto'
      ? analyzeIdealOrientation({ ...reportData, orientation: 'auto' })
      : orientationMode;

  const isLandscape = effectiveOrientation === 'landscape';

  // Handler for exporting
  const handleExport = async (format: 'pdf' | 'word' | 'excel' | 'all') => {
    try {
      setStatusState('loading');
      setStatusMessage('جارٍ إعداد وتجهيز التقرير الرسمي...');

      const currentData: ReportExportData = {
        ...reportData,
        orientation: orientationMode
      };

      const safeReportNum = reportData.meta.reportNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      const baseFilename = `تقرير_وحدة_القبول_${safeReportNum}`;

      if (format === 'pdf') {
        const blob = await exportReportToPdf(currentData);
        saveAs(blob, `${baseFilename}.pdf`);
        setStatusState('success');
        setStatusMessage('تم إنشاء وتحميل ملف PDF بنجاح.');
      } else if (format === 'word') {
        const blob = await exportReportToWord(currentData);
        saveAs(blob, `${baseFilename}.docx`);
        setStatusState('success');
        setStatusMessage('تم إنشاء وتحميل مستند Word (.docx) بنجاح.');
      } else if (format === 'excel') {
        const blob = exportReportToExcel(currentData);
        saveAs(blob, `${baseFilename}.xlsx`);
        setStatusState('success');
        setStatusMessage('تم إنشاء وتحميل جدول Excel (.xlsx) بنجاح.');
      } else if (format === 'all') {
        const blob = await exportReportAllFormats(currentData);
        saveAs(blob, `${baseFilename}_حزمة_شاملة.zip`);
        setStatusState('success');
        setStatusMessage('تم تجميع وتصدير كافة الصيغ (PDF, Word, Excel) في ملف ZIP بنجاح.');
      }
    } catch (err: any) {
      console.error('Report export error:', err);
      setStatusState('error');
      setStatusMessage(
        format === 'excel'
          ? 'تعذر إنشاء ملف Excel، حاول مرة أخرى.'
          : format === 'word'
          ? 'تعذر إنشاء ملف Word، حاول مرة أخرى.'
          : 'حدث خطأ أثناء استخراج التقرير، يرجى المحاولة لاحقاً.'
      );
    }
  };

  const klicheSvg = isLandscape ? getLandscapeKlicheSvg() : getPortraitKlicheSvg();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-teal-800/30 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#218caa] via-[#2883a4] to-[#3078a6] p-5 sm:p-6 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <FileText className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-teal-500/30 text-teal-100 border border-teal-400/30 px-2.5 py-0.5 rounded-full">
                  وحدة القبول - إدارة التعليم بمنطقة المدينة المنورة
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                منظومة إخراج التقارير الرسمية المعتمدة
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid: Settings Panel on Left/Right & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          
          {/* Options Sidebar (4 cols) */}
          <div className="lg:col-span-4 p-5 sm:p-6 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-6">
            
            {/* Section: خيارات استخراج التقرير */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="w-4 h-4 text-[#218caa]" />
                <h3 className="text-sm font-black text-slate-900 dark:text-teal-200">
                  خيارات استخراج التقرير
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                حدد التنسيق والاتجاه المناسب لمخرجات التقرير الرسمي لوحدة القبول.
              </p>
            </div>

            {/* 1. Orientation Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                اتجاه التقرير والكليشة الرسمية:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientationMode('auto')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                    orientationMode === 'auto'
                      ? 'bg-[#218caa] text-white border-[#218caa] shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500'
                  }`}
                >
                  تلقائي وفق المحتوى
                </button>
                <button
                  type="button"
                  onClick={() => setOrientationMode('portrait')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                    orientationMode === 'portrait'
                      ? 'bg-[#218caa] text-white border-[#218caa] shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500'
                  }`}
                >
                  رأسي (Portrait)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientationMode('landscape')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                    orientationMode === 'landscape'
                      ? 'bg-[#218caa] text-white border-[#218caa] shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500'
                  }`}
                >
                  أفقي (Landscape)
                </button>
              </div>
              <div className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">
                {effectiveOrientation === 'landscape'
                  ? 'تم اعتماد الكليشة الأفقية (مناسبة للجداول الواسعة والمؤشرات متعددة الحقول).'
                  : 'تم اعتماد الكليشة الرأسية (مناسبة للملخص التنفيذي والخطابات الرسمية).'}
              </div>
            </div>

            {/* 2. Format Selection Tabs */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                صيغة الإخراج المطلوبة:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('pdf')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all border cursor-pointer ${
                    selectedFormat === 'pdf'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-400/20 font-black'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-5 h-5 text-rose-600" />
                  <span className="text-xs">PDF رسمي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFormat('word')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all border cursor-pointer ${
                    selectedFormat === 'word'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400/20 font-black'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <FileCode className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">Word (.docx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFormat('excel')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all border cursor-pointer ${
                    selectedFormat === 'excel'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/20 font-black'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs">Excel (RTL)</span>
                </button>
              </div>
            </div>

            {/* Direct Export Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                أزرار الاستخراج والتصدير الفوري:
              </label>

              <button
                type="button"
                onClick={() => handleExport(selectedFormat)}
                disabled={statusState === 'loading'}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#218caa] to-[#3078a6] hover:from-[#1b738e] hover:to-[#2883a4] text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {statusState === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>جارٍ إعداد التقرير...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-white" />
                    <span>
                      {selectedFormat === 'pdf'
                        ? 'تصدير PDF عالي الجودة 📄'
                        : selectedFormat === 'word'
                        ? 'تصدير Word قابل للتحرير 📝'
                        : 'تصدير Excel تحليلي 📊'}
                    </span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="py-2 px-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 dark:text-rose-300 border border-rose-300/40 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer"
                >
                  تصدير PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('word')}
                  className="py-2 px-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-300/40 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer"
                >
                  تصدير Word
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('excel')}
                  className="py-2 px-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer"
                >
                  تصدير Excel
                </button>
              </div>

              {/* Export All Formats ZIP */}
              <button
                type="button"
                onClick={() => handleExport('all')}
                disabled={statusState === 'loading'}
                className="w-full py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-400/40 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>تصدير جميع الصيغ (حزمة ZIP شاملة) 📦</span>
              </button>
            </div>

            {/* Status Feedback Banner */}
            {statusState !== 'idle' && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 border transition-all ${
                  statusState === 'loading'
                    ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800'
                    : statusState === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
                }`}
              >
                {statusState === 'loading' && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-600" />}
                {statusState === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
                {statusState === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span className="font-bold">{statusMessage}</span>
              </div>
            )}

            {/* Information Card */}
            <div className="bg-teal-50/60 dark:bg-teal-950/30 p-3.5 rounded-2xl border border-teal-200/60 dark:border-teal-800/40 text-[11px] text-teal-900 dark:text-teal-200 space-y-1.5 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-teal-950 dark:text-teal-100">
                <Sparkles className="w-3.5 h-3.5 text-[#218caa]" />
                <span>ضمانات الجودة والمطابقة:</span>
              </div>
              <ul className="list-disc pr-4 space-y-1 text-teal-800 dark:text-teal-300">
                <li>اللغة العربية باتجاه كامل وحقيقي RTL دون أي تشويه للأحرف أو الأرقام.</li>
                <li>استخدام الكليشة الرسمية المعتمدة لوحدة القبول بنسبة أبعادها الأصلية.</li>
                <li>بداية المحتوى أسفل الخط الفاصل لضمان عدم تغطية أي شعار رسمي.</li>
              </ul>
            </div>

          </div>

          {/* Live Preview Panel (8 cols) */}
          <div className="lg:col-span-8 p-5 sm:p-6 bg-slate-200/60 dark:bg-slate-950/70 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#218caa]" />
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  معاينة التقرير الرسمي ({effectiveOrientation === 'landscape' ? 'صفحة أفقية' : 'صفحة رأسية'})
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                {reportData.rows.length} سجلات مطابقة
              </span>
            </div>

            {/* Document Stage */}
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-x-auto">
              <div
                ref={previewContainerRef}
                className="bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 transition-all origin-top scale-[0.85] sm:scale-100"
                style={{
                  width: isLandscape ? '960px' : '680px',
                  minHeight: isLandscape ? '680px' : '960px',
                  padding: '24px 32px 32px 32px',
                  boxSizing: 'border-box',
                  fontFamily: "'Cairo', 'IBM Plex Sans Arabic', sans-serif"
                }}
              >
                {/* Official Kliche Header */}
                <div
                  className="w-full mb-4"
                  dangerouslySetInnerHTML={{ __html: klicheSvg }}
                />

                {/* Safe Content Zone: Starts below the separator line */}
                <div className="w-full text-right" dir="rtl">
                  
                  {/* Meta Bar */}
                  <div className="flex justify-between items-start border-b-2 border-slate-100 pb-3 mb-4">
                    <div>
                      <h1 className="text-lg font-black text-[#006C70] mb-0.5">
                        {reportData.meta.title}
                      </h1>
                      {reportData.meta.subtitle && (
                        <p className="text-xs text-slate-500 font-medium">
                          {reportData.meta.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="text-left text-[10px] text-slate-600 font-mono space-y-0.5">
                      <div><strong className="text-slate-800">رقم التقرير:</strong> <span className="font-bold text-[#006C70]" dir="ltr">{reportData.meta.reportNumber}</span></div>
                      <div><strong className="text-slate-800">التاريخ:</strong> {reportData.meta.hijriDate || new Date().toLocaleDateString('ar-SA')}</div>
                      <div><strong className="text-slate-800">الجهة:</strong> {reportData.meta.department}</div>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  {reportData.summaryItems && reportData.summaryItems.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      {reportData.summaryItems.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                          <div className="text-[10px] text-slate-500 font-bold">{item.label}</div>
                          <div className="text-sm font-black text-[#006C70] mt-0.5">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Narrative Text */}
                  {reportData.narrativeText && reportData.narrativeText.length > 0 && (
                    <div className="mb-4 bg-slate-50/50 p-3 rounded-lg border-r-4 border-[#006C70] text-xs text-slate-700 leading-relaxed space-y-1">
                      {reportData.narrativeText.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                  )}

                  {/* Data Table */}
                  {reportData.rows && reportData.rows.length > 0 && (
                    <div className="overflow-x-auto mb-4 border border-slate-200 rounded-lg">
                      <table className="w-full text-[11px] text-right border-collapse">
                        <thead>
                          <tr className="bg-[#006C70] text-white">
                            <th className="p-2 border border-[#004d4f] text-center w-8">م</th>
                            {reportData.columns.map((c, i) => (
                              <th key={i} className="p-2 border border-[#004d4f] font-bold">
                                {c.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.rows.slice(0, 15).map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-1.5 border border-slate-200 text-center font-bold text-slate-400">
                                {rIdx + 1}
                              </td>
                              {reportData.columns.map((col, cIdx) => (
                                <td key={cIdx} className="p-1.5 border border-slate-200 text-slate-800">
                                  {row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.rows.length > 15 && (
                        <div className="p-1.5 text-center text-[10px] text-slate-500 bg-slate-100 border-t border-slate-200 font-medium">
                          عرض أول 15 سجل في المعاينة (يتم تصدير كافة السجلات البالغ عددها {reportData.rows.length} في الملف النهائي)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signatures */}
                  <div className="mt-6 pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-[10px] font-bold text-[#006C70] mb-0.5">مُعدّ التقرير:</div>
                      <div className="font-black text-slate-800">{reportData.meta.preparer}</div>
                      <div className="text-[10px] text-slate-500">{reportData.meta.department}</div>
                    </div>
                    <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                      <div className="text-[10px] font-bold text-[#006C70] mb-0.5">اعتماد صاحب الصلاحية:</div>
                      <div className="font-black text-slate-800">{reportData.meta.approver}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">معتمد إلكترونياً ورسمياً ✓</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
