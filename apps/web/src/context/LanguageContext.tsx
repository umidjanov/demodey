"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { uz } from "../locales/uz";
import { ru } from "../locales/ru";
import { en } from "../locales/en";

export type Language = "uz" | "ru" | "en";

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof uz;
  languages: { code: Language; name: string; flag: string }[];
}

const DICTIONARIES = {
  uz,
  ru,
  en,
};

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: "uz", name: "O'zbekcha", flag: "🇺🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

const LanguageContext = createContext<LanguageContextType>({
  language: "uz",
  setLanguage: () => {},
  t: uz,
  languages: LANGUAGES,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("uz");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("quizora_language") as Language;
      if (saved && (saved === "uz" || saved === "ru" || saved === "en")) {
        setLanguageState(saved);
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("quizora_language", lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore
    }
  };

  const t = DICTIONARIES[language] || uz;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
