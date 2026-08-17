import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, initializeAuth } from 'firebase/auth';
import { Firestore, initializeFirestore } from 'firebase/firestore';

// getReactNativePersistence esiste nel bundle React Native del SDK (dist/rn/index.rn.d.ts) ma la
// risoluzione dei tipi di TypeScript per "firebase/auth" punta al bundle generico, che non lo
// espone — vedi firebase-js-sdk#9316. Funziona comunque a runtime.
// @ts-expect-error vedi commento sopra
import { getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isTradeBoardConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

/**
 * La bacheca online è l'unica parte dell'app che dipende da un server: se non è stato configurato
 * un progetto Firebase (vedi README), `auth`/`db` restano `null` e le schermate della bacheca
 * mostrano un messaggio invece di provare a chiamare un progetto inesistente.
 */
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isTradeBoardConfigured) {
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  // Il trasporto realtime di default di Firestore ha problemi noti su React Native
  // (scritture che falliscono, soprattutto iOS): il long polling forzato è il workaround
  // raccomandato — vedi firebase-js-sdk#8864.
  db = initializeFirestore(app, { experimentalForceLongPolling: true });
}

export { auth, db };
