'use server';

import admin from 'firebase-admin';

// Singleton pattern for Firebase connection
class FirebaseConnection {
  constructor() {
    if (FirebaseConnection.instance) {
      return FirebaseConnection.instance;
    }
    FirebaseConnection.instance = this;
    this.initialize();
  }

  async initialize() {
    if (this.db) {
      return;
    }

    try {
      // Check if Firebase is already initialized
      if (!admin.apps.length) {
        // In development, use emulators
        const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

        if (useEmulator) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      if (!projectId) {
        throw new Error('FIREBASE_PROJECT_ID is not set');
      }

      console.log('Initializing Firebase Admin with project ID:', projectId);
          this.app = admin.initializeApp({
            projectId,
            credential: admin.credential.cert({
              projectId,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'fake@email.com',
              privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\n/g, '\n')
            })
          });

          // Connect to Firestore emulator
          const emulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;
          if (!emulatorHost) {
            throw new Error('NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST is not set');
          }

          const [host, port] = emulatorHost.split(':');
          if (!host || !port) {
            throw new Error('Invalid emulator host format. Expected format: host:port');
          }

          this.db = admin.firestore();
          this.db.settings({
            host: `${host}:${port}`,
            ssl: false,
            experimentalForceLongPolling: true,
            ignoreUndefinedProperties: true,
            cacheSizeBytes: admin.firestore.CACHE_SIZE_UNLIMITED
          });

          // Test the connection
          try {
            const testRef = this.db.collection('boxes').doc('test');
            await testRef.set({ test: true });
            await testRef.delete();
            console.log('Successfully connected to Firestore emulator');
          } catch (error) {
            console.error('Failed to connect to Firestore emulator:', error);
            throw new Error('Failed to connect to Firestore emulator: ' + error.message);
          }
        } else {
          // In production, use real credentials
          const projectId = process.env.FIREBASE_PROJECT_ID;
          const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
          const privateKey = process.env.FIREBASE_PRIVATE_KEY;

          if (!projectId || !clientEmail || !privateKey) {
            throw new Error('Firebase credentials are missing. Please check your environment variables.');
          }

          this.app = admin.initializeApp({
            projectId,
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\n/g, '\n')
            })
          });
          this.db = admin.firestore();
        }
      } else {
        this.app = admin.app();
        this.db = admin.firestore();
      }
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
      console.error('Error details:', {
        isEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
        projectId: process.env.FIREBASE_PROJECT_ID,
        emulatorHost: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST
      });
      throw error;
    }
  }

  getFirestore() {
    return this.db;
  }

  getApp() {
    return this.app;
  }
}

// Create a singleton instance
const firebaseConnection = new FirebaseConnection();

export async function getFirestore() {
  await firebaseConnection.initialize();
  return firebaseConnection.getFirestore();
}

export async function getApp() {
  await firebaseConnection.initialize();
  return firebaseConnection.getApp();
}
