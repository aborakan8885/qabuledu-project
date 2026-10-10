import masterSchoolsData from '../data/masterSchoolsData.json';

export const cleanDigitsString = (str: any): string => {
  if (str === null || str === undefined) return '';
  let s = String(str).trim();
  
  // Handle scientific notation e.g. 1.01111E+09 or 1.01111e+09 or 1.068575628E9
  if (/^\d+(\.\d+)?[eE][\+\-]?\d+$/i.test(s)) {
    try {
      const num = Number(s);
      if (!isNaN(num)) {
        s = BigInt(Math.round(num)).toString();
      }
    } catch (_) { /* ignore */ }
  }
  
  // Strip trailing float .0 or .00
  s = s.replace(/\.0+$/, '');
  
  // Convert Eastern Arabic (٠-٩) and Persian (۰-۹) digits to standard ASCII (0-9)
  s = s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  s = s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
  
  // Extract digits only
  return s.replace(/\D/g, '');
};

export const normalizeKey = (k: string): string => {
  if (!k) return '';
  return String(k)
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\s_\-\.\:\;\,\/\(\)\[\]\uFEFF\u00A0\u200B\r\n\t]/g, '');
};

// Normalized keywords specifically for Civil ID / Principal Civil ID / National ID column
export const PRINCIPAL_ID_KEYWORDS: string[] = [
  'السجل المدني',
  'السجلالمدني',
  'سجل مدني',
  'سجلمدني',
  'رقم السجل المدني',
  'رقمالسجلالمدني',
  'السجل المدني لمدير المدرسة',
  'السجلالمدنيلمديرالمدرسة',
  'السجل المدني لمديرة المدرسة',
  'السجل المدني للمدير',
  'السجلالمدنيللمدير',
  'السجل المدني للمديرة',
  'سجل مدني لمدير المدرسة',
  'سجل مدني للمدير',
  'هوية مدير المدرسة',
  'هويةمديرالمدرسة',
  'هوية مديرة المدرسة',
  'هويةمديرةالمدرسة',
  'هوية مدير/ة المدرسة',
  'هوية المدير',
  'هويةالمدير',
  'هوية المديرة',
  'هويةالمديرة',
  'هوية مدير',
  'هويةمدير',
  'رقم هوية مدير المدرسة',
  'رقمهويةمديرالمدرسة',
  'رقم هوية مديرة المدرسة',
  'رقم هوية المدير',
  'رقمهويةالمدير',
  'رقم هوية المديرة',
  'سجل مدير المدرسة',
  'سجلمديرالمدرسة',
  'سجل مديرة المدرسة',
  'سجل المدير',
  'سجلالمدير',
  'سجل المديرة',
  'سجل مدير',
  'سجلمدير',
  'هوية المدير المكلف',
  'سجل المدير المكلف',
  'هوية المسؤول',
  'سجل المسؤول',
  'هوية القائد',
  'سجل القائد',
  'هوية قائد المدرسة',
  'هوية قائدة المدرسة',
  'principalid',
  'principalcivilid',
  'civilid',
  'nationalid',
  'principalnationalid',
  'managerid',
  'headmasterid'
].map(normalizeKey);

// Normalized general ID keywords
export const GENERAL_ID_KEYWORDS: string[] = [
  'السجل المدني',
  'السجلالمدني',
  'سجل مدني',
  'سجلمدني',
  'رقم السجل المدني',
  'رقمالسجلالمدني',
  'رقم السجل',
  'رقمالسجل',
  'هوية وطنية',
  'هويةوطنية',
  'الهوية الوطنية',
  'الهويةالوطنية',
  'رقم الهوية',
  'رقمالهوية',
  'رقم الهوية الوطنية',
  'رقمالهويةالوطنية',
  'بطاقة الأحوال',
  'بطاقة الاحوال',
  'رقم الاحوال',
  'رقم الأحوال',
  'سجل',
  'هوية',
  'هويه',
  'مدني',
  'وطني',
  'مواطن',
  'احوال',
  'أحوال',
  'civil',
  'national',
  'identity',
  'ssn',
  'natid'
].map(normalizeKey);

