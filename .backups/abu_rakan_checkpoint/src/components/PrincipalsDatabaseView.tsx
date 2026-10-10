import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, 
  School, 
  Upload, 
  Download, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Sparkles, 
  ShieldCheck, 
  Database, 
  Phone, 
  CreditCard, 
  RefreshCw, 
  Filter, 
  ArrowUpDown,
  X,
  Eye,
  Info,
  CheckCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SchoolItem } from '../types';
import { 
  extractCivilIdFromSchool, 
  cleanDigitsString, 
  extractPrincipalInfoFromSchool, 
  extractSchoolNameFromSchool,
  findSchoolsByPrincipalCivilId,
  normalizeKey,
  PRINCIPAL_ID_KEYWORDS,
  GENERAL_ID_KEYWORDS
} from '../utils/civilId';

interface PrincipalsDatabaseViewProps {
  schools: SchoolItem[];
  onUpdateSchools: (schools: SchoolItem[]) => void;
  onDeleteSchool?: (id: string) => void;
  isDark?: boolean;
  isRtl?: boolean;
}

export const PrincipalsDatabaseView: React.FC<PrincipalsDatabaseViewProps> = ({
  schools,
  onUpdateSchools,
  onDeleteSchool,
  isDark = false,
  isRtl = true
}) => {
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_id' | 'without_id'>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  
  // Test Civil ID Lookup State
  const [testCivilId, setTestCivilId] = useState('');
  const [testResult, setTestResult] = useState<{ searched: boolean; found: any[]; rawId: string } | null>(null);

  // Modals States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // File Upload & Preview States
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<{
    fileName: string;
    totalRows: number;
    validWithId: number;
    rows: any[];
    rawHeaders: string[];
    detectedIdColumn?: string;
  } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  // Manual Add / Edit Form State
  const [formData, setFormData] = useState({
    nameAr: '',
    ministryCode: '',
    principalName: '',
    principalCivilId: '',
    principalMobile: '',
    stage: 'Elementary',
    gender: 'boys',
    district: 'القطاع الشمالي'
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`تم نسخ السجل المدني: ${text}`, 'info');
  };

  // Compute Enriched Schools with Extracted Principal Info
  const enrichedSchools = useMemo(() => {
    return schools.map(school => {
      const info = extractPrincipalInfoFromSchool(school);
      const extractedId = info.civilId || '';
      const schoolName = info.schoolName;
      const ministryCode = info.code || school.ministryCode || school.code || school.customFields?.['الرقم الوزاري'] || '';
      
      return {
        ...school,
        displayName: schoolName,
        displayCode: ministryCode,
        principalCivilId: extractedId,
        principalName: info.name || school.principalName || 'غير محدد',
        principalMobile: info.mobile || school.principalMobile || '—',
        hasValidCivilId: Boolean(extractedId && extractedId.length >= 4)
      };
    });
  }, [schools]);

  // Statistics
  const stats = useMemo(() => {
    const totalSchools = enrichedSchools.length;
    const withIdCount = enrichedSchools.filter(s => s.hasValidCivilId).length;
    const withoutIdCount = totalSchools - withIdCount;
    
    // Unique Principals (by Civil ID)
    const uniqueIds = new Set<string>();
    enrichedSchools.forEach(s => {
      if (s.principalCivilId) uniqueIds.add(s.principalCivilId);
    });

    const completionRate = totalSchools > 0 ? Math.round((withIdCount / totalSchools) * 100) : 0;

    return {
      totalSchools,
      uniquePrincipals: uniqueIds.size,
      withIdCount,
      withoutIdCount,
      completionRate
    };
  }, [enrichedSchools]);

  // Filtered List
  const filteredSchools = useMemo(() => {
    return enrichedSchools.filter(school => {
      // Status Filter
      if (filterStatus === 'with_id' && !school.hasValidCivilId) return false;
      if (filterStatus === 'without_id' && school.hasValidCivilId) return false;

      // Stage Filter
      if (filterStage !== 'all' && school.stage !== filterStage) return false;

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const name = (school.displayName || '').toLowerCase();
      const code = (school.displayCode || '').toLowerCase();
      const pName = (school.principalName || '').toLowerCase();
      const pId = (school.principalCivilId || '').toLowerCase();
      const pPhone = (school.principalMobile || '').toLowerCase();
      const sector = (school.district || (school as any).sector || school.customFields?.['القطاع'] || '').toLowerCase();

      return name.includes(q) || code.includes(q) || pName.includes(q) || pId.includes(q) || pPhone.includes(q) || sector.includes(q);
    });
  }, [enrichedSchools, filterStatus, filterStage, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterStage]);

  // Pagination Math
  const totalPages = Math.ceil(filteredSchools.length / pageSize) || 1;
  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSchools.slice(start, start + pageSize);
  }, [filteredSchools, currentPage, pageSize]);

  // Handle File Upload and Excel Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        if (!buffer) {
          showToast('تعذر قراءة محتوى الملف', 'error');
          setIsParsing(false);
          return;
        }

        const wb = XLSX.read(buffer, { type: 'array', cellText: true, cellDates: true });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });

        if (!rawJson || rawJson.length === 0) {
          showToast('الملف المرفوع فارغ أو تعذر قراءة الصفوف منه', 'error');
          setIsParsing(false);
          return;
        }

        const rawHeaders = Object.keys(rawJson[0] || {});

        const findColumnHeader = (headers: string[], candidates: string[]) => {
          for (const cand of candidates) {
            const normCand = normalizeKey(cand);
            const found = headers.find(h => {
              const normH = normalizeKey(h);
              return normH === normCand || normH.includes(normCand) || normCand.includes(normH);
            });
            if (found) return found;
          }
          return '';
        };

        const civilIdCol = findColumnHeader(rawHeaders, [
          'السجل المدني', 'رقم السجل المدني', 'سجل مدني', 'السجل المدني لمدير المدرسة', 
          'هوية مدير المدرسة', 'رقم هوية مدير المدرسة', 'هوية المدير', 'سجل المدير', 'رقم الهوية', 'الهوية الوطنية'
        ]);

        const principalNameCol = findColumnHeader(rawHeaders, [
          'اسم مدير المدرسة', 'اسم المدير', 'مدير المدرسة', 'اسم قائد المدرسة', 'قائد المدرسة', 'اسم المديرة', 'المدير', 'اسم المسؤول'
        ]);

        const mobileCol = findColumnHeader(rawHeaders, [
          'رقم جوال مدير المدرسة', 'جوال مدير المدرسة', 'رقم جوال المدير', 'جوال المدير', 'رقم الجوال', 'الجوال', 'الهاتف', 'رقم الهاتف', 'موبايل', 'الموبايل'
        ]);

        const schoolNameCol = findColumnHeader(rawHeaders, [
          'اسم المدرسة', 'اسم المدرسه', 'المدرسة', 'المدرسه', 'اسم المنشأة'
        ]);

        const ministryCodeCol = findColumnHeader(rawHeaders, [
          'الرقم الوزاري', 'رقم الوزاري', 'الرمز الوزاري', 'كود المدرسة', 'رمز المدرسة', 'الرقم_الوزاري'
        ]);

        const stageCol = findColumnHeader(rawHeaders, ['المرحلة', 'المرحلة الدراسية']);
        const genderCol = findColumnHeader(rawHeaders, ['الجنس', 'النوع', 'بنين/بنات']);
        const sectorCol = findColumnHeader(rawHeaders, ['القطاع', 'مكتب التعليم', 'القطاع التعليمي', 'الادارة']);

        const detectedIdColumn = civilIdCol || 'السجل المدني';

        let validCount = 0;
        const normalizedRows = rawJson.map((row, idx) => {
          const rawCivilId = civilIdCol ? row[civilIdCol] : '';
          const rawName = principalNameCol ? row[principalNameCol] : '';
          const rawMobile = mobileCol ? row[mobileCol] : '';
          const rawSchoolName = schoolNameCol ? row[schoolNameCol] : '';
          const rawMinistryCode = ministryCodeCol ? row[ministryCodeCol] : '';
          const rawStage = stageCol ? row[stageCol] : '';
          const rawGender = genderCol ? row[genderCol] : '';
          const rawSector = sectorCol ? row[sectorCol] : '';

          // 1. Civil ID
          let pCivilId = cleanDigitsString(rawCivilId);

          // 2. Mobile Phone
          let pMobile = String(rawMobile || '').trim();
          const cleanMob = cleanDigitsString(pMobile);
          if (cleanMob) {
            if (/^5\d{8}$/.test(cleanMob)) {
              pMobile = '0' + cleanMob; // add leading 0 to Saudi mobile
            } else if (/^9665\d{8}$/.test(cleanMob)) {
              pMobile = '0' + cleanMob.slice(3);
            } else if (cleanMob.length >= 7) {
              pMobile = cleanMob;
            }
          }

          // 3. Principal Name
          let pName = String(rawName || '').trim();

          // 4. School Name
          let schName = String(rawSchoolName || '').trim();
          if (!schName) {
            schName = row['اسم المدرسة'] || row['المدرسة'] || `مدرسة_${idx + 1}`;
          }

          // 5. Ministry Code
          let minCode = cleanDigitsString(rawMinistryCode) || String(rawMinistryCode || '').trim();
          if (!minCode) {
            minCode = String(1000 + idx);
          }

          // 6. Stage
          let stage = 'Elementary';
          const strStage = String(rawStage || '');
          if (strStage.includes('ثانوي')) stage = 'Secondary';
          else if (strStage.includes('متوسط')) stage = 'Intermediate';
          else if (strStage.includes('روضة') || strStage.includes('طفول')) stage = 'Kindergarten';
          else if (strStage.includes('مجمع')) stage = 'All';

          // 7. Gender
          let gender = 'boys';
          const strGender = String(rawGender || '');
          if (strGender.includes('بنات') || strGender.includes('أنثى')) gender = 'girls';

          // 8. Sector
          let sector = String(rawSector || 'القطاع الشمالي').trim() || 'القطاع الشمالي';

          if (pCivilId && pCivilId.length >= 4) {
            validCount++;
          }

          return {
            originalRow: row,
            nameAr: schName,
            ministryCode: minCode,
            principalName: pName || `مدير ${schName}`,
            principalCivilId: pCivilId,
            principalMobile: pMobile || '—',
            stage,
            gender,
            district: sector,
            hasValidCivilId: Boolean(pCivilId && pCivilId.length >= 4)
          };
        });

        setParsedData({
          fileName: file.name,
          totalRows: normalizedRows.length,
          validWithId: validCount,
          rows: normalizedRows,
          rawHeaders,
          detectedIdColumn
        });
        setShowUploadModal(true);
      } catch (err: any) {
        console.error('Error parsing excel:', err);
        showToast('حدث خطأ أثناء معالجة ملف الإكسل: ' + (err.message || 'الملف غير مدعوم'), 'error');
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Commit Import to Storage
  const handleCommitImport = () => {
    if (!parsedData || parsedData.rows.length === 0) return;

    const newSchoolsList: SchoolItem[] = parsedData.rows.map((r, idx) => {
      const item: SchoolItem = {
        id: `sch_import_${Date.now()}_${idx}`,
        nameAr: r.nameAr,
        nameEn: r.nameAr,
        ministryCode: r.ministryCode,
        code: r.ministryCode,
        stage: r.stage,
        gender: r.gender,
        district: r.district,
        principalId: r.principalCivilId || undefined,
        principalCivilId: r.principalCivilId || undefined,
        principalName: r.principalName,
        principalMobile: r.principalMobile,
        customFields: {
          ...r.originalRow,
          'السجل المدني': r.principalCivilId || '',
          'اسم مدير المدرسة': r.principalName || '',
          'اسم المدرسة': r.nameAr,
          'الرقم الوزاري': r.ministryCode || '',
          'رقم جوال مدير المدرسة': r.principalMobile || '',
          'هوية مدير المدرسة': r.principalCivilId || ''
        }
      };
      return item;
    });

    if (importMode === 'replace') {
      onUpdateSchools(newSchoolsList);
      showToast(`تم استبدال وحفظ بيانات ${newSchoolsList.length} مدرسة ومدير بنجاح!`, 'success');
    } else {
      // Merge mode: Match by ministry code or name
      const existingMap = new Map<string, SchoolItem>();
      schools.forEach(s => {
        const code = String(s.ministryCode || s.code || '').trim();
        const name = String(s.nameAr || '').trim();
        if (code) existingMap.set(`code_${code}`, s);
        if (name) existingMap.set(`name_${name}`, s);
      });

      const mergedList: SchoolItem[] = [...schools];

      newSchoolsList.forEach(newSch => {
        const codeKey = `code_${String(newSch.ministryCode || '').trim()}`;
        const nameKey = `name_${String(newSch.nameAr || '').trim()}`;
        
        const existing = existingMap.get(codeKey) || existingMap.get(nameKey);
        if (existing) {
          // Update existing with new principal data
          const idx = mergedList.findIndex(item => item.id === existing.id);
          if (idx !== -1) {
            mergedList[idx] = {
              ...existing,
              nameAr: newSch.nameAr || existing.nameAr,
              ministryCode: newSch.ministryCode || existing.ministryCode,
              principalId: newSch.principalId || existing.principalId,
              principalCivilId: newSch.principalCivilId || existing.principalCivilId,
              principalName: newSch.principalName || existing.principalName,
              principalMobile: newSch.principalMobile || existing.principalMobile,
              customFields: {
                ...(existing.customFields || {}),
                ...(newSch.customFields || {}),
                'السجل المدني': newSch.principalCivilId || existing.customFields?.['السجل المدني'] || existing.customFields?.['هوية مدير المدرسة'] || '',
                'اسم مدير المدرسة': newSch.principalName || existing.customFields?.['اسم مدير المدرسة'] || '',
                'هوية مدير المدرسة': newSch.principalCivilId || existing.customFields?.['هوية مدير المدرسة'] || ''
              }
            };
          }
        } else {
          // Append new
          mergedList.push(newSch);
        }
      });

      onUpdateSchools(mergedList);
      showToast(`تم دمج وتحديث بيانات ${newSchoolsList.length} مدرسة ومدير بنجاح!`, 'success');
    }

    setShowUploadModal(false);
    setParsedData(null);
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'السجل المدني': '1052889670',
        'اسم مدير المدرسة': 'أ. سالم بن محمد الترجمي',
        'اسم المدرسة': 'مدرسة الإمام علي بن أبي طالب الثانوية',
        'الرقم الوزاري': '1004',
        'رقم جوال مدير المدرسة': '0551112222',
        'المرحلة': 'ثانوي',
        'القطاع': 'القطاع الشمالي',
        'الجنس': 'بنين'
      },
      {
        'السجل المدني': '1052889670',
        'اسم مدير المدرسة': 'أ. سالم بن محمد الترجمي',
        'اسم المدرسة': 'مدرسة الأنصار المتوسطة الرائدة',
        'الرقم الوزاري': '1005',
        'رقم جوال مدير المدرسة': '0551112222',
        'المرحلة': 'متوسط',
        'القطاع': 'القطاع الجنوبي',
        'الجنس': 'بنين'
      },
      {
        'السجل المدني': '1068575628',
        'اسم مدير المدرسة': 'أ. عبدالرحمن الأحمدي',
        'اسم المدرسة': 'مدرسة أحد الابتدائية',
        'الرقم الوزاري': '1001',
        'رقم جوال مدير المدرسة': '0551234567',
        'المرحلة': 'ابتدائي',
        'القطاع': 'القطاع الشرقي',
        'الجنس': 'بنين'
      },
      {
        'السجل المدني': '1098765432',
        'اسم مدير المدرسة': 'أ. منيرة بنت صالح الحربي',
        'اسم المدرسة': 'الابتدائية الثالثة والعشرون للبنات',
        'الرقم الوزاري': '2001',
        'رقم جوال مدير المدرسة': '0559876543',
        'المرحلة': 'ابتدائي',
        'القطاع': 'القطاع الغربي',
        'الجنس': 'بنات'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    (ws as any)['!views'] = [{ RTL: true }];
    ws['!cols'] = [
      { wch: 22 }, // السجل المدني
      { wch: 26 }, // اسم مدير المدرسة
      { wch: 34 }, // اسم المدرسة
      { wch: 16 }, // الرقم الوزاري
      { wch: 22 }, // رقم جوال مدير المدرسة
      { wch: 14 }, // المرحلة
      { wch: 18 }, // القطاع
      { wch: 12 }  // الجنس
    ];

    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, 'بيانات مديري المدارس');
    XLSX.writeFile(wb, 'قالب_بيانات_مديري_المدارس_الرسمي.xlsx');
    showToast('تم تحميل قالب الإكسل المعتمد بنجاح!', 'success');
  };

  // Export Current Principals & Schools Data to Excel
  const handleExportCurrentData = () => {
    if (enrichedSchools.length === 0) {
      showToast('لا توجد بيانات مدارس لتصديرها', 'error');
      return;
    }

    const exportRows = enrichedSchools.map((s, idx) => ({
      'م': idx + 1,
      'السجل المدني': s.principalCivilId || 'غير مسجل',
      'اسم مدير المدرسة': s.principalName || 'غير مسجل',
      'اسم المدرسة': s.displayName,
      'الرقم الوزاري': s.displayCode,
      'رقم جوال مدير المدرسة': s.principalMobile || '—',
      'المرحلة': s.stage === 'Secondary' ? 'ثانوي' : s.stage === 'Intermediate' ? 'متوسط' : s.stage === 'Kindergarten' ? 'رياض أطفال' : s.stage === 'All' ? 'مجمع' : 'ابتدائي',
      'القطاع': s.district || (s as any).sector || s.customFields?.['القطاع'] || 'المدينة المنورة',
      'الجنس': s.gender === 'girls' ? 'بنات' : 'بنين',
      'حالة توثيق السجل المدني': s.hasValidCivilId ? 'موثق بالسجل المدني' : 'غير مكتمل'
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    (ws as any)['!views'] = [{ RTL: true }];
    ws['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 28 },
      { wch: 36 },
      { wch: 16 },
      { wch: 22 },
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, 'سجل مديري المدارس');
    XLSX.writeFile(wb, `سجل_بيانات_مديري_المدارس_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`تم تصدير سجل ${enrichedSchools.length} مدرسة ومدير إلى ملف Excel بنجاح!`, 'success');
  };

  // Test Civil ID Lookup Simulator
  const handleRunCivilIdTest = () => {
    const clean = cleanDigitsString(testCivilId);
    if (!clean || clean.length < 4) {
      showToast('الرجاء إدخال رقم سجل مدني صحيح (4 أرقام على الأقل)', 'error');
      return;
    }

    const matches = findSchoolsByPrincipalCivilId(clean, schools);
    setTestResult({
      searched: true,
      found: matches,
      rawId: clean
    });
  };

  // Save Add / Edit School Form
  const handleSaveSchoolForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr.trim() || !formData.ministryCode.trim()) {
      showToast('الرجاء إدخال اسم المدرسة والرقم الوزاري على الأقل', 'error');
      return;
    }

    const cleanId = cleanDigitsString(formData.principalCivilId);

    if (editingSchool) {
      // Update Existing
      const updated = schools.map(s => {
        if (s.id === editingSchool.id) {
          return {
            ...s,
            nameAr: formData.nameAr.trim(),
            nameEn: formData.nameAr.trim(),
            ministryCode: formData.ministryCode.trim(),
            code: formData.ministryCode.trim(),
            stage: formData.stage,
            gender: formData.gender,
            district: formData.district,
            principalId: cleanId || undefined,
            principalCivilId: cleanId || undefined,
            principalName: formData.principalName.trim(),
            principalMobile: formData.principalMobile.trim(),
            customFields: {
              ...(s.customFields || {}),
              'اسم المدرسة': formData.nameAr.trim(),
              'هوية مدير المدرسة': cleanId || '',
              'اسم مدير المدرسة': formData.principalName.trim(),
              'رقم جوال مدير المدرسة': formData.principalMobile.trim(),
              'الرقم الوزاري': formData.ministryCode.trim()
            }
          };
        }
        return s;
      });

      onUpdateSchools(updated);
      showToast('تم تحديث بيانات المدرسة والمدير بنجاح!', 'success');
      setEditingSchool(null);
    } else {
      // Create New
      const newSchool: SchoolItem = {
        id: `sch_custom_${Date.now()}`,
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameAr.trim(),
        ministryCode: formData.ministryCode.trim(),
        code: formData.ministryCode.trim(),
        stage: formData.stage,
        gender: formData.gender,
        district: formData.district,
        principalId: cleanId || undefined,
        principalCivilId: cleanId || undefined,
        principalName: formData.principalName.trim() || `مدير ${formData.nameAr}`,
        principalMobile: formData.principalMobile.trim(),
        customFields: {
          'اسم المدرسة': formData.nameAr.trim(),
          'هوية مدير المدرسة': cleanId || '',
          'اسم مدير المدرسة': formData.principalName.trim(),
          'رقم جوال مدير المدرسة': formData.principalMobile.trim(),
          'الرقم الوزاري': formData.ministryCode.trim()
        }
      };

      onUpdateSchools([newSchool, ...schools]);
      showToast('تمت إضافة المدرسة والمدير بنجاح!', 'success');
      setShowAddModal(false);
    }

    // Reset form
    setFormData({
      nameAr: '',
      ministryCode: '',
      principalName: '',
      principalCivilId: '',
      principalMobile: '',
      stage: 'Elementary',
      gender: 'boys',
      district: 'القطاع الشمالي'
    });
  };

  const openEditModal = (school: any) => {
    setEditingSchool(school);
    setFormData({
      nameAr: school.displayName || school.nameAr || '',
      ministryCode: school.displayCode || school.ministryCode || school.code || '',
      principalName: school.principalName !== 'غير محدد' ? school.principalName : '',
      principalCivilId: school.principalCivilId || '',
      principalMobile: school.principalMobile !== '—' ? school.principalMobile : '',
      stage: school.stage || 'Elementary',
      gender: school.gender || 'boys',
      district: school.district || (school as any).sector || school.customFields?.['القطاع'] || 'القطاع الشمالي'
    });
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' :
          toastMessage.type === 'error' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-900 text-white border-slate-700'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5" />}
          <span className="text-xs font-black">{toastMessage.text}</span>
        </div>
      )}

      {/* Hidden File Input for Excel Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      {/* 1. HERO HEADER BANNER */}
      <div className={`p-6 sm:p-8 rounded-[32px] border relative overflow-hidden shadow-sm ${
        isDark 
          ? 'bg-[#081e2b] border-teal-800/30 text-white' 
          : 'bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-teal-800/20'
      }`}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black tracking-wide uppercase flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                سجل القيادات المدرسية والربط الوزاري
              </span>
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-black">
                عمود: السجل المدني (10 أرقام)
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 shrink-0" />
              بيانات مديري المدارس والربط بالسجل المدني
            </h1>
            
            <p className="text-xs sm:text-sm font-bold text-teal-100/85 leading-relaxed">
              إدارة ورفع ملفات الإكسل (Excel / CSV) لمديري المدارس والمدارس المرتبطة بهم. عند قيام أي مدير بتسجيل مدرسة جديدة أو تسجيل الدخول، يتعرف النظام تلقائياً على مدارسه عبر مطابقة <strong>رقم السجل المدني</strong> في عمود <strong>(السجل المدني)</strong>.
            </p>
          </div>

          {/* Quick Action Buttons on Header */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>رفع ملف إكسل المدراء (.xlsx)</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-black text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>تحميل قالب Excel معتمد</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Unique Principals */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#081e2b] border-teal-800/20' : 'bg-white border-slate-100 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              هويات فريدة
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.uniquePrincipals}
            </div>
            <div className="text-xs font-bold text-slate-400 mt-0.5">
              إجمالي مديري المدارس المسجلين
            </div>
          </div>
        </div>

        {/* Card 2: Schools with Civil ID */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#081e2b] border-teal-800/20' : 'bg-white border-slate-100 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
              ربط فوري {stats.completionRate}%
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.withIdCount}
            </div>
            <div className="text-xs font-bold text-slate-400 mt-0.5">
              مدارس مرتبطة برقم السجل المدني
            </div>
          </div>
        </div>

        {/* Card 3: Total Schools in Directory */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#081e2b] border-teal-800/20' : 'bg-white border-slate-100 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              الدليل العام
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.totalSchools}
            </div>
            <div className="text-xs font-bold text-slate-400 mt-0.5">
              إجمالي المدارس في النظام
            </div>
          </div>
        </div>

        {/* Card 4: Missing ID */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#081e2b] border-teal-800/20' : 'bg-white border-slate-100 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              تتطلب تحديث
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {stats.withoutIdCount}
            </div>
            <div className="text-xs font-bold text-slate-400 mt-0.5">
              مدارس بدون رقم سجل مدني
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE CIVIL ID LOOKUP SIMULATOR & TEST TOOL */}
      <div className={`p-5 sm:p-6 rounded-2xl border ${
        isDark ? 'bg-[#092535] border-teal-800/30' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-teal-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                أداة محاكاة وفحص استدعاء السجل المدني لمدير المدرسة
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold">10 أرقام</span>
              </h2>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                أدخل أي رقم سجل مدني (10 أرقام) لتتأكد من المدارس والبيانات التي ستظهر له تلقائياً فور إدخال سجله المدني في شاشة تسجيل المدرسة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={testCivilId}
              onChange={(e) => {
                setTestCivilId(e.target.value);
                setTestResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunCivilIdTest();
              }}
              placeholder="أدخل رقم السجل المدني (مثال: 1052889670)..."
              className={`w-64 px-4 py-2 text-xs font-mono font-bold rounded-xl border outline-none ${
                isDark ? 'bg-slate-900 border-teal-800/60 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              onClick={handleRunCivilIdTest}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>فحص الاستدعاء</span>
            </button>
          </div>
        </div>

        {/* Test Result Display */}
        {testResult && testResult.searched && (
          <div className="mt-4 pt-2">
            {testResult.found.length > 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    تم العثور على ({testResult.found.length}) مدرسة مرتبطة برقم السجل المدني: <code className="font-mono bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">{testResult.rawId}</code>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    جاهز للربط والتسجيل الفوري
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {testResult.found.map((sch, i) => {
                    const info = extractPrincipalInfoFromSchool(sch);
                    return (
                      <div key={i} className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/80 border-emerald-800/40' : 'bg-white border-emerald-200'} text-xs space-y-1.5`}>
                        <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{sch.nameAr || sch.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>الرقم الوزاري: <b className="font-mono text-teal-600">{sch.ministryCode || sch.code}</b></span>
                          <span>المدير: <b className="text-slate-800 dark:text-slate-200">{info.name}</b></span>
                        </div>
                        {info.mobile && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{info.mobile}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-black text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>لم يتم العثور على أي مدرسة مرتبطة برقم السجل المدني ({testResult.rawId}). يرجى التأكد من رفع ملف الإكسل الذي يحتوي على هذا السجل في عمود (السجل المدني) أو إضافته يدوياً.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. MAIN TABLE CONTAINER & CONTROLS */}
      <div className={`p-6 rounded-[32px] border ${
        isDark ? 'bg-[#081e2b] border-teal-800/20' : 'bg-white border-slate-100 shadow-xs'
      } space-y-5`}>
        
        {/* Table Top Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم مدير المدرسة، السجل المدني (10 أرقام)، اسم المدرسة، أو الرقم الوزاري..."
              className={`w-full pr-10 pl-4 py-2.5 rounded-xl text-xs font-bold border outline-none transition-all ${
                isDark ? 'bg-slate-900 border-teal-800/40 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-teal-800/30 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                  filterStatus === 'all' ? 'bg-white dark:bg-teal-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                الكل ({enrichedSchools.length})
              </button>
              <button
                onClick={() => setFilterStatus('with_id')}
                className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                  filterStatus === 'with_id' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                مرتبط بسجل مدني ({stats.withIdCount})
              </button>
              <button
                onClick={() => setFilterStatus('without_id')}
                className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                  filterStatus === 'without_id' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ينقصه سجل مدني ({stats.withoutIdCount})
              </button>
            </div>

            {/* Stage Filter */}
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                isDark ? 'bg-slate-900 border-teal-800/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">جميع المراحل</option>
              <option value="Elementary">ابتدائي</option>
              <option value="Intermediate">متوسط</option>
              <option value="Secondary">ثانوي</option>
              <option value="Kindergarten">رياض أطفال</option>
              <option value="All">مجمع تعليمي</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExportCurrentData}
              className={`px-3.5 py-2 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark ? 'bg-slate-900 border-teal-800/40 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="تصدير السجل الحالي إلى إكسل"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير Excel</span>
            </button>

            {/* Add School Manually */}
            <button
              onClick={() => {
                setEditingSchool(null);
                setFormData({
                  nameAr: '',
                  ministryCode: '',
                  principalName: '',
                  principalCivilId: '',
                  principalMobile: '',
                  stage: 'Elementary',
                  gender: 'boys',
                  district: 'القطاع الشمالي'
                });
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مدرسة ومدير</span>
            </button>
          </div>
        </div>

        {/* Schools & Principals Table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-teal-800/20 rounded-2xl max-h-[580px] overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'} font-black text-[11px]`}>
              <tr>
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5">اسم مدير المدرسة</th>
                <th className="p-3.5">السجل المدني</th>
                <th className="p-3.5">اسم المدرسة</th>
                <th className="p-3.5">الرقم الوزاري</th>
                <th className="p-3.5">المرحلة والقطاع</th>
                <th className="p-3.5">رقم الجوال</th>
                <th className="p-3.5 text-center">حالة الربط</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-teal-800/10">
              {paginatedSchools.length > 0 ? (
                paginatedSchools.map((school, idx) => {
                  const index = (currentPage - 1) * pageSize + idx;
                  return (
                  <tr 
                    key={school.id || index}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-teal-950/20' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Index */}
                    <td className="p-3.5 text-center font-mono text-slate-400 font-bold">
                      {index + 1}
                    </td>

                    {/* Principal Name */}
                    <td className="p-3.5 font-black text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span>{school.principalName}</span>
                      </div>
                    </td>

                    {/* Principal Civil ID with Copy Button */}
                    <td className="p-3.5">
                      {school.principalCivilId ? (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-lg">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 tracking-wider">
                            {school.principalCivilId}
                          </span>
                          <button
                            onClick={() => copyToClipboard(school.principalCivilId!, `${school.id}_${school.principalCivilId}`)}
                            className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded transition-all cursor-pointer"
                            title="نسخ السجل المدني"
                          >
                            {copiedId === `${school.id}_${school.principalCivilId}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded text-[10px] font-black border border-amber-200 dark:border-amber-800/30">
                          <AlertCircle className="w-3 h-3" />
                          غير مسجل
                        </span>
                      )}
                    </td>

                    {/* School Name */}
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{school.displayName}</span>
                      </div>
                    </td>

                    {/* Ministry Code */}
                    <td className="p-3.5 font-mono font-black text-teal-600 dark:text-teal-400">
                      {school.displayCode || '—'}
                    </td>

                    {/* Stage & Sector */}
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      <div className="space-y-0.5">
                        <div className="font-bold">
                          {school.stage === 'Secondary' ? 'ثانوي' : school.stage === 'Intermediate' ? 'متوسط' : school.stage === 'Kindergarten' ? 'رياض أطفال' : school.stage === 'All' ? 'مجمع' : 'ابتدائي'}
                          {' • '}
                          <span className="text-[10px] text-slate-400">{school.gender === 'girls' ? 'بنات' : 'بنين'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">{school.district || (school as any).sector || school.customFields?.['القطاع'] || 'المدينة المنورة'}</div>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {school.principalMobile}
                    </td>

                    {/* Match Status Badge */}
                    <td className="p-3.5 text-center">
                      {school.hasValidCivilId ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          مطابق للسجل
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black text-[10px]">
                          <AlertCircle className="w-3 h-3" />
                          ينقصه الهوية
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(school)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-lg transition-all cursor-pointer"
                          title="تعديل بيانات المدير والمدرسة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        {onDeleteSchool && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف مدرسة (${school.displayName})؟`)) {
                                onDeleteSchool(school.id);
                                showToast('تم حذف المدرسة بنجاح', 'info');
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-all cursor-pointer"
                            title="حذف المدرسة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <div className="space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-black text-slate-700 dark:text-slate-300">لم يتم العثور على أي نتائج تطابق البحث</div>
                      <p className="text-xs text-slate-400">يمكنك تعديل كلمات البحث أو رفع ملف إكسل جديد يحتوي على بيانات مديري المدارس.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar Controls */}
        {filteredSchools.length > pageSize && (
          <div className="p-4 border-t dark:border-teal-800/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="font-bold text-slate-500">
              عرض {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredSchools.length)} من أصل {filteredSchools.length} مدرسة
            </div>
            <div className="flex items-center gap-2 font-bold">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl border dark:border-teal-800/40 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
              >
                السابق
              </button>
              <span className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800/40 font-mono">
                صفحة {currentPage} من {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-xl border dark:border-teal-800/40 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. UPLOAD & PREVIEW EXCEL MODAL */}
      {showUploadModal && parsedData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#081e2b] text-white border border-teal-800/40' : 'bg-white text-slate-900 shadow-2xl'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 dark:border-teal-800/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    معاينة واستيراد ملف إكسل مديري المدارس
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    الملف: <span className="font-mono text-emerald-600">{parsedData.fileName}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats Overview of Uploaded File */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-teal-800/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs font-bold text-slate-400">إجمالي الصفوف المقروءة</div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{parsedData.totalRows} مدرسة</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">صفوف مكتملة بالسجل المدني</div>
                <div className="text-xl font-black text-emerald-600 font-mono mt-1">{parsedData.validWithId} مدير</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-teal-800/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs font-bold text-slate-400">عمود السجل المدني المكتشف تلقائياً</div>
                <div className="text-xs font-black text-teal-600 font-mono mt-2 truncate">
                  {parsedData.detectedIdColumn || 'السجل المدني (تطابق تلقائي)'}
                </div>
              </div>
            </div>

            {/* Import Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">اختر طريقة حفظ البيانات في النظام:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                  importMode === 'merge' ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-teal-800/30'
                }`}>
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={importMode === 'merge'} 
                    onChange={() => setImportMode('merge')} 
                    className="mt-1 accent-emerald-600"
                  />
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">دمج وتحديث المدارس الحالية (موصى به)</div>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">تحديث بيانات المدراء للمدارس الموجودة وإضافة أي مدارس جديدة بالملف.</p>
                  </div>
                </label>

                <label className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                  importMode === 'replace' ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-teal-800/30'
                }`}>
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={importMode === 'replace'} 
                    onChange={() => setImportMode('replace')} 
                    className="mt-1 accent-emerald-600"
                  />
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">استبدال كامل السجلات بالملف الجديد</div>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">مسح الدليل الحالي واعتماد المدارس والمدراء الموجودين في هذا الملف فقط.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview Table of First 15 Rows */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-700 dark:text-slate-300">معاينة أول 10 صفوف من الملف:</div>
              <div className="border border-slate-200 dark:border-teal-800/30 rounded-xl overflow-x-auto max-h-52 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className={`sticky top-0 ${isDark ? 'bg-slate-950' : 'bg-slate-100'} font-black text-[11px]`}>
                    <tr>
                      <th className="p-2.5">اسم المدرسة</th>
                      <th className="p-2.5">الرقم الوزاري</th>
                      <th className="p-2.5">اسم المدير</th>
                      <th className="p-2.5">السجل المدني</th>
                      <th className="p-2.5">الجوال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-teal-800/10">
                    {parsedData.rows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="p-2.5 font-bold">{r.nameAr}</td>
                        <td className="p-2.5 font-mono text-teal-600">{r.ministryCode}</td>
                        <td className="p-2.5">{r.principalName}</td>
                        <td className="p-2.5">
                          {r.principalCivilId ? (
                            <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                              {r.principalCivilId}
                            </span>
                          ) : (
                            <span className="text-amber-500 text-[10px]">غير موجود</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono">{r.principalMobile || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-teal-800/30">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold border ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                إلغاء
              </button>
              
              <button
                type="button"
                onClick={handleCommitImport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد وحفظ البيانات في النظام ({parsedData.totalRows} مدرسة)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADD / EDIT PRINCIPAL & SCHOOL MODAL */}
      {(showAddModal || editingSchool) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#081e2b] text-white border border-teal-800/40' : 'bg-white text-slate-900 shadow-2xl'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 dark:border-teal-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingSchool ? 'تعديل بيانات المدرسة والمدير' : 'إضافة مدرسة ومدير جديد للدليل'}
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    تأكد من إدخال رقم السجل المدني (10 أرقام) لتمكينه من الدخول والتسجيل الفوري.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSchool(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchoolForm} className="space-y-4 text-xs font-bold">
              {/* Row 1: School Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700 dark:text-slate-300">اسم المدرسة <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مثال: مدرسة أحد الابتدائية"
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-slate-900 border-teal-800/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700 dark:text-slate-300">الرقم الوزاري للمدرسة <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.ministryCode}
                    onChange={(e) => setFormData({ ...formData, ministryCode: e.target.value })}
                    placeholder="مثال: 1001"
                    className={`w-full p-2.5 rounded-xl border font-mono outline-none ${
                      isDark ? 'bg-slate-900 border-teal-800/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Principal Name & Civil ID (Crucial!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="space-y-1">
                  <label className="block text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>اسم مدير / مديرة المدرسة</span>
                  </label>
                  <input
                    type="text"
                    value={formData.principalName}
                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    placeholder="مثال: أ. سالم بن محمد الترجمي"
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-slate-900 border-emerald-800/40 text-white' : 'bg-white border-emerald-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>السجل المدني (10 أرقام)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.principalCivilId}
                    onChange={(e) => setFormData({ ...formData, principalCivilId: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10 أرقام (مثال: 1052889670)"
                    className={`w-full p-2.5 rounded-xl border font-mono outline-none ${
                      isDark ? 'bg-slate-900 border-emerald-800/40 text-white' : 'bg-white border-emerald-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Row 3: Mobile & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700 dark:text-slate-300">رقم جوال المدير</label>
                  <input
                    type="text"
                    value={formData.principalMobile}
                    onChange={(e) => setFormData({ ...formData, principalMobile: e.target.value })}
                    placeholder="مثال: 0551112222"
                    className={`w-full p-2.5 rounded-xl border font-mono outline-none ${
                      isDark ? 'bg-slate-900 border-teal-800/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 dark:text-slate-300">المرحلة الدراسية</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-slate-900 border-teal-800/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Elementary">ابتدائي</option>
                    <option value="Intermediate">متوسط</option>
                    <option value="Secondary">ثانوي</option>
                    <option value="Kindergarten">رياض أطفال</option>
                    <option value="All">مجمع تعليمي</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 dark:text-slate-300">النوع / الجنس</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-slate-900 border-teal-800/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="boys">بنين</option>
                    <option value="girls">بنات</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Sector */}
              <div className="space-y-1">
                <label className="block text-slate-700 dark:text-slate-300">القطاع / مكتب التعليم</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="مثال: القطاع الشمالي أو مكتب تعليم شرق المدينة"
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? 'bg-slate-900 border-teal-800/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-teal-800/30">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSchool(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black shadow-md cursor-pointer"
                >
                  {editingSchool ? 'حفظ التعديلات' : 'إضافة وحفظ في الدليل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PrincipalsDatabaseView;
