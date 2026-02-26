import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_USERS } from "../lib/mockData";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (passcode) => {
        const user = MOCK_USERS.find((u) => u.passcode === passcode);
        if (!user) throw new Error("Invalid passcode");
        set({ user, isAuthenticated: true });
        return user;
      },

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "auth-store" },
  ),
);
