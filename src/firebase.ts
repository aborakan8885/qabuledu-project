import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile } from './types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

let authInitPromise: Promise<User | null> | null = null;

/**
 * Ensures user is authenticated anonymously if not already signed in.
 */
export async function ensureAnonymousAuth(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  if (authInitPromise) {
    return authInitPromise;
  }

  authInitPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsubscribe();
          resolve(cred.user);
        } catch (err: any) {
          unsubscribe();
          console.warn("⚠️ [FirebaseAuth]: Anonymous sign-in note:", err?.message || err);
          resolve(null);
        }
      }
    }, (error) => {
      unsubscribe();
      console.warn("⚠️ [FirebaseAuth]: Auth listener note:", error?.message || error);
      resolve(null);
    });
  });

  return authInitPromise;
}

/**
 * Real Firebase Auth Email/Password Sign-In
 */
export async function loginWithEmailAndPassword(email: string, password: string):Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * Real Firebase Auth Email/Password Registration with Role
 */
export async function registerWithEmailAndPassword(
  email: string,
  password: string,
  role: 'admin' | 'officer',
  displayName?: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // Persist role in /users/{uid} in Firestore
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || email.split('@')[0],
      role: role,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("⚠️ [Firestore Note]: Could not create user profile document:", err);
  }

  return user;
}

/**
 * Sign out current authenticated user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("⚠️ [FirebaseAuth Note]: Sign out note:", err);
  }
}

/**
 * Searches the 'users' collection for an officer/staff member with the given civilId
 */
export async function findStaffByCivilId(civilId: string): Promise<{ id: string; data: any } | null> {
  const cleanId = civilId
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .trim();
  if (!cleanId) return null;

  await ensureAnonymousAuth();

  // 1. Direct doc by civilId in Firestore
  try {
    const directDoc = await getDoc(doc(db, 'users', cleanId));
    if (directDoc.exists()) {
      return { id: directDoc.id, data: directDoc.data() };
    }
  } catch (e) {
    console.warn("Direct doc read by civilId note:", e);
  }

  // 2. Query where civilId == cleanId in Firestore
  try {
    const q1 = query(collection(db, 'users'), where('civilId', '==', cleanId));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      return { id: snap1.docs[0].id, data: snap1.docs[0].data() };
    }
  } catch (e) {
    console.warn("Query where civilId note:", e);
  }

  // 3. Fallback query where nationalId == cleanId in Firestore
  try {
    const q2 = query(collection(db, 'users'), where('nationalId', '==', cleanId));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      return { id: snap2.docs[0].id, data: snap2.docs[0].data() };
    }
  } catch (e) {
    console.warn("Query where nationalId note:", e);
  }

  // 4. Fallback to Admin-managed staff list in local storage (officer_users_v4 / officer_users_v3)
  try {
    const keys = ['officer_users_v4', 'officer_users_v3'];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const match = list.find(
            (o: any) => String(o.civilId || o.nationalId || '').trim() === cleanId
          );
          if (match) {
            return {
              id: cleanId,
              data: {
                ...match,
                civilId: cleanId,
                nationalId: cleanId
              }
            };
          }
        }
      }
    }
  } catch {}

  // 5. Check Official System Admin (1068575628) if Firestore users collection is not yet seeded
  if (cleanId === '1068575628') {
    return {
      id: '1068575628',
      data: {
        civilId: '1068575628',
        nationalId: '1068575628',
        nameAr: 'سالم محمد الترجمي',
        role: 'admin',
        roleDescription: 'مدير النظام (أدمن - كامل الصلاحيات)',
        workField: 'وحدة القبول والتسجيل',
        unit: 'وحدة القبول والتسجيل',
        mobile: '0553512200',
        permissions: {
          canViewInquiries: true,
          canViewGeneralInquiries: true,
          canViewEquivalencyRequests: true,
          canViewSchoolTransfers: true,
          canViewSettings: true,
          canViewSync: true,
          canViewDashboard: true,
          canViewFeedback: true,
          canViewStaff: true,
          canViewSchools: true,
          canViewAlerts: true,
          canViewPrincipalData: true
        }
      }
    };
  }

  return null;
}

/**
 * Fetches the complete verified UserProfile from the /users/{uid} document in Firestore,
 * or queries by uid or civilId if needed.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    // 1. Try direct lookup by uid
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        civilId: data.civilId || data.nationalId || (auth.currentUser?.email ? auth.currentUser.email.split('@')[0] : ''),
        nationalId: data.nationalId || data.civilId || '',
        nameAr: data.nameAr || data.displayName || data.name || 'منسوب معتمد',
        displayName: data.displayName || data.nameAr || '',
        email: data.email || auth.currentUser?.email || '',
        role: data.role || 'officer',
        permissions: data.permissions || {},
        workField: data.workField || data.unit || '',
        unit: data.unit || data.workField || '',
        mobile: data.mobile || '',
        ...data
      } as UserProfile;
    }

    // 2. Try query by uid field inside documents
    const qUid = query(collection(db, 'users'), where('uid', '==', uid));
    const snapUid = await getDocs(qUid);
    if (!snapUid.empty) {
      const docData = snapUid.docs[0].data();
      return {
        uid,
        civilId: docData.civilId || docData.nationalId || '',
        nationalId: docData.nationalId || docData.civilId || '',
        nameAr: docData.nameAr || docData.displayName || 'منسوب معتمد',
        displayName: docData.displayName || docData.nameAr || '',
        email: docData.email || auth.currentUser?.email || '',
        role: docData.role || 'officer',
        permissions: docData.permissions || {},
        workField: docData.workField || docData.unit || '',
        unit: docData.unit || docData.workField || '',
        mobile: docData.mobile || '',
        ...docData
      } as UserProfile;
    }

    // 3. Fallback: if email format is {civilId}@qabul.madinah.sa
    const currentUserEmail = auth.currentUser?.email;
    if (currentUserEmail && currentUserEmail.includes('@qabul.madinah.sa')) {
      const civilId = currentUserEmail.split('@')[0].trim();
      const staffDoc = await findStaffByCivilId(civilId);
      if (staffDoc) {
        const docData = staffDoc.data;
        return {
          uid,
          civilId,
          nationalId: docData.nationalId || civilId,
          nameAr: docData.nameAr || docData.displayName || 'منسوب معتمد',
          displayName: docData.displayName || docData.nameAr || '',
          email: currentUserEmail,
          role: docData.role || 'officer',
          permissions: docData.permissions || {},
          workField: docData.workField || docData.unit || '',
          unit: docData.unit || docData.workField || '',
          mobile: docData.mobile || '',
          ...docData
        } as UserProfile;
      }
    }

    return null;
  } catch (err: any) {
    console.warn("⚠️ [Firestore Note]: Could not read user profile:", err?.message || err);
    return null;
  }
}

/**
 * Fetches the verified role from the /users document in Firestore
 */
export async function getUserRole(uid: string): Promise<'admin' | 'officer' | 'beneficiary' | null> {
  try {
    const profile = await getUserProfile(uid);
    if (profile) {
      if (profile.role === 'admin') return 'admin';
      if (profile.role && profile.role !== 'beneficiary') return 'officer';
      return 'beneficiary';
    }
    return null;
  } catch (err: any) {
    console.warn("⚠️ [Firestore Note]: Could not read user role from /users/" + uid, err?.message, err);
    return null;
  }
}

export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system_config', 'health_check'));
    return true;
  } catch {
    return false;
  }
}

export { app };
