import { SurveyResponse } from '../types';

export interface DelayStatusResult {
  isDelayed: boolean; // Delayed past 2 business days
  delayWorkingDays: number;
  elapsedHours: number;
  elapsedDays: number;
  lastActionDateStr: string;
  delayMessage: string;
}

/**
 * Calculates whether a request is delayed by more than 2 business days (>= 2 working days or >= 48 hours)
 * since its last dispatch / referral without being finalized.
 */
export function checkRequestDelayStatus(survey: SurveyResponse): DelayStatusResult {
  // If request is already resolved or staffing confirmed, it is not delayed
  if (survey.isResolved || survey.staffingConfirmedAt || survey.principalConfirmedStaffing) {
    return {
      isDelayed: false,
      delayWorkingDays: 0,
      elapsedHours: 0,
      elapsedDays: 0,
      lastActionDateStr: '',
      delayMessage: ''
    };
  }

  // Find the date of the last relevant dispatch or referral
  const refDateStr = 
    survey.sentToLeadershipAt ||
    survey.sentToPrincipalAt ||
    survey.returnedAt ||
    survey.principalReturnedAt ||
    survey.planningReResolvedAt ||
    survey.vacancyApprovedAt ||
    survey.eqReferredToPlanningAt ||
    survey.referredToPlanningAt ||
    survey.createdAt ||
    survey.submittedAt;

  if (!refDateStr) {
    return {
      isDelayed: false,
      delayWorkingDays: 0,
      elapsedHours: 0,
      elapsedDays: 0,
      lastActionDateStr: '',
      delayMessage: ''
    };
  }

  const startDate = new Date(refDateStr);
  const now = new Date();

  if (isNaN(startDate.getTime())) {
    return {
      isDelayed: false,
      delayWorkingDays: 0,
      elapsedHours: 0,
      elapsedDays: 0,
      lastActionDateStr: '',
      delayMessage: ''
    };
  }

  const diffMs = Math.max(0, now.getTime() - startDate.getTime());
  const elapsedHours = Math.floor(diffMs / (1000 * 60 * 60));
  const elapsedDays = Math.floor(elapsedHours / 24);

  // Calculate working days (excluding Friday & Saturday in Saudi Arabia)
  let delayWorkingDays = 0;
  const cur = new Date(startDate);
  while (cur < now) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    if (day !== 5 && day !== 6) { // Not Friday, Not Saturday
      delayWorkingDays++;
    }
  }

  // Delayed if elapsed working days >= 2 or elapsed total hours >= 48
  const isDelayed = delayWorkingDays >= 2 || elapsedHours >= 48;

  const delayMessage = isDelayed
    ? `🚨 رسالة طارئة وعاجلة: تأخر الطلب أكثر من يومين عمل عن التسكين (${delayWorkingDays > 0 ? `${delayWorkingDays} أيام عمل / ` : ''}${elapsedHours} ساعة)! يلزم الإجراء الفوري والاتصال بمدير المدرسة.`
    : '';

  return {
    isDelayed,
    delayWorkingDays,
    elapsedHours,
    elapsedDays,
    lastActionDateStr: refDateStr,
    delayMessage
  };
}

/**
 * Returns all active requests that are delayed over 2 business days
 */
export function getDelayedRequests(surveys: SurveyResponse[]): SurveyResponse[] {
  if (!surveys) return [];
  return surveys.filter((s) => checkRequestDelayStatus(s).isDelayed);
}
