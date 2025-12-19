import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { useNotesStore } from "../stores/useNotesStore.jsx";
import { useTasksStore } from "../stores/useTasksStore.jsx";

import { useAuthStore } from "../stores/AuthStore.jsx";

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
  // Update the main Auth Store first
  useAuthStore.getState().setUser(user);

  const notesStore = useNotesStore.getState();
  const tasksStore = useTasksStore.getState();

  if (user) {
    notesStore.setUser(user);
    tasksStore.setUser(user);
    notesStore.fetchFromFirestore();
    tasksStore.fetchFromFirestore();
  } else {
    // Clear data on logout
    notesStore.setUser(null);
    tasksStore.setUser(null);
  }
});
