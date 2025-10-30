// IMPORTANT: Do not use this code in the client. This is server-side code.

import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// When credential is not set, Firebase Admin SDK will automatically look for
// GOOGLE_APPLICATION_CREDENTIALS environment variable.
const firebaseAdminConfig: FirebaseOptions = {
    projectId: firebaseConfig.projectId,
};

function initializeFirebaseAdmin() {
  if (!getApps().length) {
    initializeApp(firebaseAdminConfig);
  }
}

export function getFirebase() {
  initializeFirebaseAdmin();
  return {
    auth: getAuth(),
    firestore: getFirestore(),
  };
}
