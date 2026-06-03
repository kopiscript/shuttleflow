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
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

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
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Support", href: "/support" },
        { name: "Settings", href: "/settings" },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Sidebar Menu - Figma width 288px */}
            <div className="fixed top-0 left-0 bottom-0 w-[288px] bg-[#EEEBE4] shadow-2xl z-50">
                {/* Close button - top right */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-[#6E6E6E] hover:text-[#99121A] transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Logo - top left */}
                <div className="absolute top-5 left-5">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={120}
                        height={28}
                        className="object-contain"
                    />
                </div>

                {/* Menu Items with divider lines - at left: 42px, top: 171px */}
                <nav className="absolute left-[42px] top-[171px]">
                    {menuItems.map((item, index) => (
                        <div key={item.name}>
                            <Link
                                href={item.href}
                                onClick={onClose}
                                className="block font-['Bai_Jamjuree'] font-medium text-base text-[#6E6E6E] hover:text-[#99121A] transition-colors mb-3"
                            >
                                {item.name}
                            </Link>
                            {/* Divider line after each item except the last */}
                            {index < menuItems.length - 1 && (
                                <div className="w-[199px] border-t border-[#6E6E6E] my-2" />
                            )}
                        </div>
                    ))}
                </nav>
            </div>
        </>
    );
}