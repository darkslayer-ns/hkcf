// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  // Connect to Firestore emulator
  const [firestoreHost, firestorePort] = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, firestoreHost, parseInt(firestorePort));

  // Connect to Auth emulator
  const authUrl = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
  if (authUrl) {
    connectAuthEmulator(auth, authUrl);
  }

  // Connect to Storage emulator
  const [storageHost, storagePort] = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST.split(':');
  connectStorageEmulator(storage, storageHost, parseInt(storagePort));

  // Connect to Functions emulator
  const [functionsHost, functionsPort] = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST.split(':');
  connectFunctionsEmulator(functions, functionsHost, parseInt(functionsPort));

  console.log('Connected to Firebase emulators');
}

export { db, auth, storage, functions };
