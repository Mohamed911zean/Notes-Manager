import { create } from "zustand";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export const useAuthStore = create((set) => ({
  user: null,
  // Added loading state to prevent flickering during initial auth check
  loading: true, 

  setUser: (user) => set({ user, loading: false }),

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
}));