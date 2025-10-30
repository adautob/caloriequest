// NOTE: This file should not have a "use client" or "use server" directive.
// It's a shared utility that can be used in different environments.

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// Cache the initialized app and services to avoid re-initialization
let serverFirebaseApp: FirebaseApp | null = null;
let serverFirestore: ReturnType<typeof getFirestore> | null = null;

/**
 * Initializes and returns a Firestore instance for use in server-side contexts
 * like Server Actions or Route Handlers. It ensures that initialization happens
 * only once.
 *
 * This function should NOT be used in client components.
 *
 * @returns An object containing the Firestore instance.
 */
export function getFirestoreForServerAction() {
  if (serverFirebaseApp && serverFirestore) {
    return { firestore: serverFirestore };
  }

  // Check if an app is already initialized. This can happen in serverless environments
  // where the container is reused.
  if (getApps().length === 0) {
    // If no app is initialized, initialize one.
    // In a server context, we must provide the config explicitly.
    serverFirebaseApp = initializeApp(firebaseConfig);
  } else {
    // If apps are already present, get the default app.
    serverFirebaseApp = getApp();
  }

  serverFirestore = getFirestore(serverFirebaseApp);

  return { firestore: serverFirestore };
}
