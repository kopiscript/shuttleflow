// components/PageShell.tsx
"use client";

import { ReactNode, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import SidebarMenu from "./SidebarMenu";

interface PageShellProps {
    children: ReactNode;
    showBackButton?: boolean;
    header?: ReactNode;  // Custom header content (title, subtitle, etc.)
    fullHeight?: boolean; // For pages that need full screen height (like map)
}

export default function PageShell({
    children,
    showBackButton = false,
    header,
    fullHeight = false
}: PageShellProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread notification count
    const fetchUnreadCount = async () => {
        try {
            const response = await fetch("/api/notifications");
            const data = await response.json();

            if (data.success && data.notifications) {
                // Get read IDs from localStorage
                const readIdsRaw = localStorage.getItem('readNotifications');
                let readIds: number[] = [];
                if (readIdsRaw) {
                    readIds = JSON.parse(readIdsRaw);
                }

                // Count unread notifications
                const unread = data.notifications.filter((n: any) => !readIds.includes(n.id)).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <div className={`relative flex flex-col bg-[var(--background)] overflow-x-auto ${fullHeight ? 'h-screen' : 'min-h-screen'}`}>
                {/* Gradient Background Elements - Using CSS Variables */}
                <div
                    className="absolute w-[569px] h-[414px] top-[-106px] bg-[var(--gradient-1-bg)] blur-[var(--gradient-1-blur)] opacity-[var(--gradient-1-opacity)] pointer-events-none"
                    style={{
                        left: "calc(50% - 568.85px/2 - 280px)",
                        transform: "matrix(-1, 0.03, 0.03, 1, 0, 0)"
                    }}
                />

                <div
                    className="absolute w-[604px] h-[871px] top-[-322px] bg-[var(--gradient-2-bg)] blur-[var(--gradient-2-blur)] opacity-[var(--gradient-2-opacity)] pointer-events-none"
                    style={{
                        left: "calc(50% - 604px/2 + 31.5px)",
                        transform: "matrix(-0.93, 0.37, 0.37, 0.93, 0, 0)"
                    }}
                />

                {/* Header */}
                <div className="relative z-10 px-6 pt-5 flex-shrink-0">
                    {/* Top Bar (same for all pages) */}
                    <div className="flex items-center justify-between">
                        {showBackButton ? (
                            <Link href="/" className="w-5 h-5 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="w-5 h-5 flex flex-col justify-between"
                            >
                                <span className="block w-5 h-[2px] bg-white rounded-full" />
                                <span className="block w-5 h-[2px] bg-white rounded-full" />
                                <span className="block w-5 h-[2px] bg-white rounded-full" />
                            </button>
                        )}

                        <Link href="/">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={148}
                                height={34}
                                className="object-contain"
                            />
                        </Link>

                        {/* Bell Notification Icon with unread badge */}
                        <Link
                            href="/notifications"
                            className="relative block cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        >
                            <div className="relative">
                                <svg
                                    className="w-7 h-7 text-white cursor-pointer hover:text-gray-200 transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>

                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse shadow-md"></span>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* Custom Header Content from each page */}
                    {header && (
                        <div className="mt-8 mb-10">
                            {header}
                        </div>
                    )}
                </div>

                {/* Children Content */}
                <div className="relative z-10 flex-1 overflow-hidden">
                    {children}
                </div>
            </div>

            <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
}