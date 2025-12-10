// Firebase Configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Firebase config from Vite define (already parsed)
const firebaseConfig = __firebase_config;

// Initialize Firebase - prevent duplicate initialization
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] Initialized new app');
} else {
    app = getApp();
    console.log('[Firebase] Using existing app');
}

export { app };
export const auth = getAuth(app);

// Enable persistent auth (survives refresh)
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Auth persistence error:", err);
});

// Initialize Firestore with local persistence for better offline/refresh support
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

// App ID for Firestore path
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
