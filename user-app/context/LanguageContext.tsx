// context/LanguageContext.tsx
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
    const [isLoading, setIsLoading] = useState(true);

    // ✅ ADD THIS: Load saved language from localStorage when app starts
    useEffect(() => {
        const savedSettings = localStorage.getItem('shuttleflow_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                const savedLanguage = settings.language;
                // Map display language to code
                if (savedLanguage === 'English') setLanguage('en');
                else if (savedLanguage === '中文') setLanguage('zh');
                else if (savedLanguage === 'Bahasa Malaysia') setLanguage('ms');
                else setLanguage('en');
            } catch (error) {
                console.error("Failed to load language from settings:", error);
            }
        }
    }, []); // Runs once on mount

    // Load translations when language changes
    useEffect(() => {
        const loadTranslations = async () => {
            setIsLoading(true);
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
            } finally {
                setIsLoading(false);
            }
        };

        loadTranslations();
    }, [language]);

    // Helper function to flatten nested JSON
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

    // Translation function - returns the key if translation not found
    const t = (key: string): string => {
        return translations[key] || key;
    };

    if (isLoading) {
        return (
            <LanguageContext.Provider value={{ language, setLanguage, t }}>
                {children}
            </LanguageContext.Provider>
        );
    }

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