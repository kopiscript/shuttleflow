// app/admin/settings/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface SettingsCard {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
}

export default function AdminSettingsPage() {
    const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
    const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);

    const toggleCard = (id: string) => {
        if (id === "manage-users") setIsManageUsersOpen(!isManageUsersOpen);
        else if (id === "audit-logs") setIsAuditLogsOpen(!isAuditLogsOpen);
    };

    const isOpen = (id: string) => {
        if (id === "manage-users") return isManageUsersOpen;
        else if (id === "audit-logs") return isAuditLogsOpen;
        return false;
    };

    return (
        <div>
            {/* Page Header - Matching other admin pages */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
                    Settings
                </h1>
                <p className="text-[#87888C] mt-2 font-['Inter'] text-sm">
                    Manage user permissions, view audit logs, and export data
                </p>
            </div>

            {/* Settings Cards */}
            <div className="space-y-4">
                {/* Manage Users Card - Expandable */}
                <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] overflow-hidden">
                    <div
                        className="flex items-center px-6 py-5 cursor-pointer hover:bg-[#2C2D33] transition"
                        onClick={() => toggleCard("manage-users")}
                    >
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#87888C" />
                            </svg>
                        </div>
                        <div className="flex-1 ml-4">
                            <h3 className="text-white font-bold font-['Inter'] text-base">
                                Manage Users
                            </h3>
                            <p className="text-[#87888C] font-['Inter'] text-sm">
                                Set policies and access for each Admin user
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <svg className={`w-5 h-5 text-[#87888C] transition-transform duration-200 ${isOpen("manage-users") ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    {isManageUsersOpen && (
                        <div className="px-6 pb-5 pt-3 border-t border-[#2C2D33]">
                            <div className="bg-[#171821] rounded-xl p-4">
                                <p className="text-[#87888C] font-['Inter'] text-sm">
                                    Manage Users content coming soon...
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Audit Logs Card - Expandable */}
                <Link
                    href="/admin/settings/audit_logs"
                    className="block bg-[#21222D] rounded-2xl border border-[#2C2D33] overflow-hidden hover:bg-[#2C2D33] transition group"
                >
                    <div className="flex items-center px-6 py-5">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="#87888C" />
                                <path d="M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z" fill="#87888C" />
                            </svg>
                        </div>
                        <div className="flex-1 ml-4">
                            <h3 className="text-white font-bold font-['Inter'] text-base">
                                Audit Logs
                            </h3>
                            <p className="text-[#87888C] font-['Inter'] text-sm">
                                View changes by each Admin user
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-[#87888C] group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Link>

                {/* Export Data Card - Navigates to Export Data Page */}
                <Link
                    href="/admin/settings/export_data"
                    className="block bg-[#21222D] rounded-2xl border border-[#2C2D33] overflow-hidden hover:bg-[#2C2D33] transition group"
                >
                    <div className="flex items-center px-6 py-5">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#87888C" />
                                <path d="M12 12L8 16H11V20H13V16H16L12 12Z" fill="#171821" />
                            </svg>
                        </div>
                        <div className="flex-1 ml-4">
                            <h3 className="text-white font-bold font-['Inter'] text-base">
                                Export Data
                            </h3>
                            <p className="text-[#87888C] font-['Inter'] text-sm">
                                Download bus logs, device history, or ridership reports
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-[#87888C] group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}