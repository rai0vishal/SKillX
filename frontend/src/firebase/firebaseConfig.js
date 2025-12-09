import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_ID",
  storageBucket: "YOUR_ID.appspot.com",   // ✅ ADD THIS
  messagingSenderId: "YOUR_SENDER_ID",    // ✅ ADD THIS
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

// ✅ SERVICES
export const auth = getAuth(app);
export const db = getFirestore(app);      // ✅ DATABASE
export const storage = getStorage(app);  // ✅ FILE UPLOAD

export default app;
