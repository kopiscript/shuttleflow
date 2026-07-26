// user-app/context/LanguageContext.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "zh" | "ms";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    "home.title": "Track your Bus",
    "home.subtitle": "Choose a route to track the bus live on the map.",
    "home.selectRoute": "Select route",
    "home.selectRouteHint": "Select a route to see ETA",
    "home.disclaimer": "ETA may vary due to traffic",
    "home.etaUnavailable": "ETA unavailable",
    "home.loadingRoutes": "Loading routes...",
    "home.noRoutes": "No routes available",
    "settings.title": "Settings",
    "settings.subtitle": "Manage your preferences",
    "settings.systemNotification": "System Notifications",
    "settings.emailNotification": "Email Notifications",
    "settings.languages": "Languages",
    "settings.theme": "Theme",
    "common.loading": "Loading...",
    "sidebar.home": "Home",
    "sidebar.about": "About",
    "sidebar.support": "Support",
    "sidebar.settings": "Settings",
  },
  zh: {
    "home.title": "追踪您的巴士",
    "home.subtitle": "选择路线以在地图上实时追踪巴士。",
    "home.selectRoute": "选择路线",
    "home.selectRouteHint": "选择路线以查看预计到达时间",
    "home.disclaimer": "预计到达时间可能因交通状况而变化",
    "home.etaUnavailable": "预计到达时间不可用",
    "home.loadingRoutes": "加载路线中...",
    "home.noRoutes": "没有可用路线",
    "settings.title": "设置",
    "settings.subtitle": "管理您的偏好",
    "settings.systemNotification": "系统通知",
    "settings.emailNotification": "邮件通知",
    "settings.languages": "语言",
    "settings.theme": "主题",
    "common.loading": "加载中...",
    "sidebar.home": "首页",
    "sidebar.about": "关于",
    "sidebar.support": "支持",
    "sidebar.settings": "设置",
  },
  ms: {
    "home.title": "Jejaki Bas Anda",
    "home.subtitle": "Pilih laluan untuk menjejak bas secara langsung pada peta.",
    "home.selectRoute": "Pilih laluan",
    "home.selectRouteHint": "Pilih laluan untuk melihat ETA",
    "home.disclaimer": "ETA mungkin berbeza disebabkan oleh trafik",
    "home.etaUnavailable": "ETA tidak tersedia",
    "home.loadingRoutes": "Memuatkan laluan...",
    "home.noRoutes": "Tiada laluan tersedia",
    "settings.title": "Tetapan",
    "settings.subtitle": "Urus pilihan anda",
    "settings.systemNotification": "Pemberitahuan Sistem",
    "settings.emailNotification": "Pemberitahuan E-mel",
    "settings.languages": "Bahasa",
    "settings.theme": "Tema",
    "common.loading": "Memuatkan...",
    "sidebar.home": "Laman Utama",
    "sidebar.about": "Perihal",
    "sidebar.support": "Sokongan",
    "sidebar.settings": "Tetapan",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language | null;
    if (saved && saved in translations) setLanguage(saved);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
}