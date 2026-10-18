import React, { useState, useMemo, useEffect } from 'react';
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  User, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Star, 
  Send, 
  ShieldCheck, 
  Filter, 
  Download, 
  Calendar, 
  Trash2, 
  AlertCircle,
  Eye,
  Edit3,
  Inbox,
  UserCheck,
  Undo2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BeneficiaryInquiry, OfficerUser, isSystemAdmin, ADMIN_CREDENTIALS } from '../types';
import { updateInquiryRealtime } from '../utils/realtimeEngine';

interface AdmissionInquiriesViewProps {
  inquiries: BeneficiaryInquiry[];
  onUpdateInquiries: (inquiries: BeneficiaryInquiry[]) => void;
  activeOfficer: OfficerUser;
  isDark?: boolean;
  isRtl?: boolean;
  defaultTab?: 'general' | 'my_claimed' | 'all';
  onNavigateToRequests?: () => void;
}

export default function AdmissionInquiriesView({
  inquiries,
  onUpdateInquiries,
  activeOfficer,
  isDark = false,
  isRtl = true,
  defaultTab = 'general',
  onNavigateToRequests
}: AdmissionInquiriesViewProps) {
  // Navigation View: 'general' (شاشة الاستفسارات العامة), 'my_claimed' (استفسارات المسؤول المستلمة), 'all' (الكل)
  const [viewMode, setViewMode] = useState<'general' | 'my_claimed' | 'all'>(defaultTab);

  // Sync tab if parent changes it
  useEffect(() => {
    if (defaultTab) {
      setViewMode(defaultTab);
    }
  }, [defaultTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // صلاحية مدير النظام (الأدمن) حصرية فقط للأستاذ سالم محمد الترجمي (السجل: 1068575628 / الجوال: 0553512200)
  // بقية المستخدمين لا يملكون صلاحية الأدمن نهائياً
  const isAdmin = isSystemAdmin(activeOfficer);

  // Normalization for Arabic search
  const normalize = (txt: string) => {
    return (txt || '')
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ');
  };

  // Counts
  const totalCount = inquiries.length;
  // General/unclaimed inquiries (not yet claimed by anyone and not answered - شاشة الاستفسارات الرئيسية)
  const generalUnclaimedCount = inquiries.filter(i => !i.claimedByOfficerId && i.status !== 'claimed' && i.status !== 'answered').length;
  // Inquiries claimed by this specific active officer
  const myClaimedInquiries = inquiries.filter(i => 
    i.claimedByOfficerId === activeOfficer.id || 
    (i.answeredByOfficerId === activeOfficer.id && !i.claimedByOfficerId)
  );
  const myClaimedTotalCount = myClaimedInquiries.length;
  const myClaimedPendingCount = myClaimedInquiries.filter(i => i.status !== 'answered').length;
  const myClaimedAnsweredCount = myClaimedInquiries.filter(i => i.status === 'answered').length;
  const allAnsweredCount = inquiries.filter(i => i.status === 'answered').length;

  // Filtered dataset based on viewMode, search, and status
  const displayedInquiries = useMemo(() => {
    return inquiries.filter(item => {
      // 1. ViewMode filter
      if (viewMode === 'general') {
        // شاشة الاستفسارات الرئيسية: يختفي منها الاستفسار تماماً بمجرد استلامه من قبل المسؤول أو الإجابة عليه
        if (item.claimedByOfficerId || item.status === 'claimed' || item.status === 'answered') {
          return false;
        }
      } else if (viewMode === 'my_claimed') {
        // استفسارات المسؤول المستلمة: يظهر فقط ما استلمه هذا المسؤول النشط
        const isMine = item.claimedByOfficerId === activeOfficer.id || 
                       (item.answeredByOfficerId === activeOfficer.id && !item.claimedByOfficerId);
        if (!isMine) return false;
      }
      // 'all' shows all

      // 2. Status filter
      if (statusFilter === 'pending') {
        if (item.status === 'answered') return false;
      } else if (statusFilter === 'answered') {
        if (item.status !== 'answered') return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = normalize(searchQuery);
        const matchName = normalize(item.senderName).includes(q);
        const matchText = normalize(item.inquiryText).includes(q);
        const matchPhone = item.senderPhone && item.senderPhone.includes(searchQuery);
        const matchAnswerer = item.answeredByOfficerName && normalize(item.answeredByOfficerName).includes(q);
        const matchClaimer = item.claimedByOfficerName && normalize(item.claimedByOfficerName).includes(q);
        if (!matchName && !matchText && !matchPhone && !matchAnswerer && !matchClaimer) {
          return false;
        }
      }

      return true;
    });
  }, [inquiries, viewMode, statusFilter, searchQuery, activeOfficer.id]);

  // Handle Claiming an Inquiry (خيار استلام الاستفسار لمسؤول القبول)
  const handleClaimInquiry = (inquiryId: string) => {
    const now = new Date().toISOString();
    const targetInq = inquiries.find(i => i.id === inquiryId);
    const updated = inquiries.map(item => {
      if (item.id === inquiryId) {
        const claimObj = {
          ...item,
          status: 'claimed' as const,
          claimedByOfficerId: activeOfficer.id,
          claimedByOfficerName: activeOfficer.nameAr,
          claimedAt: now
        };
        // Real-time server sync
        updateInquiryRealtime(inquiryId, claimObj).catch(() => {});
        return claimObj;
      }
      return item;
    });

    onUpdateInquiries(updated);
    // Transition to the claimed inquiries icon / tab immediately as requested
    setViewMode('my_claimed');
    setToastMessage(`✓ تم استلام الاستفسار واختفاؤه من شاشة الاستفسارات الرئيسية وانتقاله بنجاح إلى (استفساراتك المستلمة) للمسؤول [${activeOfficer.nameAr}]`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Handle Unclaiming / Returning to general pool (إلغاء الاستلام وإعادة للاستفسارات العامة)
  const handleUnclaimInquiry = (inquiryId: string) => {
    if (!confirm('هل تريد إلغاء استلام هذا الاستفسار وإعادته إلى شاشة الاستفسارات العامة ليتسنى لمسؤول آخر استلامه؟')) {
      return;
    }

    const updated = inquiries.map(item => {
      if (item.id === inquiryId) {
        const copy = { ...item };
        delete copy.claimedByOfficerId;
        delete copy.claimedByOfficerName;
        delete copy.claimedAt;
        if (copy.status === 'claimed') {
          copy.status = 'new';
        }
        updateInquiryRealtime(inquiryId, {
          claimedByOfficerId: undefined,
          claimedByOfficerName: undefined,
          claimedAt: undefined,
          status: copy.status
        }).catch(() => {});
        return copy;
      }
      return item;
    });

    onUpdateInquiries(updated);
    setToastMessage('تم إلغاء استلام الاستفسار وإعادته إلى شاشة الاستفسارات العامة بنجاح.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Submitting Reply
  const handleSendReply = (inquiryId: string) => {
    if (!replyText.trim()) {
      alert('الرجاء كتابة نص الإجابة قبل الإرسال.');
      return;
    }

    const now = new Date().toISOString();
    const updated = inquiries.map(item => {
      if (item.id === inquiryId) {
        const replyObj = {
          ...item,
          status: 'answered' as const,
          answeredByOfficerId: activeOfficer.id,
          answeredByOfficerName: activeOfficer.nameAr,
          officerReply: replyText.trim(),
          answeredAt: now,
          // Ensure it also has claim details if not present
          claimedByOfficerId: item.claimedByOfficerId || activeOfficer.id,
          claimedByOfficerName: item.claimedByOfficerName || activeOfficer.nameAr,
          claimedAt: item.claimedAt || now
        };
        // Real-time server sync
        updateInquiryRealtime(inquiryId, replyObj).catch(() => {});
        return replyObj;
      }
      return item;
    });

    onUpdateInquiries(updated);
    setActiveReplyId(null);
    setReplyText('');
    setToastMessage(`✓ تم إرسال الإجابة بنجاح! ستظهر فوراً للمستفيد باسم (${activeOfficer.nameAr}) وموثقة بالأوقات.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Handle Deleting an Inquiry
  const handleDeleteInquiry = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الاستفسار نهائياً من النظام؟')) {
      const updated = inquiries.filter(i => i.id !== id);
      onUpdateInquiries(updated);
      setToastMessage('تم حذف الاستفسار بنجاح.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Handle Delete All Inquiries (صلاحية حصرية لمدير النظام أ. سالم محمد الترجمي لحذف جميع الاستفسارات)
  const handleDeleteAllInquiries = () => {
    if (!isAdmin) {
      alert('عذراً، صلاحية حذف جميع الاستفسارات مقتصرة حصرياً على مدير النظام (الأستاذ سالم محمد الترجمي - السجل المدني: 1068575628).');
      return;
    }

    const count = inquiries.length;
    onUpdateInquiries([]);
    setShowDeleteAllModal(false);
    setToastMessage(`✓ تم حذف جميع الاستفسارات بالكامل (${count} استفسار) نهائياً بواسطة مدير النظام [${activeOfficer.nameAr}].`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Export to Excel (صلاحية حصرية للأدمن أ. سالم محمد الترجمي)
  const handleExportExcel = () => {
    if (!isSystemAdmin(activeOfficer)) {
      alert('عذراً، تصدير النتائج مقتصر حصرياً على مدير النظام (الأدمن) أ. سالم محمد الترجمي.');
      return;
    }
    const sanitize = (str: string | undefined | null) => {
      if (!str) return '---';
      const t = str.trim();
      return ['=', '+', '-', '@'].some(c => t.startsWith(c)) ? `'${t}` : t;
    };

    const data = displayedInquiries.map((inq, idx) => ({
      '#': idx + 1,
      'اسم صاحب الاستفسار': sanitize(inq.senderName),
      'رقم الجوال': sanitize(inq.senderPhone),
      'نص الاستفسار': sanitize(inq.inquiryText),
      'وقت إرسال الاستفسار': new Date(inq.createdAt).toLocaleString('ar-SA'),
      'حالة الاستفسار': inq.status === 'answered' ? 'تمت الإجابة' : inq.status === 'claimed' ? 'مستلم من مسؤول' : 'جديد عام',
      'مسؤول القبول المستلم': sanitize(inq.claimedByOfficerName),
      'وقت الاستلام': inq.claimedAt ? new Date(inq.claimedAt).toLocaleString('ar-SA') : 'لم يُستلم بعد',
      'مسؤول القبول المجيب': sanitize(inq.answeredByOfficerName),
      'نص الإجابة': sanitize(inq.officerReply),
      'وقت الإجابة': inq.answeredAt ? new Date(inq.answeredAt).toLocaleString('ar-SA') : 'لم يُجب بعد',
      'تقييم المستفيد للخدمة (1-5)': inq.beneficiaryRating ? `${inq.beneficiaryRating} نجوم` : 'لم يُقيّم بعد',
      'ملاحظات تقييم المستفيد': sanitize(inq.beneficiaryFeedbackNotes)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!views'] = [{ RTL: true }];
    const wb = XLSX.utils.book_new();
    const sheetTitle = viewMode === 'my_claimed' ? 'استفسارات المسؤول المستلمة' : 'استفسارات القبول';
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
    XLSX.writeFile(wb, `admission_inquiries_${viewMode}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in dir-rtl" style={{ direction: 'rtl' }}>
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#009688] text-white px-6 py-3.5 rounded-2xl shadow-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 border-2 border-emerald-300 animate-bounce max-w-lg text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Live Real-time Status Banner */}
      <div className="flex items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2.5 text-xs font-black">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span>المزامنة اللحظية المباشرة نشطة: أي استفسار يرسله المستفيد سيصل لحسابك فوراً دون الحاجة لتحديث الصفحة</span>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
          بث فوري مباشر
        </span>
      </div>

      {/* Quick Navigation to Requests Screen */}
      {onNavigateToRequests && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-teal-50/90 dark:bg-teal-950/30 border border-teal-200/90 dark:border-teal-900/40">
          <div className="flex items-center gap-2 text-xs font-black text-teal-900 dark:text-teal-200">
            <span className="w-2 h-2 rounded-full bg-[#009688] animate-pulse"></span>
            <span>أنت تتصفح الآن: <strong>شاشة الاستفسارات والتواصل</strong></span>
          </div>
          <button
            type="button"
            onClick={onNavigateToRequests}
            className="px-4 py-2 bg-[#009688] hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            title="الانتقال إلى شاشة طلبات القبول والتسجيل والنقل"
          >
            <Send className="w-4 h-4" />
            <span>الانتقال لشاشة طلبات القبول والتسجيل والنقل</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        isDark ? 'bg-[#081e2b] border-teal-800/30' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم صاحب الاستفسار، نص الاستفسار، رقم الجوال، أو المسؤول المجيب..."
            className="w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-teal-800/40 bg-slate-50 dark:bg-[#0b2336] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#009688]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-black text-slate-500 dark:text-teal-300">تصفية الحالة:</span>
          {(['all', 'pending', 'answered'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#009688] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#0b2336] text-slate-600 dark:text-teal-400 hover:bg-slate-200 dark:hover:bg-teal-900/40'
              }`}
            >
              {st === 'all' && `الكل (${displayedInquiries.length})`}
              {st === 'pending' && `بانتظار الإجابة`}
              {st === 'answered' && `تمت الإجابة`}
            </button>
          ))}
          {isAdmin && inquiries.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-black bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
              title="صلاحية حصرية لمدير النظام (أ. سالم محمد الترجمي): حذف جميع الاستفسارات"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>حذف جميع الاستفسارات ({inquiries.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Tab Header Indicator */}
      <div className="flex items-center justify-between px-2 text-xs font-black text-slate-600 dark:text-teal-300">
        <div className="flex items-center gap-2">
          {viewMode === 'general' && (
            <>
              <Inbox className="w-4 h-4 text-amber-500" />
              <span>أنت الآن في: <strong className="text-teal-700 dark:text-teal-300">شاشة الاستفسارات العامة</strong> (اختر "استلام الاستفسار" لنقله إلى استفساراتك المستلمة)</span>
            </>
          )}
          {viewMode === 'my_claimed' && (
            <>
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>أنت الآن في: <strong className="text-teal-700 dark:text-teal-300">أيقونة استفسارات المسؤول المستلمة</strong> (الاستفسارات المسندة إلى {activeOfficer.nameAr})</span>
            </>
          )}
          {viewMode === 'all' && (
            <>
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>أنت الآن في: <strong className="text-teal-700 dark:text-teal-300">سجل كافة الاستفسارات العامة والمستلمة والمجابة</strong></span>
            </>
          )}
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          عدد النتائج: {displayedInquiries.length}
        </span>
      </div>

      {/* Inquiries Cards List */}
      <div className="space-y-4">
        {displayedInquiries.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-teal-800/40 text-slate-400 font-bold space-y-2">
            <p>لا توجد استفسارات في هذا القسم مطابقة للبحث أو التصفية الحالية.</p>
            {viewMode === 'my_claimed' && (
              <p className="text-xs text-teal-600 dark:text-teal-400">
                يمكنك التوجه إلى <button onClick={() => setViewMode('general')} className="underline font-black cursor-pointer">شاشة الاستفسارات العامة</button> لاستلام استفسار جديد.
              </p>
            )}
          </div>
        ) : (
          displayedInquiries.map((inq) => {
            const isAnswered = inq.status === 'answered' && Boolean(inq.officerReply);
            const isClaimedByMe = inq.claimedByOfficerId === activeOfficer.id;
            const isClaimedByOther = inq.claimedByOfficerId && inq.claimedByOfficerId !== activeOfficer.id;
            const isReplying = activeReplyId === inq.id;

            return (
              <div
                key={inq.id}
                className={`p-5 sm:p-6 rounded-3xl border-2 transition-all space-y-4 shadow-sm ${
                  isAnswered
                    ? 'bg-white dark:bg-[#081e2b] border-emerald-500/40'
                    : isClaimedByMe
                      ? 'bg-emerald-50/40 dark:bg-[#07242c] border-emerald-400/80 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-amber-50/40 dark:bg-[#0c2229] border-amber-400/50'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-teal-800/40 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${
                      isAnswered 
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                        : isClaimedByMe
                          ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {inq.senderName}
                        </h4>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-teal-300">
                          (صاحب الاستفسار)
                        </span>
                      </div>
                      {inq.senderPhone && (
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 dir-ltr inline-block">
                          📞 {inq.senderPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Timestamp when sent by beneficiary (الوقت المرسل من قبل المستفيد للاستفسار) */}
                    <div className="text-right text-xs bg-slate-100 dark:bg-[#0b2434] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-teal-800/30">
                      <span className="text-[10px] text-slate-400 font-bold block">وقت إرسال الاستفسار:</span>
                      <span className="font-mono font-black text-slate-800 dark:text-white">
                        {new Date(inq.createdAt).toLocaleString('ar-SA')}
                      </span>
                    </div>

                    {/* Claim Status Badge */}
                    {inq.claimedByOfficerName && (
                      <div className="text-right text-xs bg-emerald-50 dark:bg-[#07252f] px-3.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">
                          مستلم بواسطة:
                        </span>
                        <span className="font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{inq.claimedByOfficerName} {isClaimedByMe ? '(أنت)' : ''}</span>
                        </span>
                      </div>
                    )}

                    {/* Overall Status Badge */}
                    {isAnswered ? (
                      <span className="px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>تمت الإجابة</span>
                      </span>
                    ) : inq.status === 'claimed' ? (
                      <span className="px-3 py-1.5 rounded-full text-xs font-black bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 flex items-center gap-1.5 shadow-2xs">
                        <UserCheck className="w-4 h-4 text-teal-600" />
                        <span>مستلم قيد المعالجة</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>عام جديد بانتظار الاستلام</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteInquiry(inq.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                      title="حذف الاستفسار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Body */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#061824] border border-slate-200 dark:border-teal-900/40 space-y-1.5">
                  <span className="text-[11px] font-black text-slate-500 dark:text-teal-300 block">
                    💬 نص الاستفسار من المستفيد:
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {inq.inquiryText}
                  </p>
                </div>

                {/* Claim action button when not claimed yet (مطلوب: اضف خيار استلام الاستفسار لمسؤول القبول لينتقل من شاشة الاستفسارات الى ايقونة استفسارات المسؤول المستلمة) */}
                {!inq.claimedByOfficerId && !isAnswered && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      هذا الاستفسار معروض في شاشة الاستفسارات العامة ولم يستلمه أي مسؤول بعد.
                    </div>
                    <button
                      onClick={() => handleClaimInquiry(inq.id)}
                      className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-200" />
                      <span>استلام الاستفسار والانتقال لاستفساراتي المستلمة 📥</span>
                    </button>
                  </div>
                )}

                {/* If claimed by another officer */}
                {isClaimedByOther && !isAnswered && (
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-between">
                    <span>
                      📌 تم استلام هذا الاستفسار من قبل الزميل المسؤول: <strong className="font-black text-teal-700 dark:text-teal-300">{inq.claimedByOfficerName}</strong>
                    </span>
                    {inq.claimedAt && (
                      <span className="text-[11px] text-slate-400">
                        بتاريخ: {new Date(inq.claimedAt).toLocaleString('ar-SA')}
                      </span>
                    )}
                  </div>
                )}

                {/* Answered Section or Reply Workflow */}
                {isAnswered ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-[#07242c] border-2 border-emerald-400 dark:border-emerald-700/60 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-300/60 dark:border-emerald-800/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-200">
                          الإجابة المعتمدة لمسؤول القبول:
                        </span>
                        {/* المطلوب: تظهر الاجابة في حساب المستفيد باسم المسؤول الذي اجاب عليها */}
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-xs font-black shadow-2xs">
                          {inq.answeredByOfficerName}
                        </span>
                      </div>

                      {/* المطلوب: الوقت المجاب عليه من قبل المسؤول */}
                      {inq.answeredAt && (
                        <div className="text-right text-xs bg-white/80 dark:bg-[#0b2434] px-3 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800">
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                            وقت الإجابة: {new Date(inq.answeredAt).toLocaleString('ar-SA')}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      {inq.officerReply}
                    </p>

                    {/* Beneficiary Rating display if available */}
                    <div className="pt-2.5 border-t border-emerald-300/40 dark:border-emerald-800/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        <span className="font-black text-emerald-950 dark:text-emerald-200">
                          تقييم المستفيد للخدمة:
                        </span>
                        {inq.beneficiaryRating ? (
                          <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            ({inq.beneficiaryRating} من 5 نجوم ⭐)
                            {inq.beneficiaryFeedbackNotes && (
                              <span className="text-slate-600 dark:text-slate-300 font-bold mr-2">
                                - "{inq.beneficiaryFeedbackNotes}"
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 font-bold">
                            بانتظار تقييم المستفيد عند مراجعته للإجابة
                          </span>
                        )}
                      </div>

                      {/* Edit Reply Button */}
                      <button
                        onClick={() => {
                          setActiveReplyId(inq.id);
                          setReplyText(inq.officerReply || '');
                        }}
                        className="text-xs font-black text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل الإجابة</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Reply Form or Action Controls (When claimed by this officer or answering) */}
                {(!isAnswered || isReplying) && (
                  <div>
                    {!isReplying ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => {
                            setActiveReplyId(inq.id);
                            setReplyText(inq.officerReply || '');
                          }}
                          className="px-5 py-2.5 bg-[#009688] hover:bg-[#00796b] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                        >
                          <Send className="w-4 h-4" />
                          <span>كتابة الإجابة على الاستفسار</span>
                        </button>

                        {/* Option to release / unclaim inquiry if claimed by current officer */}
                        {isClaimedByMe && !isAnswered && (
                          <button
                            onClick={() => handleUnclaimInquiry(inq.id)}
                            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                            title="إلغاء الاستلام وإعادته للشاشة العامة"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>إلغاء الاستلام وإعادة للاستفسارات العامة</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a2333] border-2 border-[#009688] space-y-3 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Send className="w-4 h-4 text-[#009688]" />
                            <span>كتابة رد مسؤول القبول ({activeOfficer.nameAr}):</span>
                          </span>
                          <button
                            onClick={() => setActiveReplyId(null)}
                            className="text-xs text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>

                        <textarea
                          rows={4}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="اكتب الإجابة الوافية والتوجيه المناسب للمستفيد هنا... (ستظهر فوراً للمستفيد في حسابه باسمك مع توثيق وقت الإجابة وتقييم الخدمة)"
                          className="w-full p-3.5 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-teal-800 bg-slate-50 dark:bg-[#071926] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#009688] leading-relaxed"
                        />

                        <div className="flex items-center justify-end gap-3 pt-1">
                          <button
                            onClick={() => setActiveReplyId(null)}
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            onClick={() => handleSendReply(inq.id)}
                            className="px-6 py-2.5 bg-gradient-to-r from-[#009688] to-[#044337] hover:brightness-110 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                          >
                            <Send className="w-4 h-4 text-emerald-300" />
                            <span>اعتماد وإرسال الإجابة للمستفيد</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Admin to Delete All Inquiries */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in dir-rtl" style={{ direction: 'rtl' }}>
          <div className={`w-full max-w-lg p-6 sm:p-7 rounded-3xl border-2 shadow-2xl space-y-5 animate-scale-up ${
            isDark ? 'bg-[#081e2b] border-rose-800 text-white' : 'bg-white border-rose-300 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-600 dark:text-rose-400">
                  تأكيد حذف جميع الاستفسارات نهائياً
                </h3>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  صلاحية حصرية لمدير النظام (أ. سالم محمد الترجمي - السجل المدني: 1068575628)
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-200 leading-relaxed">
              <p>
                ⚠️ <strong>تحذير هام:</strong> هذا الإجراء سيقوم بحذف كافة الاستفسارات المسجلة في النظام والبالغ عددها <strong>({inquiries.length}) استفسار</strong> بشكل نهائي ولا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
              </p>
              <div className="pt-2 border-t border-rose-200 dark:border-rose-900/50 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                <div>• استفسارات عامة غير مستلمة: <strong>{generalUnclaimedCount}</strong></div>
                <div>• استفسارات تمت الإجابة عليها: <strong>{allAnsweredCount}</strong></div>
                <div>• استفسارات قيد المعالجة من قبل مسؤولي القبول: <strong>{inquiries.length - generalUnclaimedCount - allAnsweredCount}</strong></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                إلغاء الأمر وتراجع
              </button>
              <button
                type="button"
                onClick={handleDeleteAllInquiries}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-rose-200" />
                <span>نعم، تأكيد حذف جميع الاستفسارات ({inquiries.length}) نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
