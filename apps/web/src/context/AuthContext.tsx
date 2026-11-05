"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getStoredToken, setStoredToken } from "@/src/lib/api";

interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url?: string;
}

interface Profile {
  level: number;
  level_title: string;
  total_xp: number;
  ranking_coins: number;
  current_streak: number;
  completed_quizzes_count: number;
  total_correct_answers?: number;
  total_incorrect_answers?: number;
  average_score: number;
  rank_position: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (data: string | { email?: string; first_name?: string; last_name?: string; avatar_url?: string; credential?: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUserLocally: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const p = await api.getProfile();
      if (p) {
        // Read local overrides if the user edited their profile
        let localOverrides: any = null;
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem(`quizora_profile_${p.user_id}`);
            if (raw) localOverrides = JSON.parse(raw);
          } catch {}
        }

        const firstName = localOverrides?.first_name || p.first_name || "";
        const lastName = localOverrides?.last_name || p.last_name || "";
        const avatarUrl = localOverrides?.avatar_url || p.avatar_url;

        p.first_name = firstName;
        p.last_name = lastName;
        if (avatarUrl) p.avatar_url = avatarUrl;
        setProfile(p);

        setUser((prev) => ({
          id: p.user_id,
          email: p.email || prev?.email || "",
          username: p.username || prev?.username || "learner",
          first_name: firstName || prev?.first_name || "",
          last_name: lastName || prev?.last_name || "",
          role: p.role || prev?.role || "user",
          avatar_url: avatarUrl || prev?.avatar_url,
        }));
      }
    } catch {
      // Invalid session or logged out
      setStoredToken(null);
      setToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    const savedToken = getStoredToken();
    if (savedToken) {
      setToken(savedToken);
      fetchProfile().finally(() => setIsLoading(false));
    } else {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (param: string | { email?: string; first_name?: string; last_name?: string; avatar_url?: string; credential?: string }) => {
    setIsLoading(true);
    try {
      const payload = typeof param === "string" ? { credential: param } : param;
      const res = await api.googleAuth(payload);
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserLocally = (updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updated };
      if (typeof window !== "undefined") {
        try {
          const key = `quizora_profile_${prev.id}`;
          const raw = localStorage.getItem(key);
          const existing = raw ? JSON.parse(raw) : {};
          localStorage.setItem(key, JSON.stringify({ ...existing, ...updated }));
        } catch {}
      }
      return merged;
    });
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        refreshProfile: fetchProfile,
        updateUserLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
