// components/ActionMenu.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ActionMenuProps {
  id: number;
  type: "bus" | "route";
  onDelete?: (id: number) => Promise<void>;
  customDeleteMessage?: string;
}

export default function ActionMenu({ id, type, onDelete, customDeleteMessage }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 169,
      });
    }
    setIsOpen(!isOpen);
  };

  const basePath = type === "bus" ? "/admin/buses" : "/admin/routes";
  const deleteMessage = customDeleteMessage || `Are you sure you want to delete this ${type}?`;

  return (
    <div className="relative">
      {/* Three-dot button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="text-[#87888C] hover:text-white transition p-1"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 14C5.45 14 4.97917 13.8042 4.5875 13.4125C4.19583 13.0208 4 12.55 4 12C4 11.45 4.19583 10.9792 4.5875 10.5875C4.97917 10.1958 5.45 10 6 10C6.55 10 7.02083 10.1958 7.4125 10.5875C7.80417 10.9792 8 11.45 8 12C8 12.55 7.80417 13.0208 7.4125 13.4125C7.02083 13.8042 6.55 14 6 14ZM12 14C11.45 14 10.9792 13.8042 10.5875 13.4125C10.1958 13.0208 10 12.55 10 12C10 11.45 10.1958 10.9792 10.5875 10.5875C10.9792 10.1958 11.45 10 12 10C12.55 10 13.0208 10.1958 13.4125 10.5875C13.8042 10.9792 14 11.45 14 12C14 12.55 13.8042 13.0208 13.4125 13.4125C13.0208 13.8042 12.55 14 12 14ZM18 14C17.45 14 16.9792 13.8042 16.5875 13.4125C16.1958 13.0208 16 12.55 16 12C16 11.45 16.1958 10.9792 16.5875 10.5875C16.9792 10.1958 17.45 10 18 10C18.55 10 19.0208 10.1958 19.4125 10.5875C19.8042 10.9792 20 11.45 20 12C20 12.55 19.8042 13.0208 19.4125 13.4125C19.0208 13.8042 18.55 14 18 14Z" fill="currentColor"/>
        </svg>
      </button>

      {/* Dropdown menu - matching Figma design */}
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-[100] bg-[#2B2B36] rounded-lg shadow-lg py-2 w-[169px]"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          <Link
            href={`${basePath}/${id}`}
            className="block px-6 py-2 text-white hover:bg-[#3C3D44] transition font-['Inter'] text-sm"
            onClick={() => setIsOpen(false)}
          >
            View Details
          </Link>
          <Link
            href={`${basePath}/${id}/edit`}
            className="block px-6 py-2 text-white hover:bg-[#3C3D44] transition font-['Inter'] text-sm"
            onClick={() => setIsOpen(false)}
          >
            Edit
          </Link>
          <button
            onClick={async () => {
              setIsOpen(false);
              if (confirm(deleteMessage)) {
                if (onDelete) {
                  await onDelete(id);
                }
              }
            }}
            className="block w-full text-left px-6 py-2 text-[#FA2121] hover:bg-[#3C3D44] transition font-['Inter'] text-sm"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}