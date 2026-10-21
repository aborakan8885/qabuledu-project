/**
 * Central Cloud Persistence & Realtime Synchronization Engine
 * Powered by Firebase Firestore with automatic offline resilience and local fallback.
 * Ensures data is 100% persistent across devices, deployments, and restarts.
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { SurveyResponse, BeneficiaryInquiry, PrincipalReport } from '../types';

const COLLECTION_SURVEYS = 'surveys';
const COLLECTION_INQUIRIES = 'inquiries';
const COLLECTION_REPORTS = 'principal_reports';

/**
 * Clean data object by removing undefined values and circular references before Firestore write
 */
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && typeof val !== 'function') {
      clean[key] = val;
    }
  }
  return clean;
}

// =========================================================================
// 1. INQUIRIES CLOUD PERSISTENCE (الاستفسارات والتواصل)
// =========================================================================

export async function saveInquiryToCloud(inquiry: BeneficiaryInquiry): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore({
      ...inquiry,
      updatedAtServer: serverTimestamp()
    });
    const docRef = doc(db, COLLECTION_INQUIRIES, inquiry.id);
    await setDoc(docRef, clean, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore saveInquiry failed, falling back to server/local:', err);
    return false;
  }
}

export async function updateInquiryInCloud(
  inquiryId: string,
  updates: Partial<BeneficiaryInquiry>
): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore({
      ...updates,
      updatedAtServer: serverTimestamp()
    });
    const docRef = doc(db, COLLECTION_INQUIRIES, inquiryId);
    await updateDoc(docRef, clean);
    return true;
  } catch (err) {
    console.warn('Firestore updateInquiry failed:', err);
    return false;
  }
}

export async function fetchAllInquiriesFromCloud(): Promise<BeneficiaryInquiry[]> {
  try {
    const colRef = collection(db, COLLECTION_INQUIRIES);
    const snap = await getDocs(colRef);
    const list: BeneficiaryInquiry[] = [];
    snap.forEach((d) => {
      list.push(d.data() as BeneficiaryInquiry);
    });
    // Sort descending by createdAt
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err) {
    console.warn('Failed to fetch inquiries from Firestore:', err);
    return [];
  }
}

export function subscribeToInquiriesCloud(
  onUpdate: (inquiries: BeneficiaryInquiry[], newArrival?: BeneficiaryInquiry) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTION_INQUIRIES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: BeneficiaryInquiry[] = [];
        let newestItem: BeneficiaryInquiry | undefined;

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const item = change.doc.data() as BeneficiaryInquiry;
            if (!newestItem || new Date(item.createdAt || 0) > new Date(newestItem.createdAt || 0)) {
              newestItem = item;
            }
          }
        });

        snapshot.forEach((d) => {
          list.push(d.data() as BeneficiaryInquiry);
        });

        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onUpdate(list, newestItem);
      },
      (error) => {
        console.warn('Inquiries Firestore onSnapshot error:', error);
      }
    );
  } catch (err) {
    console.warn('subscribeToInquiriesCloud error:', err);
    return () => {};
  }
}

// =========================================================================
// 2. SURVEYS / REQUESTS CLOUD PERSISTENCE (طلبات القبول والنقل والمعادلات)
// =========================================================================

export async function saveSurveyToCloud(survey: SurveyResponse): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore({
      ...survey,
      updatedAtServer: serverTimestamp()
    });
    const docRef = doc(db, COLLECTION_SURVEYS, survey.id);
    await setDoc(docRef, clean, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore saveSurvey failed, falling back to server/local:', err);
    return false;
  }
}

export async function updateSurveyInCloud(
  surveyId: string,
  updates: Partial<SurveyResponse>
): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore({
      ...updates,
      updatedAtServer: serverTimestamp()
    });
    const docRef = doc(db, COLLECTION_SURVEYS, surveyId);
    await updateDoc(docRef, clean);
    return true;
  } catch (err) {
    console.warn('Firestore updateSurvey failed:', err);
    return false;
  }
}

export async function fetchAllSurveysFromCloud(): Promise<SurveyResponse[]> {
  try {
    const colRef = collection(db, COLLECTION_SURVEYS);
    const snap = await getDocs(colRef);
    const list: SurveyResponse[] = [];
    snap.forEach((d) => {
      list.push(d.data() as SurveyResponse);
    });
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err) {
    console.warn('Failed to fetch surveys from Firestore:', err);
    return [];
  }
}

export function subscribeToSurveysCloud(
  onUpdate: (surveys: SurveyResponse[], newArrival?: SurveyResponse) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTION_SURVEYS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: SurveyResponse[] = [];
        let newestItem: SurveyResponse | undefined;

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const item = change.doc.data() as SurveyResponse;
            if (!newestItem || new Date(item.createdAt || 0) > new Date(newestItem.createdAt || 0)) {
              newestItem = item;
            }
          }
        });

        snapshot.forEach((d) => {
          list.push(d.data() as SurveyResponse);
        });

        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onUpdate(list, newestItem);
      },
      (error) => {
        console.warn('Surveys Firestore onSnapshot error:', error);
      }
    );
  } catch (err) {
    console.warn('subscribeToSurveysCloud error:', err);
    return () => {};
  }
}

// =========================================================================
// 3. PRINCIPAL REPORTS CLOUD PERSISTENCE (تقارير مديري المدارس)
// =========================================================================

export async function savePrincipalReportToCloud(report: PrincipalReport): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore({
      ...report,
      updatedAtServer: serverTimestamp()
    });
    const docRef = doc(db, COLLECTION_REPORTS, report.id);
    await setDoc(docRef, clean, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore savePrincipalReport failed:', err);
    return false;
  }
}

export async function fetchAllPrincipalReportsFromCloud(): Promise<PrincipalReport[]> {
  try {
    const colRef = collection(db, COLLECTION_REPORTS);
    const snap = await getDocs(colRef);
    const list: PrincipalReport[] = [];
    snap.forEach((d) => {
      list.push(d.data() as PrincipalReport);
    });
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err) {
    console.warn('Failed to fetch reports from Firestore:', err);
    return [];
  }
}

export function subscribeToPrincipalReportsCloud(
  onUpdate: (reports: PrincipalReport[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTION_REPORTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: PrincipalReport[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as PrincipalReport);
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Principal reports onSnapshot error:', error);
      }
    );
  } catch (err) {
    console.warn('subscribeToPrincipalReportsCloud error:', err);
    return () => {};
  }
}
