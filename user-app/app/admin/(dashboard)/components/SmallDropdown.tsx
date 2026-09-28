"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface SmallDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  width?: string;
}

export default function SmallDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  width = "w-40",
}: SmallDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${width}`} ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-[#171821] text-white text-sm font-['Inter'] border border-[#2C2D33] rounded-lg px-3 py-2 hover:border-[#96DDFF] focus:outline-none focus:border-[#96DDFF] transition"
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-[#87888C] flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#21222D] border border-[#2C2D33] rounded-lg shadow-[0px_8px_40px_rgba(0,0,0,0.4)] overflow-hidden z-50 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm font-['Inter'] transition ${
                opt.value === value
                  ? "bg-[#96DDFF]/10 text-[#96DDFF] font-medium"
                  : "text-white hover:bg-[#2B2B36]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}