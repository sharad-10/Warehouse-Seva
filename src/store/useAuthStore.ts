import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type User = {
  email: string;
  name: string;
  phone: string;
  password: string;
};

type AuthState = {
  user: User | null;
  savedUser: User | null;

  signup: (
    email: string,
    name: string,
    phone: string,
    password: string,
  ) => boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      savedUser: null,

      signup: (email, name, phone, password) => {
        const existing = get().savedUser;

        if (existing && existing.email === email) {
          return false;
        }

        const newUser = {
          email,
          name,
          phone,
          password,
        };

        set({
          user: newUser,
          savedUser: newUser,
        });

        return true;
      },

      login: (email, password) => {
        const { savedUser } = get();

        if (
          savedUser &&
          savedUser.email === email &&
          savedUser.password === password
        ) {
          set({ user: savedUser });
          return true;
        }

        return false;
      },

      logout: () => set({ user: null }),

      updateProfile: (data) =>
        set((state) => {
          if (!state.savedUser) return state;

          const updatedUser = { ...state.savedUser, ...data };

          return {
            user: updatedUser,
            savedUser: updatedUser,
          };
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
