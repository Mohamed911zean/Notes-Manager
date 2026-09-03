import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const useCalenderStore = create(
  persist(
    (set, get) => ({
      user: null,
      plans: [],
      isLoading: false,
      selectedDate: new Date().toLocaleDateString("en-CA"),

      setUser: async (user) => {
        set({ user, isLoading: true });
        if (user) {
          await get().fetchFromFirestore();
          get().changeStorageKey(`calendar-storage-${user.uid}`);
        } else {
          set({ plans: [] });
          get().changeStorageKey("calendar-storage-guest");
        }
        set({ isLoading: false });
      },

      changeStorageKey: (newKey) => {
        const state = get();
        const data = JSON.stringify({ state: { plans: state.plans } });
        localStorage.setItem(newKey, data);
      },

      addPlan: async (plan) => {
        const newPlan = {
          id: crypto.randomUUID(),
          title: plan.title,
          description: plan.description || "",
          time: plan.time || "",
          endTime: plan.endTime || "",
          priority: plan.priority || "medium",
          category: plan.category || "personal",
          color: plan.color || "",
          completed: false,
          dateISO: plan.dateISO || get().selectedDate,
          recurrence: plan.recurrence || null,
          subtasks: plan.subtasks || [],
          createdAt: Date.now(),
        };

        set((state) => ({ plans: [...state.plans, newPlan] }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(
              doc(db, "users", user.uid),
              { plans: get().plans },
              { merge: true }
            );
          } catch (error) {
            console.error("Failed to add plan:", error);
          }
        }
      },

      updatePlan: async (id, updates) => {
        set((state) => ({
          plans: state.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(
              doc(db, "users", user.uid),
              { plans: get().plans },
              { merge: true }
            );
          } catch (error) {
            console.error("Failed to update plan:", error);
          }
        }
      },

      togglePlan: (id) => {
        set({
          plans: get().plans.map((p) =>
            p.id === id ? { ...p, completed: !p.completed } : p
          ),
        });
      },

      removePlan: (id) => {
        set({ plans: get().plans.filter((p) => p.id !== id) });
      },

      movePlan: async (id, newDateISO) => {
        const oldPlans = get().plans;
        set((state) => ({
          plans: state.plans.map((p) => (p.id === id ? { ...p, dateISO: newDateISO } : p)),
        }));
        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, "users", user.uid), { plans: get().plans }, { merge: true });
          } catch (error) {
            console.error("Failed to sync move plan:", error);
            set({ plans: oldPlans });
          }
        }
      },

      getPlansByDate: (dateISO) => {
        const plans = get().plans;
        const result = [];
        plans.forEach((p) => {
          if (p.dateISO === dateISO) { result.push(p); return; }
          if (p.recurrence && p.dateISO < dateISO) {
            let nextDate = p.dateISO;
            const maxIter = 365;
            let i = 0;
            while (nextDate < dateISO && i < maxIter) {
              if (p.recurrence.type === "daily") {
                const d = new Date(nextDate + "T00:00:00"); d.setDate(d.getDate() + 1);
                nextDate = d.toLocaleDateString("en-CA");
              } else if (p.recurrence.type === "weekly") {
                const d = new Date(nextDate + "T00:00:00"); d.setDate(d.getDate() + 7);
                nextDate = d.toLocaleDateString("en-CA");
              } else if (p.recurrence.type === "monthly") {
                const d = new Date(nextDate + "T00:00:00"); d.setMonth(d.getMonth() + 1);
                nextDate = d.toLocaleDateString("en-CA");
              } else break;
              i++;
            }
            if (nextDate === dateISO) {
              result.push({ ...p, _isRecurrenceInstance: true, _originalDate: p.dateISO });
            }
          }
        });
        return result;
      },

      getDatesWithPlans: () => {
        return [...new Set(get().plans.map((p) => p.dateISO))];
      },

      setSelectedDate: (dateISO) => {
        set({ selectedDate: dateISO });
      },

      syncToFirestore: async () => {
        const { user, plans } = get();
        if (!user) return;
        try {
          await setDoc(doc(db, "users", user.uid), { plans }, { merge: true });
        } catch (error) {
          console.error("Failed to sync:", error);
        }
      },

      fetchFromFirestore: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            set({ plans: data.plans || [] });
          }
        } catch (error) {
          console.error("Failed to fetch:", error);
        }
      },
    }),
    {
      name: "calendar-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ plans: state.plans }),
    }
  )
);
