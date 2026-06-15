"use client";

import { useState, useEffect } from "react";
import PageShell from "../../components/PageShell";
import { FaSun, FaMoon } from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import EmailSubscribe from "../../components/EmailSubscribe";

export default function SettingsPage() {
    // Add mounted state to prevent hydration issues
    const [pageMounted, setPageMounted] = useState(false);

    useEffect(() => {
        setPageMounted(true);
    }, []);

    const { t, setLanguage: setAppLanguage } = useLanguage();
    const { theme: currentTheme, toggleTheme } = useTheme();

    // State for toggles - initialize with null first
    const [systemNotifications, setSystemNotifications] = useState<boolean | null>(null);
    const [language, setLanguage] = useState<string | null>(null);

    // Options
    const languages = ["English", "中文", "Bahasa Malaysia"];
    const isDarkMode = currentTheme === "dark";

    // Map display language to internal code
    const getLanguageCode = (displayLang: string): 'en' | 'zh' | 'ms' => {
        switch (displayLang) {
            case "English": return 'en';
            case "中文": return 'zh';
            case "Bahasa Malaysia": return 'ms';
            default: return 'en';
        }
    };

    // Load settings from localStorage when page loads (excluding theme)
    useEffect(() => {
        const savedSettings = localStorage.getItem('shuttleflow_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                setSystemNotifications(settings.systemNotifications ?? true);
                setLanguage(settings.language ?? "English");
            } catch (error) {
                console.error("Failed to load settings:", error);
                setSystemNotifications(true);
                setLanguage("English");
            }
        } else {
            setSystemNotifications(true);
            setLanguage("English");
        }
    }, []);

    // Save settings to localStorage (excluding theme)
    useEffect(() => {
        if (systemNotifications !== null && language !== null) {
            const settings = {
                systemNotifications,
                language,
            };
            localStorage.setItem('shuttleflow_settings', JSON.stringify(settings));
        }
    }, [systemNotifications, language]);

    // Handle language change
    const handleLanguageChange = (newLanguage: string) => {
        setLanguage(newLanguage);
        setAppLanguage(getLanguageCode(newLanguage));
    };

    // Don't render until page is mounted on client
    if (!pageMounted || systemNotifications === null || language === null) {
        return (
            <PageShell
                header={
                    <>
                        <h1 className="text-center text-foreground text-3xl font-bold mt-6 font-['Bai_Jamjuree']">
                            {t("settings.title")}
                        </h1>
                        <p className="font-['Bai_Jamjuree'] text-center text-foreground text-base font-medium mt-2 px-4">
                            {t("settings.subtitle")}
                        </p>
                    </>
                }
            >
                <div className="px-6 pb-8">
                    <div className="font-['Inter'] max-w-md mx-auto">
                        <div className="text-center text-foreground">{t("common.loading")}</div>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell
            header={
                <>
                    <h1 className="text-center text-foreground text-3xl font-bold mt-6 font-['Bai_Jamjuree']">
                        {t("settings.title")}
                    </h1>
                    <p className="font-['Bai_Jamjuree'] text-center text-foreground text-base font-medium mt-2 px-4">
                        {t("settings.subtitle")}
                    </p>
                </>
            }
        >
            <div className="px-6 pb-8">
                <div className="font-['Inter'] max-w-md mx-auto">

                    {/* System Notification Toggle */}
                    <div className="mb-7">
                        <div className="w-full bg-(--glass-bg) backdrop-blur-md border border-white/30 rounded-xl shadow-md py-5 px-4 flex items-center justify-between">
                            <span className="text-(--dropdown-text) font-bold text-base">{t("settings.systemNotification")}</span>
                            <button
                                type="button"
                                onClick={() => setSystemNotifications(!systemNotifications)}
                                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 ${systemNotifications ? "bg-[#99121A]" : "bg-gray-300 dark:bg-gray-600"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${systemNotifications ? "translate-x-9" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Languages Selection */}
                    <div className="mb-7">
                        <div className="w-full bg-(--glass-bg) backdrop-blur-md border border-white/30 rounded-xl shadow-md py-5 px-4 flex items-center justify-between">
                            <span className="text-(--dropdown-text) font-bold text-base">{t("settings.languages")}</span>
                            <div className="relative">
                                <select
                                    value={language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    className="appearance-none bg-gray-50/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-8 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 focus:border-[#99121A] shadow-inner"
                                >
                                    {languages.map((lang) => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                                <svg
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Theme Toggle - Uses ThemeContext directly */}
                    <div className="mb-7">
                        <div className="w-full bg-(--glass-bg) backdrop-blur-md border border-white/30 rounded-xl shadow-md py-5 px-4 flex items-center justify-between">
                            <span className="text-(--dropdown-text) font-bold text-base">{t("settings.theme")}</span>
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 ${isDarkMode ? "bg-gray-600" : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full transition-transform items-center justify-center ${isDarkMode ? "translate-x-9 bg-gray-900" : "translate-x-1 bg-white"
                                        }`}
                                >
                                    <div className="flex items-center justify-center w-full h-full">
                                        {isDarkMode ? (
                                            <FaMoon className="w-3 h-3 text-white" />
                                        ) : (
                                            <FaSun className="w-3 h-3 text-black" />
                                        )}
                                    </div>
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Divider Line */}
                    <div className="my-8 border-t border-white/50"></div>

                    {/* Email Subscription Section */}
                    <div className="mt-4">
                        <EmailSubscribe />
                    </div>

                </div>
            </div>
        </PageShell>
    );
}