// components/PageShell.tsx
"use client";

import { ReactNode, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SidebarMenu from "./SidebarMenu";

interface PageShellProps {
    children: ReactNode;
    showBackButton?: boolean;
    title?: string;
    subtitle?: string;
}

export default function PageShell({
    children,
    showBackButton = false,
    title,
    subtitle
}: PageShellProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <div className="relative flex flex-col min-h-screen bg-[#EEEBE4] overflow-x-auto">
                {/* Gradient Background Elements */}
                <div
                    className="absolute w-[569px] h-[414px] top-[-106px] bg-[#99121A] blur-[100px] opacity-50"
                    style={{
                        left: "calc(50% - 568.85px/2 - 280px)",
                        transform: "matrix(-1, 0.03, 0.03, 1, 0, 0)"
                    }}
                />

                <div
                    className="absolute w-[604px] h-[871px] top-[-322px] bg-[#CF2B10] opacity-30 blur-[150px]"
                    style={{
                        left: "calc(50% - 604px/2 + 31.5px)",
                        transform: "matrix(-0.93, 0.37, 0.37, 0.93, 0, 0)"
                    }}
                />

                {/* Header */}
                <div className="relative z-10 px-6 pt-5 flex-shrink-0">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between">
                        {/* Left Button: Back Arrow or Hamburger Menu */}
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

                        {/* Logo */}
                        <Link href="/">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={148}
                                height={34}
                                className="object-contain"
                            />
                        </Link>

                        {/* Right Button: Bell Icon or Empty Spacer */}
                        {!showBackButton ? (
                            <button className="w-7 h-7 relative">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </button>
                        ) : (
                            <div className="w-7" />
                        )}
                    </div>

                    {/* Optional Title Section */}
                    {title && (
                        <div className="text-center mt-8 mb-6">
                            <h1 className="text-white text-3xl font-bold">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-white text-sm mt-2">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Children Content */}
                <div className="relative z-10 flex-1">
                    {children}
                </div>
            </div>

            {/* Sidebar Menu */}
            <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
}