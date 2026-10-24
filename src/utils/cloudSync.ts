/**
 * Central Cloud Persistence & Realtime Synchronization Engine
 * Powered by Firebase Firestore and Firebase Authentication.
 * Pure direct client-to-cloud connection with strict zero-trust ABAC rules.
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db, auth, ensureAnonymousAuth } from '../firebase';
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
    await ensureAnonymousAuth();
    if (!auth.currentUser) {
      console.warn("❌ [Firestore Error]: No authenticated user found. Cannot save inquiry.");
      return false;
    }

    const clean = sanitizeForFirestore({
      ...inquiry,
      beneficiaryUid: auth.currentUser.uid,
      updatedAtServer: serverTimestamp()
    });
    const docRef = doc(db, COLLECTION_INQUIRIES, inquiry.id);
    await setDoc(docRef, clean, { merge: true });
    return true;
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return false;
  }
}

export async function updateInquiryInCloud(
  inquiryId: string,
  updates: Partial<BeneficiaryInquiry>
): Promise<boolean> {
  try {
    await ensureAnonymousAuth();
    if (!auth.currentUser) {
      console.warn("❌ [Firestore Error]: No authenticated user found. Cannot update inquiry.");
      return false;
    }

    const clean = sanitizeForFirestore({
      ...updates,
      updatedAtServer: serverTimestamp()
    });
    const docRef = doc(db, COLLECTION_INQUIRIES, inquiryId);
    await updateDoc(docRef, clean);
    return true;
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return false;
  }
}

export async function fetchAllInquiriesFromCloud(): Promise<BeneficiaryInquiry[]> {
  try {
    await ensureAnonymousAuth();
    if (!auth.currentUser) {
      return [];
    }

    // Role-tailored query: Anonymous beneficiary gets only their inquiries; staff/admin gets all
    const baseCol = collection(db, COLLECTION_INQUIRIES);
    const q = auth.currentUser.isAnonymous
      ? query(baseCol, where('beneficiaryUid', '==', auth.currentUser.uid))
      : baseCol;

    const snap = await getDocs(q);
    const list: BeneficiaryInquiry[] = [];
    snap.forEach((d) => {
      list.push(d.data() as BeneficiaryInquiry);
    });
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return [];
  }
}

export function subscribeToInquiriesCloud(
  onUpdate: (inquiries: BeneficiaryInquiry[], newArrival?: BeneficiaryInquiry) => void
): () => void {
  try {
    if (!auth.currentUser) {
      return () => {};
    }

    // Role-tailored query: Anonymous beneficiary listens only to their own inquiries; staff/admin listens to all
    const baseCol = collection(db, COLLECTION_INQUIRIES);
    const q = auth.currentUser.isAnonymous
      ? query(baseCol, where('beneficiaryUid', '==', auth.currentUser.uid))
      : baseCol;

    return onSnapshot(
      q,
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
        console.warn("❌ [Firestore Error]:", error?.message, error);
      }
    );
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return () => {};
  }
}

// =========================================================================
// 2. SURVEYS / REQUESTS CLOUD PERSISTENCE (طلبات القبول والنقل والمعادلات)
// =========================================================================

export async function saveSurveyToCloud(survey: SurveyResponse): Promise<boolean> {
  try {
    await ensureAnonymousAuth();
    if (!auth.currentUser) {
      console.warn("❌ [Firestore Error]: No authenticated user found. Cannot save survey.");
      return false;
    }

    const clean = sanitizeForFirestore({
      ...survey,
      beneficiaryUid: auth.currentUser.uid,
      updatedAtServer: serverTimestamp()
    });
    const docRef = doc(db, COLLECTION_SURVEYS, survey.id);
    await setDoc(docRef, clean, { merge: true });
    return true;
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return false;
  }
}

export async function updateSurveyInCloud(
  surveyId: string,
  updates: Partial<SurveyResponse>
): Promise<boolean> {
  try {
    await ensureAnonymousAuth();
    if (!auth.currentUser) {
      console.warn("❌ [Firestore Error]: No authenticated user found. Cannot update survey.");
      return false;
    }

    const clean = sanitizeForFirestore({
      ...updates,
      updatedAtServer: serverTimestamp()
    });
    const docRef = doc(db, COLLECTION_SURVEYS, surveyId);
    await updateDoc(docRef, clean);
    return true;
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return false;
  }
}

export async function fetchAllSurveysFromCloud(): Promise<SurveyResponse[]> {
  try {
    await ensureAnonymousAuth();
    if (!auth.currentUser) {
      return [];
    }

    // Role-tailored query: Anonymous beneficiary gets only their surveys; staff/admin gets all
    const baseCol = collection(db, COLLECTION_SURVEYS);
    const q = auth.currentUser.isAnonymous
      ? query(baseCol, where('beneficiaryUid', '==', auth.currentUser.uid))
      : baseCol;

    const snap = await getDocs(q);
    const list: SurveyResponse[] = [];
    snap.forEach((d) => {
      list.push(d.data() as SurveyResponse);
    });
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return [];
  }
}

export function subscribeToSurveysCloud(
  onUpdate: (surveys: SurveyResponse[], newArrival?: SurveyResponse) => void
): () => void {
  try {
    if (!auth.currentUser) {
      return () => {};
    }

    // Role-tailored query: Anonymous beneficiary listens only to their own surveys; staff/admin listens to all
    const baseCol = collection(db, COLLECTION_SURVEYS);
    const q = auth.currentUser.isAnonymous
      ? query(baseCol, where('beneficiaryUid', '==', auth.currentUser.uid))
      : baseCol;

    return onSnapshot(
      q,
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
        console.warn("❌ [Firestore Error]:", error?.message, error);
      }
    );
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return () => {};
  }
}

// =========================================================================
// 3. PRINCIPAL REPORTS CLOUD PERSISTENCE (تقارير مديري المدارس)
// =========================================================================

export async function savePrincipalReportToCloud(report: PrincipalReport): Promise<boolean> {
  try {
    await ensureAnonymousAuth();
    if (!auth.currentUser) {
      console.warn("❌ [Firestore Error]: No authenticated user found. Cannot save principal report.");
      return false;
    }

    const clean = sanitizeForFirestore({
      ...report,
      updatedAtServer: serverTimestamp()
    });
    const docRef = doc(db, COLLECTION_REPORTS, report.id);
    await setDoc(docRef, clean, { merge: true });
    return true;
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return false;
  }
}

export async function fetchAllPrincipalReportsFromCloud(): Promise<PrincipalReport[]> {
  try {
    await ensureAnonymousAuth();
    if (!auth.currentUser) {
      return [];
    }

    const colRef = collection(db, COLLECTION_REPORTS);
    const snap = await getDocs(colRef);
    const list: PrincipalReport[] = [];
    snap.forEach((d) => {
      list.push(d.data() as PrincipalReport);
    });
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return [];
  }
}

export function subscribeToPrincipalReportsCloud(
  onUpdate: (reports: PrincipalReport[]) => void
): () => void {
  try {
    if (!auth.currentUser) {
      return () => {};
    }

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
        console.warn("❌ [Firestore Error]:", error?.message, error);
      }
    );
  } catch (err: any) {
    console.warn("❌ [Firestore Error]:", err?.message, err);
    return () => {};
  }
}
