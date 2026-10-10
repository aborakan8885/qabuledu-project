import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  Send, 
  User, 
  Phone, 
  Clock, 
  Star, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  ArrowLeft, 
  Sparkles, 
  X,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { BeneficiaryInquiry } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface InquiriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiries: BeneficiaryInquiry[];
  onAddInquiry: (inquiry: Omit<BeneficiaryInquiry, 'id' | 'createdAt' | 'status'>) => void;
  onRateInquiry: (id: string, rating: number, notes?: string) => void;
  isDark?: boolean;
  isRtl?: boolean;
}

export default function InquiriesModal({
  isOpen,
  onClose,
  inquiries,
  onAddInquiry,
  onRateInquiry,
  isDark = false,
  isRtl = true
}: InquiriesModalProps) {
  // Tab: 'ask' (الاستفسار) or 'track' (متابعة الاستفسار بالاسم فقط)
  const [activeTab, setActiveTab] = useState<'ask' | 'track'>('ask');

  // Submit Inquiry Form State
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [inquiryText, setInquiryText] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Track Inquiry State (فقط بكتابة الاسم المكتوب لصاحب الاستفسار فقط)
  const [trackName, setTrackName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Rating State
  const [ratingHover, setRatingHover] = useState<Record<string, number>>({});
  const [ratingSelected, setRatingSelected] = useState<Record<string, number>>({});
  const [ratingNotes, setRatingNotes] = useState<Record<string, string>>({});
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Normalization for robust name search
  const normalize = (txt: string) => {
    return (txt || '')
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ');
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!senderName.trim()) {
      setSubmitError('الرجاء إدخال اسم صاحب الاستفسار كاملاً.');
      return;
    }
    if (!inquiryText.trim()) {
      setSubmitError('الرجاء كتابة نص الاستفسار بالتفصيل.');
      return;
    }

    onAddInquiry({
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim() || undefined,
      inquiryText: inquiryText.trim()
    });

    setSubmitSuccess(true);
    setInquiryText('');
    setTrackName(senderName.trim());
    setHasSearched(true);
  };

  // Matched Inquiries by Beneficiary Name only
  const matchedInquiries = trackName.trim()
    ? inquiries.filter(item => {
        const itemNorm = normalize(item.senderName);
        const searchNorm = normalize(trackName);
        return itemNorm.includes(searchNorm) || searchNorm.includes(itemNorm);
      })
    : [];

  const handleRatingSubmit = (inquiryId: string) => {
    const starCount = ratingSelected[inquiryId] || 5;
    const notes = ratingNotes[inquiryId] || '';

    onRateInquiry(inquiryId, starCount, notes);
    setRatingSuccessMsg(`تم إرسال تقييمك (${starCount} من 5 نجوم) بنجاح. شكراً لاهتمامك! ⭐`);
    setTimeout(() => setRatingSuccessMsg(null), 3500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md animate-fade-in dir-rtl"
      style={{ direction: 'rtl' }}
    >
      <div 
        className={`relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-all ${
          isDark 
            ? 'bg-[#06202f] border-teal-800/60 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#009688] via-[#0d624e] to-[#044337] text-white shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl border border-white/20 backdrop-blur-md shadow-xs">
              <HelpCircle className="w-6 h-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  الاستفسارات والتواصل
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950">
                  وحدة القبول
                </span>
              </div>
              <p className="text-[11px] text-teal-100 font-medium mt-0.5">
                خدمة مخصصة لتقديم الاستفسارات ومتابعتها وتقييم الإجابة من قبل المستفيد
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/15"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (الاستفسار / متابعة الاستفسار) */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#071a26] border-b border-slate-200 dark:border-teal-900/40 shrink-0">
          <div className="grid grid-cols-2 gap-2 max-w-md mx-auto p-1 bg-slate-200/70 dark:bg-[#0b2b3f] rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('ask');
                setSubmitSuccess(false);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'ask'
                  ? 'bg-[#009688] text-white shadow-md'
                  : 'text-slate-600 dark:text-teal-300 hover:bg-slate-300/50 dark:hover:bg-teal-950/40'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>تقديم استفسار</span>
            </button>

            <button
              onClick={() => setActiveTab('track')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-[#009688] text-white shadow-md'
                  : 'text-slate-600 dark:text-teal-300 hover:bg-slate-300/50 dark:hover:bg-teal-950/40'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>متابعة الاستفسار بالاسم</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {ratingSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{ratingSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: تقديم استفسار */}
          {activeTab === 'ask' && (
            <div className="space-y-5 animate-fade-in">
              <div className={`p-4 rounded-2xl border ${
                isDark 
                  ? 'bg-teal-950/20 border-teal-800/40 text-teal-200' 
                  : 'bg-teal-50/80 border-teal-200 text-teal-900'
              }`}>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm leading-relaxed">
                    <strong className="font-black block text-sm mb-1">تعليمات تقديم الاستفسار:</strong>
                    يرجى كتابة اسمك الكريم بصورة صحيحة لتتمكن لاحقاً من متابعة الاستفسار ورؤية رد مسؤول القبول وتقييم الخدمة عبر كتابة اسمك فقط.
                  </div>
                </div>
              </div>

              {submitSuccess ? (
                <div className="p-8 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-3xl animate-fade-in">
                  <CheckCircle2 className="w-14 h-14 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
                  <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                    تم إرسال استفسارك بنجاح لمسؤولي القبول!
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-bold max-w-md mx-auto">
                    سيقوم مسؤول القبول بالرد على استفسارك في أقرب وقت. يمكنك متابعة الاستفسار في أي وقت بكتابة اسمك (<strong className="underline">{senderName}</strong>) في خيار "متابعة الاستفسار".
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black mb-1.5 text-slate-800 dark:text-slate-200">
                        اسم صاحب الاستفسار (المستفيد) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                        <input
                          type="text"
                          required
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="أدخل الاسم الثنائي أو الثلاثي..."
                          className="w-full pr-10 pl-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-teal-800/50 bg-white dark:bg-[#0b2434] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#009688] outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        ستتم متابعة الاستفسار بهذا الاسم تحديداً.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black mb-1.5 text-slate-800 dark:text-slate-200">
                        رقم الجوال للتواصل <span className="text-slate-400 text-[10px] font-normal">(اختياري)</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                        <input
                          type="tel"
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="05xxxxxxxx"
                          className="w-full pr-10 pl-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-teal-800/50 bg-white dark:bg-[#0b2434] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#009688] outline-none dir-ltr text-right"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black mb-1.5 text-slate-800 dark:text-slate-200">
                      نص الاستفسار <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={inquiryText}
                      onChange={(e) => setInquiryText(e.target.value)}
                      placeholder="اكتب استفسارك بالتفصيل حول القبول، التسكين، نقل الطلاب، الشواغر، أو أي موضوع ترغب بالاستفسار عنه من مسؤولي القبول..."
                      className="w-full p-3.5 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-teal-800/50 bg-white dark:bg-[#0b2434] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#009688] outline-none leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-7 py-3 bg-gradient-to-r from-[#009688] via-[#0d624e] to-[#044337] hover:brightness-110 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                    >
                      <Send className="w-4 h-4 text-emerald-300" />
                      <span>إرسال الاستفسار لمسؤول القبول</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: متابعة الاستفسار بالاسم فقط */}
          {activeTab === 'track' && (
            <div className="space-y-6 animate-fade-in">
              {/* Search Box by Name Only as strictly required */}
              <div className={`p-5 rounded-2xl border ${
                isDark 
                  ? 'bg-[#082233] border-teal-800/50' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <label className="block text-xs sm:text-sm font-black mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#009688]" />
                  <span>اكتب اسم صاحب الاستفسار للمتابعة:</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    <input
                      type="text"
                      value={trackName}
                      onChange={(e) => {
                        setTrackName(e.target.value);
                        setHasSearched(true);
                      }}
                      placeholder="أدخل الاسم المكتوب في الاستفسار (مثال: عبدالله أو فاطمة)..."
                      className="w-full pr-10 pl-3.5 py-3 text-xs sm:text-sm font-black rounded-xl border border-slate-300 dark:border-teal-800/50 bg-white dark:bg-[#0b2434] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#009688] outline-none shadow-xs"
                    />
                  </div>
                  {trackName && (
                    <button
                      type="button"
                      onClick={() => setTrackName('')}
                      className="px-4 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-300 transition-all cursor-pointer"
                    >
                      مسح
                    </button>
                  )}
                </div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-teal-300/80 mt-2">
                  ℹ️ تكون المتابعة فقط بكتابة الاسم المكتوب لصاحب الاستفسار دون الحاجة لأي بيانات أخرى.
                </p>
              </div>

              {/* Inquiry Results */}
              {trackName.trim().length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-bold">
                  يرجى كتابة اسم صاحب الاستفسار أعلاه لعرض الاستفسارات وحالتها وإجابات مسؤولي القبول.
                </div>
              ) : matchedInquiries.length === 0 ? (
                <div className="p-8 text-center bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-amber-800 dark:text-amber-200 text-xs sm:text-sm font-black">
                  لم يتم العثور على أي استفسارات مسجلة باسم "{trackName}". تأكد من كتابة الاسم كما أُدخل عند تقديم الاستفسار.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-xs font-black text-slate-500 dark:text-teal-300 flex items-center justify-between">
                    <span>عدد الاستفسارات المطابقة: ({matchedInquiries.length})</span>
                    <span>صاحب الاستفسار: {trackName}</span>
                  </div>

                  {matchedInquiries.map((inq) => {
                    const isAnswered = inq.status === 'answered' && inq.officerReply;
                    const isRated = Boolean(inq.beneficiaryRating);

                    return (
                      <div
                        key={inq.id}
                        className={`p-5 rounded-3xl border-2 transition-all space-y-4 shadow-sm ${
                          isAnswered
                            ? 'bg-emerald-50/40 dark:bg-[#07242d] border-emerald-500/50'
                            : 'bg-white dark:bg-[#0b2434] border-slate-200 dark:border-teal-800/40'
                        }`}
                      >
                        {/* Status Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-teal-800/30 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {inq.senderName}
                            </span>
                            {inq.senderPhone && (
                              <span className="text-[10px] text-slate-400 font-mono dir-ltr">
                                ({inq.senderPhone})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isAnswered ? (
                              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>تمت الإجابة من مسؤول القبول</span>
                              </span>
                            ) : inq.claimedByOfficerName ? (
                              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 flex items-center gap-1.5 shadow-2xs">
                                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                                <span>مستلم من مسؤول القبول ({inq.claimedByOfficerName})</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
                                <span>قيد انتظار الاستلام والإجابة</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Claimed notice if claimed but not answered yet */}
                        {inq.claimedByOfficerName && !isAnswered && (
                          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-[#07252f] border border-teal-200 dark:border-teal-800/60 text-teal-950 dark:text-teal-200 text-xs font-bold flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
                              <span>تم استلام استفسارك من قبل مسؤول القبول <strong className="font-black">({inq.claimedByOfficerName})</strong> وهو قيد الدراسة حالياً.</span>
                            </span>
                            {inq.claimedAt && (
                              <span className="text-[10px] text-teal-700 dark:text-teal-300 font-mono">
                                وقت الاستلام: {new Date(inq.claimedAt).toLocaleString('ar-SA')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Inquiry Content & Sent Timestamp */}
                        <div className="space-y-1.5 bg-slate-50/70 dark:bg-[#081e2b] p-3.5 rounded-2xl border border-slate-200/70 dark:border-teal-900/40">
                          <div className="flex items-center justify-between text-[11px] font-black text-slate-500 dark:text-teal-400">
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-[#009688]" />
                              <span>نص الاستفسار المقدم:</span>
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>وقت الإرسال: {new Date(inq.createdAt).toLocaleString('ar-SA')}</span>
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed pt-1">
                            {inq.inquiryText}
                          </p>
                        </div>

                        {/* Officer Answer Section */}
                        {isAnswered ? (
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-100/70 via-teal-50 to-white dark:from-[#093535] dark:via-[#072a2b] dark:to-[#041a1a] border-2 border-emerald-400 dark:border-emerald-700/60 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-300/60 dark:border-emerald-800/60 pb-2">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-200">
                                  إجابة مسؤول القبول:
                                </span>
                                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-xs font-black shadow-2xs">
                                  {inq.answeredByOfficerName || 'مسؤول القبول'}
                                </span>
                              </div>

                              {inq.answeredAt && (
                                <span className="font-mono text-[10px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  <span>وقت الإجابة: {new Date(inq.answeredAt).toLocaleString('ar-SA')}</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                              {inq.officerReply}
                            </p>

                            {/* Beneficiary Service Rating Section */}
                            <div className="pt-3 border-t border-emerald-300/50 dark:border-emerald-800/50 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                                  <span>تقييم الخدمة والإجابة من قبل المستفيد:</span>
                                </span>

                                {isRated && (
                                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-white/80 dark:bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                                    تم التقييم ({inq.beneficiaryRating} من 5 ⭐)
                                  </span>
                                )}
                              </div>

                              {isRated ? (
                                <div className="p-3 bg-white/70 dark:bg-[#061b24] rounded-xl border border-emerald-300 dark:border-emerald-800/60 text-xs font-bold text-slate-700 dark:text-slate-200">
                                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-4 h-4 ${
                                          s <= (inq.beneficiaryRating || 5)
                                            ? 'fill-amber-400 text-amber-500'
                                            : 'text-slate-300 dark:text-slate-700'
                                        }`}
                                      />
                                    ))}
                                    <span className="font-mono text-slate-500 mr-2">
                                      ({inq.beneficiaryRating} نجوم)
                                    </span>
                                  </div>
                                  {inq.beneficiaryFeedbackNotes && (
                                    <p className="text-slate-800 dark:text-slate-100 text-xs pt-1">
                                      رأي المستفيد: "{inq.beneficiaryFeedbackNotes}"
                                    </p>
                                  )}
                                  {inq.ratedAt && (
                                    <span className="block text-[10px] text-slate-400 mt-1">
                                      تاريخ التقييم: {new Date(inq.ratedAt).toLocaleString('ar-SA')}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="p-3 bg-white/90 dark:bg-[#07202d] rounded-2xl border border-emerald-300 dark:border-teal-800/70 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                                      كيف تقيم سرعة ودقة إجابة مسؤول القبول؟
                                    </span>
                                    {/* Star Rating Selector */}
                                    <div className="flex items-center gap-1 dir-ltr">
                                      {[1, 2, 3, 4, 5].map((star) => {
                                        const currentScore = ratingHover[inq.id] || ratingSelected[inq.id] || 5;
                                        return (
                                          <button
                                            key={star}
                                            type="button"
                                            onMouseEnter={() => setRatingHover(prev => ({ ...prev, [inq.id]: star }))}
                                            onMouseLeave={() => setRatingHover(prev => ({ ...prev, [inq.id]: 0 }))}
                                            onClick={() => setRatingSelected(prev => ({ ...prev, [inq.id]: star }))}
                                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                                            title={`${star} نجوم`}
                                          >
                                            <Star
                                              className={`w-5 h-5 ${
                                                star <= currentScore
                                                  ? 'fill-amber-400 text-amber-500'
                                                  : 'text-slate-300 dark:text-slate-600'
                                              }`}
                                            />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <input
                                    type="text"
                                    value={ratingNotes[inq.id] || ''}
                                    onChange={(e) => setRatingNotes(prev => ({ ...prev, [inq.id]: e.target.value }))}
                                    placeholder="اكتب كلمة شكر أو أي ملاحظة إضافية حول الإجابة (اختياري)..."
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-teal-800 bg-white dark:bg-[#0b2434] text-slate-900 dark:text-white outline-none"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => handleRatingSubmit(inq.id)}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                                  >
                                    <Star className="w-4 h-4 fill-white" />
                                    <span>إرسال تقييم الخدمة</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-200">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              الاستفسار قيد نظر مسؤولي القبول حالياً. يرجى التحقق مجدداً لاحقاً بالبحث باسمك لمشاهدة الرد وتقييم الخدمة.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
