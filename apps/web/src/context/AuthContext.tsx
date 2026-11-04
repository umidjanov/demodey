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
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
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
      setProfile(p);
      if (p) {
        setUser((prev) => ({
          id: p.user_id,
          email: p.email || prev?.email || "",
          username: p.username || prev?.username || "learner",
          first_name: p.first_name || prev?.first_name || "",
          last_name: p.last_name || prev?.last_name || "",
          role: p.role || prev?.role || "user",
          avatar_url: p.avatar_url || prev?.avatar_url,
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

  const googleLogin = async (credential: string) => {
    setIsLoading(true);
    try {
      const res = await api.googleAuth({ credential });
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
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
