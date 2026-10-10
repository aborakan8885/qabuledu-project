import { SurveyResponse, PrincipalReport } from '../types';
import { isSurveyEqualizationRequest } from './storageEngine';
import { ReportSummaryItem, ReportGovernorateSection } from './reportExporter';

export interface GovernorateDefinition {
  id: string;
  name: string; // e.g. "المدينة المنورة"
  shortName: string; // e.g. "المدينة المنورة"
  keywords: string[];
  badgeColor: string;
}

export const GOVERNORATE_DEFINITIONS: GovernorateDefinition[] = [
  {
    id: 'madinah',
    name: 'المدينة المنورة',
    shortName: 'المدينة المنورة',
    keywords: ['المدينة', 'المقر الرئيسي', 'الشمال', 'الجنوب', 'الشرق', 'الغرب', 'الوسط'],
    badgeColor: 'emerald'
  },
  {
    id: 'hanakiyah',
    name: 'محافظة الحناكية',
    shortName: 'محافظة الحناكية',
    keywords: ['حناكية', 'الحناكية'],
    badgeColor: 'blue'
  },
  {
    id: 'khaybar',
    name: 'محافظة خيبر',
    shortName: 'محافظة خيبر',
    keywords: ['خيبر'],
    badgeColor: 'purple'
  },
  {
    id: 'badr',
    name: 'محافظة بدر',
    shortName: 'محافظة بدر',
    keywords: ['بدر'],
    badgeColor: 'amber'
  },
  {
    id: 'wadi_fara',
    name: 'محافظة وادي الفرع',
    shortName: 'محافظة وادي الفرع',
    keywords: ['وادي الفرع', 'وادي فرع', 'الفرع'],
    badgeColor: 'teal'
  },
  {
    id: 'mahd',
    name: 'محافظة المهد',
    shortName: 'محافظة المهد',
    keywords: ['المهد', 'مهد الذهب', 'مهد'],
    badgeColor: 'rose'
  },
  {
    id: 'yanbu',
    name: 'محافظة ينبع',
    shortName: 'محافظة ينبع',
    keywords: ['ينبع'],
    badgeColor: 'sky'
  },
  {
    id: 'ula',
    name: 'محافظة العلا',
    shortName: 'محافظة العلا',
    keywords: ['العلا', 'علا'],
    badgeColor: 'indigo'
  }
];

export function getSurveyGovernorateId(s: SurveyResponse): string {
  const fields = [
    s.sector || '',
    s.schoolName || '',
    s.firstSchoolName || '',
    s.district || '',
    s.notes || '',
    s.equalizationNotes || ''
  ].join(' ').toLowerCase();

  if (fields.includes('حناكية')) return 'hanakiyah';
  if (fields.includes('خيبر')) return 'khaybar';
  if (
    fields.includes('محافظة بدر') ||
    fields.includes('قطاع بدر') ||
    (s.sector && s.sector.includes('بدر')) ||
    (s.district && s.district.includes('بدر')) ||
    (s.schoolName && s.schoolName.includes('بدر'))
  ) {
    return 'badr';
  }
  if (fields.includes('وادي الفرع') || fields.includes('وادي فرع')) return 'wadi_fara';
  if (fields.includes('المهد') || fields.includes('مهد الذهب')) return 'mahd';
  if (fields.includes('ينبع')) return 'yanbu';
  if (fields.includes('العلا') || fields.includes('علا')) return 'ula';

  return 'madinah';
}

export function getPrincipalReportGovernorateId(r: PrincipalReport): string {
  const fields = [
    r.sector || '',
    r.schoolName || '',
    r.district || '',
    r.notes || '',
    r.referralNotes || ''
  ].join(' ').toLowerCase();

  if (fields.includes('حناكية')) return 'hanakiyah';
  if (fields.includes('خيبر')) return 'khaybar';
  if (
    fields.includes('محافظة بدر') ||
    fields.includes('قطاع بدر') ||
    (r.sector && r.sector.includes('بدر')) ||
    (r.district && r.district.includes('بدر')) ||
    (r.schoolName && r.schoolName.includes('بدر'))
  ) {
    return 'badr';
  }
  if (fields.includes('وادي الفرع') || fields.includes('وادي فرع')) return 'wadi_fara';
  if (fields.includes('المهد') || fields.includes('مهد الذهب')) return 'mahd';
  if (fields.includes('ينبع')) return 'yanbu';
  if (fields.includes('العلا')) return 'ula';

  return 'madinah';
}

export interface GovernorateCalculatedData {
  id: string;
  name: string;
  shortName: string;
  badgeColor: string;
  totalSurveys: number;
  resolvedSurveys: number;
  inProgressSurveys: number;
  resolutionRate: number;
  avgSatisfaction: number;
  principalReportsCount: number;
  secAdmission: number;
  interAdmission: number;
  primAdmission: number;
  earlyChildhoodAdmission: number;
  secEq: number;
  interEq: number;
  primEq: number;
  summaryItems: ReportSummaryItem[];
}

