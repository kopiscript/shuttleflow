// components/SidebarMenu.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface SidebarMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
    // Close sidebar when pressing Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const menuItems = [
        { name: "Home", href: "/", icon: "🏠" },
        { name: "About", href: "/about", icon: "ℹ️" },
        { name: "Support", href: "/support", icon: "💬" },
        { name: "Settings", href: "/settings", icon: "⚙️" },
        { name: "Notifications", href: "/notifications", icon: "🔔" },
    ];

    const handleNavigation = () => {
        onClose(); // Close sidebar after navigation
    };

    return (
        <>
            {/* Backdrop - darker background */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
                onClick={onClose}
            />

            {/* Sidebar Menu - slides from left with #EEEBE4 background */}
            <div className="fixed top-0 left-0 bottom-0 w-[75vw] max-w-[320px] bg-[#EEEBE4] shadow-2xl z-50 animate-slide-in">
                {/* Header with logo and close button */}
                <div className="p-5 mb-20 flex items-center justify-between">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={120}
                        height={28}
                        className="object-contain"
                    />
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Menu Items with dividers */}
                <nav className="p-4">
                    {menuItems.map((item, index) => (
                        <div key={item.name}>
                            <Link
                                href={item.href}
                                onClick={handleNavigation}
                                className="flex items-center gap-4 px-4 py-3 rounded-xl text-gray-700 hover:bg-white/50 hover:text-[#99121A] transition-colors"
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                            {/* Add divider line after each item except the last one */}
                            {index < menuItems.length - 1 && (
                                <div className="border-t border-gray-300 my-1" />
                            )}
                        </div>
                    ))}
                </nav>
            </div>
        </>
    );
}