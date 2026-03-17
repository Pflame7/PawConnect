import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYg9QBYD_IwuV8h-2ChyyjMdtW2V2dYjw",
  authDomain: "pawconnect-f0a7b.firebaseapp.com",
  projectId: "pawconnect-f0a7b",
  storageBucket: "pawconnect-f0a7b.firebasestorage.app",
  messagingSenderId: "720707315200",
  appId: "1:720707315200:web:db6e1d3e4ee9c98fc59ae5",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
 * Firestore с memory cache (без IndexedDB persistence)
 * Това избягва crash-овете при refresh + snapshot listeners
 */
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});