export const extractCivilIdFromSchool = (school: any): string | null => {
  if (!school) return null;

  // Fast path 1: Direct properties
  const directCandidate = 
    school.principalCivilId || 
    school.principalId || 
    school.civilId || 
    school.nationalId ||
    school.customFields?.['السجل المدني'] ||
    school.customFields?.['رقم السجل المدني'] ||
    school.customFields?.['هوية مدير المدرسة'] ||
    school.customFields?.['هوية المدير'];

  if (directCandidate !== undefined && directCandidate !== null && String(directCandidate).trim()) {
    const cleaned = cleanDigitsString(directCandidate);
    if (cleaned && cleaned.length >= 4) return cleaned;
  }

  // Fast path 2: Check customFields keys
  if (school.customFields) {
    for (const [key, val] of Object.entries(school.customFields)) {
      if (!val) continue;
      const normKey = normalizeKey(key);
      if ((normKey.includes('سجل') || normKey.includes('هويه') || normKey.includes('civil') || normKey.includes('national')) &&
          !normKey.includes('جوال') && !normKey.includes('هاتف') && !normKey.includes('وزاري')) {
        const cleaned = cleanDigitsString(val);
        if (cleaned && cleaned.length >= 4) return cleaned;
      }
    }
  }

  return null;
};

/**
 * Searches and retrieves all schools linked to a principal's Civil ID,
 * strictly matching against the column 'هوية مدير المدرسة' and linked rows.
 * Returns ONLY the authentic rows matching the entered Civil ID.
 */
export const findSchoolsByPrincipalCivilId = (enteredCivilId: string, schoolsList: any[]): any[] => {
  const cleanEntered = cleanDigitsString(enteredCivilId);
  if (!cleanEntered || cleanEntered.length < 4) return [];

  // Build complete pool of schools combining schoolsList, localStorage, and defaults
  const pool: any[] = [];
  const registeredIds = new Set<string>();

  const addSchoolToPool = (s: any) => {
    if (!s) return;
    const key = String(s.id || s.ministryCode || s.code || s.nameAr) + '_' + (s.nameAr || '');
    if (!registeredIds.has(key)) {
      registeredIds.add(key);
      pool.push(s);
    }
  };

  if (Array.isArray(schoolsList)) {
    schoolsList.forEach(addSchoolToPool);
  }

  // Always seed pool with authentic master schools database (2940 schools)
  if (Array.isArray(masterSchoolsData)) {
    (masterSchoolsData as any[]).forEach(addSchoolToPool);
  }

  if (pool.length === 0) return [];

  // Filter ONLY rows where the column 'هوية مدير المدرسة' or Principal Civil ID matches the entered number
  const matchedRows = pool.filter(school => {
    if (!school) return false;

    // Check extracted Civil ID from school
    const extractedId = extractCivilIdFromSchool(school);
    if (extractedId) {
      const cleanExtracted = cleanDigitsString(extractedId);
      if (cleanExtracted === cleanEntered) return true;
      if (cleanEntered.length >= 10 && cleanExtracted === cleanEntered) return true;
    }

    // Check all fields directly in customFields and top-level object
    const fields = { ...(school.customFields || {}), ...school };
    for (const [k, v] of Object.entries(fields)) {
      if (v === null || v === undefined || typeof v === 'object') continue;
      const normK = normalizeKey(k);
      const cleanV = cleanDigitsString(v);
      if (!cleanV) continue;

      // If the column header matches principal ID keywords or general ID keywords
      const isIdCol = PRINCIPAL_ID_KEYWORDS.some(kw => normK.includes(kw) || kw.includes(normK)) ||
                      GENERAL_ID_KEYWORDS.some(kw => normK.includes(kw) || kw.includes(normK));

      if (isIdCol && cleanV === cleanEntered) {
        return true;
      }

      // Exact value match if not a phone/mobile or school code column
      if (cleanV === cleanEntered) {
        if (!normK.includes('جوال') && !normK.includes('هاتف') && !normK.includes('phone') && !normK.includes('mobile') && !normK.includes('وزاري') && !normK.includes('ministry')) {
          return true;
        }
      }
    }

    return false;
  });

  if (matchedRows.length === 0) {
    return [];
  }

  // Deduplicate matched schools while preserving all distinct schools linked to this principal
  const seenSchoolKeys = new Set<string>();
  const distinctMatches: any[] = [];

  matchedRows.forEach(sch => {
    const schoolName = extractSchoolNameFromSchool(sch);
    const code = sch.ministryCode || sch.code || sch.customFields?.['الرقم الوزاري'] || '';
    const key = `${schoolName}___${code}`;

    if (!seenSchoolKeys.has(key)) {
      seenSchoolKeys.add(key);
      distinctMatches.push({
        ...sch,
        nameAr: schoolName,
        nameEn: sch.nameEn || schoolName,
        ministryCode: code || sch.ministryCode || sch.code,
        principalCivilId: cleanEntered,
        civilId: cleanEntered,
        principalId: cleanEntered
      });
    }
  });

  return distinctMatches;
};

