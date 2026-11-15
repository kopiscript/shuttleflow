"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "../context/LanguageContext";

interface SidebarMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
    const { t } = useLanguage();
    const sidebarRef = useRef<HTMLDivElement>(null);

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

    // Handle touch events to prevent lag
    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            // If tapping outside the sidebar, close it
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('touchstart', handleTouchStart, { passive: true });
        }

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
        };
    }, [isOpen, onClose]);

    const menuItems = [
        { name: t("sidebar.home"), href: "/" },
        { name: t("sidebar.about"), href: "/about" },
        { name: t("sidebar.support"), href: "/support" },
        { name: t("sidebar.settings"), href: "/settings" },
    ];

    return (
        <>
            {/* Keep mounted so opening only changes opacity, without a full-screen blur. */}
            <div
                aria-hidden="true"
                className={`fixed inset-0 bg-black/50 z-40 transition-[opacity,visibility] duration-300 motion-reduce:transition-none ${isOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none [transition-delay:0ms,300ms]'}`}
                onClick={onClose}
            />

            {/* Sidebar with transform for smooth animation */}
            <div
                ref={sidebarRef}
                inert={!isOpen}
                aria-hidden={!isOpen}
                className={`fixed top-0 left-0 bottom-0 w-[288px] bg-(--sidebar-bg) shadow-2xl z-50 transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none ${isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full pointer-events-none [transition-delay:0ms,300ms]'
                    }`}
                style={{ touchAction: 'manipulation' }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-(--sidebar-text) hover:text-[#99121A] transition-colors p-2"
                    style={{ touchAction: 'manipulation' }}
                    aria-label="Close menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="absolute top-5 left-5">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={120}
                        height={28}
                        className="object-contain"
                        priority
                    />
                </div>

                <nav className="absolute left-10.5 top-42.75">
                    {menuItems.map((item, index) => (
                        <div key={item.name}>
                            <Link
                                href={item.href}
                                prefetch={isOpen ? undefined : false}
                                onClick={onClose}
                                className="block font-['Bai_Jamjuree'] font-medium text-base text-(--sidebar-text) hover:text-[#99121A] transition-colors mb-3 p-2"
                                style={{ touchAction: 'manipulation' }}
                            >
                                {item.name}
                            </Link>
                            {index < menuItems.length - 1 && (
                                <div className="w-49.75 border-t border-(--divider-color) my-2" />
                            )}
                        </div>
                    ))}
                </nav>
            </div>
        </>
    );
}
