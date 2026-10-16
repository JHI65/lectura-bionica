// Cliente de Firebase. Si no hay configuración, la app funciona sin cuenta.
// El SDK se importa de forma diferida: sin Premium no se descarga ni hace red.
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Functions } from 'firebase/functions';
import { config, isFirebaseConfigured } from '../state/config';

export interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  functions: Functions;
}

let pending: Promise<FirebaseClient | null> | null = null;

export function getFirebase(): Promise<FirebaseClient | null> {
  if (!isFirebaseConfigured) return Promise.resolve(null);
  pending ??= (async () => {
    const [{ initializeApp }, { getAuth, connectAuthEmulator }, { getFirestore, connectFirestoreEmulator }, { getFunctions, connectFunctionsEmulator }] =
      await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore'), import('firebase/functions')]);
    const { apiKey, authDomain, projectId, appId, functionsRegion, useEmulators } = config.firebase;
    const app = initializeApp({ apiKey, authDomain: authDomain || `${projectId}.firebaseapp.com`, projectId, appId });
    const auth = getAuth(app);
    const db = getFirestore(app);
    const functions = getFunctions(app, functionsRegion);
    if (useEmulators) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    }
    return { app, auth, db, functions };
  })();
  return pending;
}
