// app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import PageShell from "../../components/PageShell";
import { FaSun, FaMoon } from "react-icons/fa";

export default function SettingsPage() {
    // State for toggles - initialize with null first
    const [systemNotifications, setSystemNotifications] = useState<boolean | null>(null);
    const [emailNotifications, setEmailNotifications] = useState<boolean | null>(null);
    const [language, setLanguage] = useState<string | null>(null);
    const [theme, setTheme] = useState<string | null>(null);

    // Options
    const languages = ["English", "中文", "Bahasa Malaysia"];
    const isDarkMode = theme === "Dark";

    // Load settings from localStorage when page loads
    useEffect(() => {
        const savedSettings = localStorage.getItem('shuttleflow_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                setSystemNotifications(settings.systemNotifications ?? true);
                setEmailNotifications(settings.emailNotifications ?? true);
                setLanguage(settings.language ?? "English");
                setTheme(settings.theme ?? "Light");
            } catch (error) {
                console.error("Failed to load settings:", error);
                // Set defaults if error
                setSystemNotifications(true);
                setEmailNotifications(true);
                setLanguage("English");
                setTheme("Light");
            }
        } else {
            // No saved settings, use defaults
            setSystemNotifications(true);
            setEmailNotifications(true);
            setLanguage("English");
            setTheme("Light");
        }
    }, []);

    // Save settings to localStorage whenever any setting changes
    useEffect(() => {
        // Only save if all settings have been initialized (not null)
        if (systemNotifications !== null && emailNotifications !== null && language !== null && theme !== null) {
            const settings = {
                systemNotifications,
                emailNotifications,
                language,
                theme,
            };
            localStorage.setItem('shuttleflow_settings', JSON.stringify(settings));

            // Apply theme to document body
            if (theme === "Dark") {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [systemNotifications, emailNotifications, language, theme]);

    // Don't render until settings are loaded
    if (systemNotifications === null || emailNotifications === null || language === null || theme === null) {
        return (
            <PageShell
                header={
                    <>
                        <h1 className="text-center text-white text-3xl font-bold mt-6 font-['Bai_Jamjuree']">
                            Settings
                        </h1>
                        <p className="font-['Bai_Jamjuree'] text-center text-white text-base font-medium mt-2 px-4">
                            Manage your preferences
                        </p>
                    </>
                }
            >
                <div className="px-6 pb-8">
                    <div className="font-['Inter'] max-w-md mx-auto">
                        <div className="text-center text-white">Loading settings...</div>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell
            header={
                <>
                    <h1 className="text-center text-white text-3xl font-bold mt-6 font-['Bai_Jamjuree']">
                        Settings
                    </h1>
                    <p className="font-['Bai_Jamjuree'] text-center text-white text-base font-medium mt-2 px-4">
                        Manage your preferences
                    </p>
                </>
            }
        >
            <div className="px-6 pb-8">
                <div className="font-['Inter'] max-w-md mx-auto">

                    {/* System Notification Toggle */}
                    <div className="mb-7">
                        <div className="w-full bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md py-5 px-4 flex items-center justify-between">
                            <span className="text-gray-800 font-bold text-base">System Notification</span>
                            <button
                                type="button"
                                onClick={() => setSystemNotifications(!systemNotifications)}
                                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 ${systemNotifications ? "bg-[#99121A]" : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${systemNotifications ? "translate-x-9" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Email Notification Toggle */}
                    <div className="mb-7">
                        <div className="w-full bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md py-5 px-4 flex items-center justify-between">
                            <span className="text-gray-800 font-bold text-base">Email Notification</span>
                            <button
                                type="button"
                                onClick={() => setEmailNotifications(!emailNotifications)}
                                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 ${emailNotifications ? "bg-[#99121A]" : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${emailNotifications ? "translate-x-9" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Languages Selection */}
                    <div className="mb-7">
                        <div className="w-full bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md py-5 px-4 flex items-center justify-between">
                            <span className="text-gray-800 font-bold text-base">Languages</span>
                            <div className="relative">
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="appearance-none bg-gray-50/80 border border-gray-200 rounded-lg px-4 py-2.5 pr-8 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 focus:border-[#99121A] shadow-inner"
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

                    {/* Theme Toggle - Font Awesome Sun/Moon Icons */}
                    <div className="mb-7">
                        <div className="w-full bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md py-5 px-4 flex items-center justify-between">
                            <span className="text-gray-800 font-bold text-base">Theme</span>
                            <button
                                type="button"
                                onClick={() => setTheme(isDarkMode ? "Light" : "Dark")}
                                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 ${isDarkMode ? "bg-gray-600" : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full transition-transform flex items-center justify-center ${isDarkMode ? "translate-x-9 bg-gray-900" : "translate-x-1 bg-white"
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

                </div>
            </div>
        </PageShell>
    );
}