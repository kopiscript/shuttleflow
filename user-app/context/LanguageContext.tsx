"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh' | 'ms';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [isInitialized, setIsInitialized] = useState(false);

    // Load saved language from localStorage when app starts
    useEffect(() => {
        const savedSettings = localStorage.getItem('shuttleflow_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                const savedLanguage = settings.language;
                if (savedLanguage === 'English') setLanguage('en');
                else if (savedLanguage === 'Chinese') setLanguage('zh');
                else if (savedLanguage === 'Bahasa Malaysia') setLanguage('ms');
                else setLanguage('en');
            } catch (error) {
                console.error("Failed to load language from settings:", error);
            }
        }
        setIsInitialized(true);
    }, []);

    // SAVE language to localStorage whenever it changes
    useEffect(() => {
        if (!isInitialized) return;

        // Get existing settings
        let existingSettings = {};
        const savedSettings = localStorage.getItem('shuttleflow_settings');
        if (savedSettings) {
            try {
                existingSettings = JSON.parse(savedSettings);
            } catch (error) {
                console.error("Failed to parse settings:", error);
            }
        }

        // Map language code to display name for storage
        let displayLanguage = "English";
        if (language === 'zh') displayLanguage = "Chinese";
        else if (language === 'ms') displayLanguage = "Bahasa Malaysia";
        else displayLanguage = "English";

        // Save language to localStorage (preserve other settings)
        const updatedSettings = {
            ...existingSettings,
            language: displayLanguage,
        };
        localStorage.setItem('shuttleflow_settings', JSON.stringify(updatedSettings));
    }, [language, isInitialized]);

    // Load translations when language changes
    useEffect(() => {
        if (!isInitialized) return;

        const loadTranslations = async () => {
            try {
                const response = await fetch(`/locales/${language}.json`);
                if (response.ok) {
                    const data = await response.json();
                    const flatData = flattenObject(data);
                    setTranslations(flatData);
                } else {
                    console.error(`Failed to load ${language} translations`);
                    setTranslations({});
                }
            } catch (error) {
                console.error('Failed to load translations:', error);
                setTranslations({});
            }
        };

        loadTranslations();
    }, [language, isInitialized]);

    const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
        const result: Record<string, string> = {};
        for (const key in obj) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                Object.assign(result, flattenObject(obj[key], newKey));
            } else {
                result[newKey] = obj[key];
            }
        }
        return result;
    };

    const t = (key: string): string => {
        return translations[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
}