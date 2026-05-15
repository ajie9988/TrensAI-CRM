import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant_id: number;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    setUser: (user: User) =>
      set(
        (state) => ({
          user,
          isAuthenticated: !!user,
        }),
        false,
        "setUser"
      ),

    setToken: (token: string) =>
      set(
        (state) => ({
          token,
        }),
        false,
        "setToken"
      ),

    logout: () =>
      set(
        {
          user: null,
          token: null,
          isAuthenticated: false,
        },
        false,
        "logout"
      ),
  }))
);
