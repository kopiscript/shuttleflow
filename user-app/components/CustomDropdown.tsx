"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

interface Option {
  id: number;
  routeName: string;
  pickupStop?: string;
  dropoffStop?: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  loading,
  placeholder
}: CustomDropdownProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id.toString() === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const defaultPlaceholder = placeholder || t("home.selectRoute");

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <div
        className="bg-(--dropdown-bg) rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`font-['Inter'] text-sm ${selectedOption ? 'text-(--dropdown-text)' : 'text-gray-400'}`}>
          {loading ? t("home.loadingRoutes") : (selectedOption?.routeName || defaultPlaceholder)}
        </span>
        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 overflow-hidden z-30">
          <div className="relative bg-(--glass-bg) backdrop-blur-sm rounded-2xl shadow-[0px_8px_40px_rgba(0,0,0,0.2)] overflow-hidden">
            {/* Divider line removed */}

            {options.length === 0 ? (
              <div className="px-5 py-4 text-gray-400 font-['Inter'] text-sm tracking-[-0.23px]">
                {t("home.noRoutes")}
              </div>
            ) : (
              options.map((option) => (
                <div
                  key={option.id}
                  className={`px-5 py-4 cursor-pointer transition-colors font-['Inter'] text-sm tracking-[-0.23px] ${value === option.id.toString()
                      ? 'bg-gray-300/50 dark:bg-gray-600/50 text-(--dropdown-text) font-medium'
                      : 'text-(--dropdown-text)/80 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                    }`}
                  onClick={() => {
                    onChange(option.id.toString());
                    setIsOpen(false);
                  }}
                >
                  <div className="font-medium">{option.routeName}</div>
                  {option.pickupStop && option.dropoffStop && (
                    <div className="text-xs opacity-70 mt-1 tracking-[-0.23px]">
                      {option.pickupStop} → {option.dropoffStop}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}