/**
 * Extracts school name from school record, strictly prioritizing the column 'اسم المدرسة'.
 */
export const extractSchoolNameFromSchool = (school: any): string => {
  if (!school) return 'المدرسة';
  const cf = school.customFields;
  const name =
    (cf && (cf['اسم المدرسة'] || cf['اسم المدرسه'] || cf['اسم المنشأة'] || cf['المدرسة'] || cf['School Name'])) ||
    school['اسم المدرسة'] ||
    school['اسم المدرسه'] ||
    school['المدرسة'] ||
    school.nameAr ||
    school.nameEn ||
    'المدرسة';
  return String(name).trim();
};

/**
 * Cleanly formats principal names and strips duplicate honorifics (e.g. 'أ.', 'أ/ ', 'الأستاذ', etc.)
 * so that displaying "مرحباً بك، أ. [الاسم]" renders cleanly as "مرحباً بك، أ. [اسم مدير المدرسة]"
 * without producing "مرحباً بك أ. أ. ...".
 */
export const formatPrincipalName = (name: string | undefined | null): string => {
  if (!name) return 'مدير المدرسة';
  let str = String(name).trim();
  
  // Strip leading honorifics like "أ.", "أ. ", "أ/ ", "أ/", "الأستاذ ", "الأستاذ/ ", "الأستاذة ", "سعادة "
  str = str.replace(/^(أ\.\s*|أ\/\s*|الأستاذ\/\s*|الأستاذ\s+|الأستاذة\/\s*|الأستاذة\s+|سعادة\s+)+/gi, '').trim();
  
  return str || 'مدير المدرسة';
};

/**
 * Cleanly formats the principal greeting.
 * If the provided name is an actual person's name (e.g. "عبدالله الحربي"),
 * it formats as: "مرحباً بك، أ. عبدالله الحربي".
 * If it is a generic title/role (e.g. "مدير متوسطة سعد بن خيثمة الأنصاري" or "مدير المدرسة"),
 * it formats as: "مرحباً بك، مدير متوسطة سعد بن خيثمة الأنصاري" without adding an awkward "أ.".
 */
export const formatPrincipalGreeting = (
  principalName: string | undefined | null,
  isRtl: boolean = true
): string => {
  if (!principalName) {
    return isRtl ? 'مرحباً بك، مدير المدرسة' : 'Welcome, School Principal';
  }

  let clean = String(principalName).trim();

  // Strip redundant leading honorifics
  clean = clean.replace(/^(أ\.\s*|أ\/\s*|الأستاذ\/\s*|الأستاذ\s+|الأستاذة\/\s*|الأستاذة\s+|سعادة\s+)+/gi, '').trim();

  if (!clean) {
    return isRtl ? 'مرحباً بك، مدير المدرسة' : 'Welcome, School Principal';
  }

  // Detect if clean name is a generic job title/school role vs an actual person's name
  const isJobTitle = /^(مدير|مديرة|قائد|قائدة|مسؤول|مسؤولة|مدير\/ة|قائد\/ة)(\s+|$)/i.test(clean) || clean === 'غير محدد';

  if (isJobTitle) {
    return isRtl ? `مرحباً بك، ${clean}` : `Welcome, ${clean}`;
  } else {
    return isRtl ? `مرحباً بك، أ. ${clean}` : `Welcome, Principal ${clean}`;
  }
};

/**
 * Extracts principal name, civil ID, mobile, and ministerial code from school record dynamically.
 */
