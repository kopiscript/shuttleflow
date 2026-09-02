// app/admin/settings/export_data/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface ExportOption {
    id: string;
    title: string;
    icon: React.ReactNode;
    href: string;
    description?: string;
}

export default function ExportDataPage() {
    const router = useRouter();

    const exportOptions: ExportOption[] = [
        {
            id: "bus-logs",
            title: "Bus Logs",
            description: "Download bus location history and route data",
            icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="10" width="28" height="20" rx="4" fill="#87888C" opacity="0.3" />
                    <rect x="8" y="14" width="24" height="12" rx="2" fill="#87888C" />
                    <circle cx="14" cy="20" r="2" fill="#171821" />
                    <circle cx="26" cy="20" r="2" fill="#171821" />
                    <rect x="10" y="6" width="2" height="4" fill="#87888C" />
                    <rect x="28" y="6" width="2" height="4" fill="#87888C" />
                    <path d="M16 24L20 28L24 24" stroke="#87888C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            href: "/admin/settings/export_data/bus-logs",
        },
        {
            id: "device-history",
            title: "Device History",
            description: "Download GPS device performance and status history",
            icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="12" width="24" height="20" rx="3" fill="#87888C" opacity="0.3" />
                    <rect x="10" y="14" width="20" height="14" rx="1" fill="#87888C" />
                    <circle cx="20" cy="27" r="2" fill="#171821" />
                    <rect x="17" y="8" width="6" height="4" rx="1" fill="#87888C" />
                    <path d="M14 18L18 22L22 18" stroke="#171821" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18 22L18 26" stroke="#171821" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ),
            href: "/admin/settings/export_data/device-history",
        },
        {
            id: "user-reports",
            title: "User Reports",
            description: "Download ridership statistics and user feedback reports",
            icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="14" r="6" fill="#87888C" opacity="0.3" />
                    <circle cx="20" cy="14" r="4" fill="#87888C" />
                    <path d="M8 28C8 23.5817 11.5817 20 16 20H24C28.4183 20 32 23.5817 32 28V30H8V28Z" fill="#87888C" opacity="0.3" />
                    <rect x="12" y="8" width="2" height="2" fill="#171821" />
                    <rect x="18" y="8" width="2" height="2" fill="#171821" />
                    <rect x="24" y="8" width="2" height="2" fill="#171821" />
                    <path d="M14 24L18 28L22 24" stroke="#171821" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            href: "/admin/settings/export_data/user-reports",
        },
    ];

    return (
        <div>
            {/* Page Header with Back Button - Matching details page style */}
            <div className="flex items-center gap-3 mb-8">
                <Link
                    href="/admin/settings"
                    className="text-white hover:text-[#96DDFF] transition p-1"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
                    Export Data
                </h1>
            </div>

            {/* Description */}
            <p className="text-[#87888C] font-['Inter'] text-sm mb-6">
                Download bus logs, device history, or ridership reports
            </p>

            {/* Export Options Cards */}
            <div className="space-y-4">
                {exportOptions.map((option) => (
                    <Link
                        key={option.id}
                        href={option.href}
                        className="block bg-[#21222D] rounded-2xl border border-[#2C2D33] overflow-hidden hover:bg-[#2C2D33] transition group"
                    >
                        <div className="flex items-center px-6 py-5">
                            {/* Icon */}
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                                {option.icon}
                            </div>

                            {/* Title and Description */}
                            <div className="flex-1 ml-4">
                                <h3 className="text-white font-bold font-['Inter'] text-base">
                                    {option.title}
                                </h3>
                                {option.description && (
                                    <p className="text-[#87888C] font-['Inter'] text-sm">
                                        {option.description}
                                    </p>
                                )}
                            </div>

                            {/* Arrow Icon pointing right */}
                            <div className="flex-shrink-0 ml-4">
                                <svg className="w-5 h-5 text-[#87888C] group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}