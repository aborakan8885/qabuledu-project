import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, collection } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system_config', 'health_check'));
    return true;
  } catch (error: any) {
    // If permission or document not found, it still proves connection is reachable
    if (error?.code === 'unavailable' || error?.message?.includes('the client is offline')) {
      console.warn('Firestore connection offline:', error);
      return false;
    }
    return true;
  }
}

export { app };