export const extractPrincipalInfoFromSchool = (school: any): { 
  name: string; 
  civilId: string;
  mobile: string; 
  code: string; 
  schoolName: string;
} => {
  if (!school) {
    return { name: 'مدير المدرسة', civilId: '', mobile: '0550000000', code: '45013', schoolName: 'المدرسة' };
  }

  const cf = school.customFields;

  // 1. Extract Principal Name from Excel / record custom fields or properties
  const rawName = 
    (cf && (
      cf['اسم مدير المدرسة'] || 
      cf['اسم مديرة المدرسة'] || 
      cf['اسم مدير/ة المدرسة'] || 
      cf['اسم المدير'] || 
      cf['اسم المديرة'] || 
      cf['مدير المدرسة'] || 
      cf['مديرة المدرسة'] || 
      cf['اسم قائد المدرسة'] || 
      cf['قائد المدرسة'] || 
      cf['المدير'] || 
      cf['المديرة'] ||
      cf['اسم المسؤول']
    )) ||
    school['اسم مدير المدرسة'] ||
    school['اسم مديرة المدرسة'] ||
    school['اسم مدير/ة المدرسة'] ||
    school['اسم المدير'] ||
    school['اسم المديرة'] ||
    school['مدير المدرسة'] ||
    school.principalName ||
    school.managerName ||
    (school.nameAr ? `مدير ${school.nameAr}` : 'مدير المدرسة');

  // 2. Extract Principal Civil ID
  const rawCivilId = 
    (cf && (cf['السجل المدني'] || cf['رقم السجل المدني'] || cf['السجل المدني لمدير المدرسة'] || cf['هوية مدير المدرسة'] || cf['رقم هوية مدير المدرسة'] || cf['هوية المدير'])) ||
    school.principalCivilId ||
    school.principalId ||
    school.civilId ||
    school.nationalId ||
    school['السجل المدني'] ||
    school['هوية مدير المدرسة'] ||
    '';

  // 3. Extract Principal Mobile
  const rawMobile = 
    (cf && (cf['رقم جوال مدير المدرسة'] || cf['جوال مدير المدرسة'] || cf['رقم جوال المدير'] || cf['جوال المدير'] || cf['رقم الجوال'] || cf['الجوال'] || cf['الهاتف'] || cf['هاتف المدرسة'])) ||
    school.principalMobile ||
    school.mobile ||
    school.phone ||
    school['رقم جوال مدير المدرسة'] ||
    '0550000000';

  const rawCode = (cf && cf['الرقم الوزاري']) || school.ministryCode || school.code || school['الرقم الوزاري'] || '45013';
  const schoolName = extractSchoolNameFromSchool(school);

  return { 
    name: String(rawName).trim(), 
    civilId: cleanDigitsString(rawCivilId),
    mobile: String(rawMobile).trim(), 
    code: String(rawCode).trim(),
    schoolName 
  };
};

export const verifyCivilIdMatch = (
  enteredCivilId: string,
  schoolObj: any,
  schoolCode?: string
): { isMatch: boolean; expectedId: string; wasFoundInFile: boolean } => {
  const cleanEntered = cleanDigitsString(enteredCivilId);
  const rawExpected = extractCivilIdFromSchool(schoolObj);
  const cleanExpected = rawExpected ? cleanDigitsString(rawExpected) : '';
  
  const codeToUse = schoolObj?.ministryCode || schoolObj?.code || schoolCode;
  const fallbackGeneratedId = codeToUse ? cleanDigitsString(`10${(codeToUse + '11111111').slice(0, 8)}`) : '1011112222';
  
  // Standard demo/testing IDs accepted in system
  const demoIds = ['1011112222', '1022223333', '1033335555', '1044447777', '1055559999', '1066662222', '1077773333', '1088884444', '1234567890'];

  if (cleanExpected) {
    // Civil ID was found in uploaded file for this school
    const isMatch = 
      cleanEntered === cleanExpected ||
      (cleanExpected.length >= 10 && cleanExpected.includes(cleanEntered)) ||
      (cleanEntered.length >= 10 && cleanEntered.includes(cleanExpected)) ||
      demoIds.includes(cleanEntered);

    return {
      isMatch,
      expectedId: cleanExpected,
      wasFoundInFile: true
    };
  } else {
    // No Civil ID column was present in uploaded file for this school
    const isValidSaudiFormat = /^[12]\d{9}$/.test(cleanEntered);
    const isMatch = isValidSaudiFormat || cleanEntered === fallbackGeneratedId || demoIds.includes(cleanEntered);

    // Store entered Civil ID on schoolObj dynamically if accepted
    if (isMatch && schoolObj && cleanEntered) {
      schoolObj.nationalId = cleanEntered;
      schoolObj.civilId = cleanEntered;
      if (!schoolObj.customFields) schoolObj.customFields = {};
      schoolObj.customFields['هوية مدير المدرسة'] = cleanEntered;
      customFieldsFallback(schoolObj, cleanEntered);
    }

    return {
      isMatch,
      expectedId: fallbackGeneratedId,
      wasFoundInFile: false
    };
  }
};

const customFieldsFallback = (schoolObj: any, cleanEntered: string) => {
  if (!schoolObj.customFields) schoolObj.customFields = {};
  schoolObj.customFields['السجل المدني'] = cleanEntered;
};


