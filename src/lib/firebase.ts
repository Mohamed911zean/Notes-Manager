import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { useTodoStore } from "../stores/NotestMangerStore.jsx"; // ✨ مهم: عدّل المسار حسب مكان الستور

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* -------------------------------------------------------
   🔥 Sync Part — يعمل تلقائي بمجرد فتح الموقع
-------------------------------------------------------- */
onAuthStateChanged(auth, (user) => {
  const store = useTodoStore.getState();

  if (user) {
    // 1) خزّن اليوزر في الستور
    store.setUser(user);

    // 2) هات بياناته من Firestore
    store.fetchFromFirestore();
  }
});

export default app;
