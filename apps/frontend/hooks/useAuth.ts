"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/api";

/**
 * Hook terpusat untuk autentikasi.
 * - Hydrate user dari API saat pertama kali mount (jika token ada).
 * - Expose login, logout, dan state auth.
 */
export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, setUser, setToken, logout: clearStore } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  /** Hydrate user profile dari server */
  const hydrateUser = useCallback(async () => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!storedToken || user) {
      setIsLoading(false);
      return;
    }

    try {
      setToken(storedToken);
      const res = await authService.getCurrentUser();
      setUser(res.data.data ?? res.data);
    } catch {
      // Token tidak valid, bersihkan
      localStorage.removeItem("auth_token");
      clearStore();
    } finally {
      setIsLoading(false);
    }
  }, [user, setToken, setUser, clearStore]);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  /** Login dan simpan token */
  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authService.login(email, password);
      const data = res.data.data ?? res.data;
      const authToken: string = data.token ?? data.access_token;

      localStorage.setItem("auth_token", authToken);
      setToken(authToken);
      setUser(data.user ?? data);

      router.push("/dashboard");
    },
    [router, setToken, setUser]
  );

  /** Logout — hapus token dan redirect ke login */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Abaikan jika gagal (token sudah expired)
    }
    localStorage.removeItem("auth_token");
    clearStore();
    router.push("/auth/login");
  }, [router, clearStore]);

  return { user, token, isAuthenticated, isLoading, login, logout };
}
