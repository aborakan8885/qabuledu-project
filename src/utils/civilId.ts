/**
 * Utility functions for extracting, normalizing, and comparing Saudi Civil IDs / National IDs
 * across uploaded Excel/CSV files and user input, with special support for the column 'هوية مدير المدرسة'.
 */

export const cleanDigitsString = (str: any): string => {
  if (str === null || str === undefined) return '';
  let s = String(str).trim();
  
  // Handle scientific notation e.g. 1.01111E+09 or 1.01111e+09
  if (/^\d+(\.\d+)?[eE]\+\d+$/.test(s)) {
    try {
      s = Number(s).toFixed(0);
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

const normalizeKey = (k: string) => {
  if (!k) return '';
  return k
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\s_\-\.\:\;\,\/\(\)\[\]\uFEFF\u00A0\u200B]/g, '');
};

export const extractCivilIdFromSchool = (school: any): string | null => {
  if (!school) return null;

  // 1. Check customFields and direct properties
  const fields = { ...(school.customFields || {}), ...school };

  // Priority 1: Specific Principal Civil ID columns (e.g., هوية مدير المدرسة, هوية المدير, رقم هوية مدير المدرسة)
  const principalIdKeywords = [
    'هويةمديرالمدرسة', 'هويةمديرةالمدرسة', 'هويةالمدير', 'هويةالمديرة', 'رقم هوية مدير المدرسة',
    'رقمهويةمديرالمدرسة', 'رقمهويةالمدير', 'سجل مدير المدرسة', 'سجلمديرالمدرسة', 'سجلالمدير',
    'السجلمديرالمدرسة', 'السجلالمدنيلمديرالمدرسة', 'السجلالمدنيللمدير', 'هويةمدير', 'سجلمدير',
    'principalid', 'principalcivilid', 'managerid', 'headmasterid'
  ];

  for (const [key, val] of Object.entries(fields)) {
    if (val === null || val === undefined || typeof val === 'object') continue;
    const normKey = normalizeKey(key);

    const isHighMatch = principalIdKeywords.some(kw => normKey.includes(kw));
    if (isHighMatch) {
      const cleaned = cleanDigitsString(val);
      if (cleaned.length >= 3) {
        return cleaned;
      }
    }
  }

  // Priority 2: Direct explicit properties on school object
  const directCandidate = 
    school.nationalId || 
    school.civilId || 
    school.national_id || 
    school.civil_id || 
    school.principalCivilId || 
    school.idNumber || 
    school.identityNo;

  if (directCandidate && String(directCandidate).trim()) {
    const cleaned = cleanDigitsString(directCandidate);
    if (cleaned) return cleaned;
  }

  // Priority 3: General ID columns (هوية, سجل مدني, وطني)
  const generalIdKeywords = [
    'سجل', 'هوية', 'مدني', 'وطني', 'مواطن', 'أحوال', 'احوال',
    'civil', 'national', 'identity', 'ssn', 'natid'
  ];

  for (const [key, val] of Object.entries(fields)) {
    if (val === null || val === undefined || typeof val === 'object') continue;
    const normKey = normalizeKey(key);

    // Skip ministerial code, school name, stage, gender keys unless explicitly having civil/national
    if ((normKey.includes('وزاري') || normKey.includes('ministry') || normKey === 'code' || normKey === 'id' || normKey.includes('مدرسة') || normKey.includes('school')) &&
        !normKey.includes('سجل') && !normKey.includes('هوية') && !normKey.includes('مدني') && !normKey.includes('civil') && !normKey.includes('national') && !normKey.includes('ssn') && !normKey.includes('identity')) {
      continue;
    }

    const isMatch = generalIdKeywords.some(kw => normKey.includes(kw));
    if (isMatch) {
      const cleaned = cleanDigitsString(val);
      if (cleaned.length >= 3) {
        return cleaned;
      }
    }
  }

  // Priority 4: Fallback - Search all values for 10-digit number starting with 1 or 2
  for (const [key, val] of Object.entries(fields)) {
    if (val === null || val === undefined || typeof val === 'object') continue;
    const cleaned = cleanDigitsString(val);
    if (/^[12]\d{9}$/.test(cleaned)) {
      return cleaned;
    }
  }

  return null;
};

/**
 * Searches and retrieves all schools linked to a principal's Civil ID,
 * specifically matching against the column 'هوية مدير المدرسة' and its aliases.
 */
export const findSchoolsByPrincipalCivilId = (enteredCivilId: string, schoolsList: any[]): any[] => {
  const cleanEntered = cleanDigitsString(enteredCivilId);
  if (!cleanEntered || !Array.isArray(schoolsList)) return [];

  return schoolsList.filter(school => {
    if (!school) return false;
    const extractedId = extractCivilIdFromSchool(school);
    if (extractedId) {
      const cleanExtracted = cleanDigitsString(extractedId);
      if (cleanExtracted === cleanEntered) return true;
      if (cleanExtracted.length >= 10 && cleanExtracted.includes(cleanEntered)) return true;
      if (cleanEntered.length >= 10 && cleanEntered.includes(cleanExtracted)) return true;
    }
    return false;
  });
};

/**
 * Extracts principal name, mobile, and ministerial code from school record dynamically.
 */
export const extractPrincipalInfoFromSchool = (school: any): { name: string; mobile: string; code: string } => {
  if (!school) {
    return { name: 'أ. مدير المدرسة', mobile: '0550000000', code: '45013' };
  }

  const fields = { ...(school.customFields || {}), ...school };
  
  // Extract Name
  let name = 
    fields['اسم مدير المدرسة'] ||
    fields['اسم مدير/ة المدرسة'] ||
    fields['اسم المدير'] ||
    fields['اسم المديرة'] ||
    fields['المدير'] ||
    fields['المديرة'] ||
    fields['مدير المدرسة'] ||
    school.principalName ||
    school.managerName ||
    `أ. مدير ${school.nameAr || ''}`;

  // Extract Mobile
  let mobile = 
    fields['رقم الجوال'] ||
    fields['جوال مدير المدرسة'] ||
    fields['جوال المدير'] ||
    fields['رقم جوال المدير'] ||
    fields['الجوال'] ||
    fields['الهاتف'] ||
    fields['هاتف المدرسة'] ||
    school.principalMobile ||
    school.mobile ||
    school.phone ||
    '0550000000';

  const code = school.ministryCode || school.code || '45013';

  return { name: String(name).trim(), mobile: String(mobile).trim(), code: String(code).trim() };
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
      schoolObj.customFields['السجل المدني'] = cleanEntered;
    }

    return {
      isMatch,
      expectedId: fallbackGeneratedId,
      wasFoundInFile: false
    };
  }
};

