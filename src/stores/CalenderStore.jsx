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
        const data = JSON.stringify({ 
          state: { 
            plans: state.plans 
          } 
        });
        localStorage.setItem(newKey, data);
      },


addPlan: async (plan) => {
  const { selectedDate, user } = get(); // user هنا لازم يكون موجود بعد تسجيل الدخول

  const newPlan = {
    id: crypto.randomUUID(),
    title: plan.title,
    time: plan.time,
    priority: plan.priority,
    type: plan.type,
    completed: false,
    dateISO: selectedDate, // مهم جداً
  };

  // أولاً نضيفها local state
  set((state) => ({
    plans: [...state.plans, newPlan],
  }));

  // بعدين نخزنها في Firebase
  if (user) {
    try {
      // merge:true يعني نضيف البيانات الجديدة من غير ما نمس باقي المستند
      await setDoc(
        doc(db, "users", user.uid),
        { plans: get().plans }, 
        { merge: true }
      );
    } catch (error) {
      console.error("Failed to add plan to Firebase:", error);
  }}
},

    togglePlan: (id) => {
  const currentPlans = get().plans;

  if (!Array.isArray(currentPlans)) {
    console.error("plans is not an array:", currentPlans);
    return;
  }

  set({
    plans: currentPlans.map(plan =>
      plan.id === id
        ? { ...plan, completed: !plan.completed }
        : plan
    ),
  });
},


     removePlan: (id) => {
  const currentPlans = get().plans;

  if (!Array.isArray(currentPlans)) {
    console.error("plans is not an array:", currentPlans);
    set({ plans: [] });
    return;
  }

  set({
    plans: currentPlans.filter(plan => plan.id !== id),
  });
},


      getPlannedToday: (dateISO) => {
        const plans = get().plans[dateISO] || [];
        return plans;
      },

    getPlansByDate: (dateISO) => {
  return get().plans.filter(
    (plan) => plan.dateISO === dateISO
  );
},


getDatesWithPlans: () => {
  return [...new Set(get().plans.map(p => p.dateISO))];
},



      setSelectedDate: (dateISO) => {
        set({ selectedDate: dateISO });
      },


      syncToFirestore: async () => {
        const { user, plans } = get();
        if (!user) return;
        
        try {
          await setDoc(
            doc(db, "users", user.uid),
            { plans },
            { merge: true }
          );
        } catch (error) {
          console.error("Failed to sync to Firebase:", error);
        }
      },

      fetchFromFirestore: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            set({
              plans: data.plans || [],
            });
          }
        } catch (error) {
          console.error("Failed to fetch from Firebase:", error);
        }
      },
    }),
    {
      name: "calendar-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        plans: state.plans,
      }),
    }
  )
);