export function calculateAllGovernoratesStats(
  surveys: SurveyResponse[],
  principalReports: PrincipalReport[]
): GovernorateCalculatedData[] {
  const isSec = (s: SurveyResponse) => {
    const stg = (s.stage || s.equalizationStage || '').trim().toLowerCase();
    return stg === 'secondary' || stg.includes('ثانو') || stg.includes('second');
  };
  const isInter = (s: SurveyResponse) => {
    const stg = (s.stage || s.equalizationStage || '').trim().toLowerCase();
    return stg === 'intermediate' || stg.includes('متوسط') || stg.includes('intermed');
  };
  const isPrim = (s: SurveyResponse) => {
    const stg = (s.stage || s.equalizationStage || '').trim().toLowerCase();
    return stg === 'primary' || stg === 'elementary' || stg.includes('ابتدائ') || stg.includes('primar') || stg.includes('element');
  };
  const isEarly = (s: SurveyResponse) => {
    const stg = (s.stage || s.equalizationStage || '').trim().toLowerCase();
    return stg === 'kindergarten' || stg.includes('طفول') || stg.includes('رياض') || stg.includes('روض') || stg.includes('kinder');
  };

  return GOVERNORATE_DEFINITIONS.map(gov => {
    const govSurveys = surveys.filter(s => getSurveyGovernorateId(s) === gov.id);
    const govReports = principalReports.filter(r => getPrincipalReportGovernorateId(r) === gov.id);

    const totalSurveys = govSurveys.length;
    const resolvedSurveys = govSurveys.filter(s => s.isResolved).length;
    const inProgressSurveys = totalSurveys - resolvedSurveys;
    const resolutionRate = totalSurveys > 0 ? Math.round((resolvedSurveys / totalSurveys) * 100) : 100;

    const ratedSurveys = govSurveys.filter(s => typeof s.staffSatisfaction === 'number' && s.staffSatisfaction > 0);
    const avgSatisfaction = ratedSurveys.length > 0
      ? Number((ratedSurveys.reduce((acc, s) => acc + (s.staffSatisfaction || 0), 0) / ratedSurveys.length).toFixed(1))
      : 5.0;

    const admSurveys = govSurveys.filter(s => !isSurveyEqualizationRequest(s));
    const eqSurveys = govSurveys.filter(s => isSurveyEqualizationRequest(s));

    const secAdmission = admSurveys.filter(isSec).length;
    const interAdmission = admSurveys.filter(isInter).length;
    const primAdmission = admSurveys.filter(isPrim).length;
    const earlyChildhoodAdmission = admSurveys.filter(isEarly).length;

    const secEq = eqSurveys.filter(isSec).length;
    const interEq = eqSurveys.filter(isInter).length;
    const primEq = eqSurveys.filter(isPrim).length;

    const summaryItems: ReportSummaryItem[] = [
      { label: 'إجمالي المعاملات المسجلة', value: totalSurveys, icon: 'layers' },
      { label: 'المعاملات المنجزة والمغلقة', value: resolvedSurveys, icon: 'check-circle' },
      { label: 'المعاملات الجارية وقيد المعالجة', value: inProgressSurveys, icon: 'clock' },
      { label: 'نسبة إنجاز المعاملات', value: `${resolutionRate}%`, icon: 'percent' },
      { label: 'معدل رضا المستفيدين', value: `${avgSatisfaction} / 5`, icon: 'star' },
      { label: 'بلاغات المدارس الميدانية', value: govReports.length, icon: 'alert-triangle' },
      { label: 'معاملات المرحلة الثانوية', value: secAdmission, icon: 'graduation-cap' },
      { label: 'معاملات المرحلة المتوسطة', value: interAdmission, icon: 'school' },
      { label: 'معاملات المرحلة الابتدائية', value: primAdmission, icon: 'book-open' },
      { label: 'معاملات مرحلة الطفولة المبكرة', value: earlyChildhoodAdmission, icon: 'baby' },
      { label: 'معاملات معادلات المرحلة الثانوية', value: secEq, icon: 'award' },
      { label: 'معاملات معادلات المرحلة المتوسطة', value: interEq, icon: 'file-text' },
      { label: 'معاملات معادلات المرحلة الابتدائية', value: primEq, icon: 'file-badge' }
    ];

    return {
      id: gov.id,
      name: gov.name,
      shortName: gov.shortName,
      badgeColor: gov.badgeColor,
      totalSurveys,
      resolvedSurveys,
      inProgressSurveys,
      resolutionRate,
      avgSatisfaction,
      principalReportsCount: govReports.length,
      secAdmission,
      interAdmission,
      primAdmission,
      earlyChildhoodAdmission,
      secEq,
      interEq,
      primEq,
      summaryItems
    };
  });
}

export function buildGovernorateReportSections(
  surveys: SurveyResponse[],
  principalReports: PrincipalReport[]
): ReportGovernorateSection[] {
  const calculated = calculateAllGovernoratesStats(surveys, principalReports);
  return calculated.map(c => ({
    id: c.id,
    name: c.name,
    summaryItems: c.summaryItems
  }));
}
