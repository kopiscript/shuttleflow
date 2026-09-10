// app/admin/settings/audit-logs/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ActivityLog {
    id: number;
    busId: number | null;      // ✅ camelCase
    eventType: string;          // ✅ camelCase
    description: string;
    createdAt: string;          // ✅ camelCase
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch audit logs from database
    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/admin/audit_logs");

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setLogs(data.logs || []);
            } else {
                throw new Error(data.error || "Failed to fetch audit logs");
            }
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
            setError(error instanceof Error ? error.message : "Failed to fetch audit logs");
        } finally {
            setLoading(false);
        }
    };

    // Filter logs based on search
    const filteredLogs = logs.filter((log) => {
        const searchLower = searchTerm.toLowerCase();

        // Replace underscores with spaces for better searching
        const eventTypeDisplay = log.eventType.replace(/_/g, ' ').toLowerCase();
        const descriptionLower = log.description.toLowerCase();

        return (
            eventTypeDisplay.includes(searchLower) ||
            descriptionLower.includes(searchLower) ||
            log.busId?.toString().includes(searchTerm) ||
            log.id.toString().includes(searchTerm)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showPagesAround = 1;

        for (let i = 1; i <= totalPages; i++) {
            const isFirst = i === 1;
            const isLast = i === totalPages;
            const isNearCurrent = Math.abs(i - currentPage) <= showPagesAround;

            if (isFirst || isLast || isNearCurrent) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== "...") {
                pages.push("...");
            }
        }
        return pages;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Get badge color for event type
    const getEventBadgeColor = (eventType: string) => {
        const types: Record<string, string> = {
            route_assigned: "bg-blue-500/20 text-blue-400",
            bus_updated: "bg-yellow-500/20 text-yellow-400",
            device_assigned: "bg-green-500/20 text-green-400",
            device_removed: "bg-red-500/20 text-red-400",
            bus_created: "bg-green-500/20 text-green-400",
            bus_deleted: "bg-red-500/20 text-red-400",
            route_updated: "bg-yellow-500/20 text-yellow-400",
            default: "bg-gray-500/20 text-gray-400",
        };
        return types[eventType] || types.default;
    };

    return (
        <div>
            {/* Page Header with Back Button */}
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href="/admin/settings"
                    className="text-white hover:text-[#96DDFF] transition p-1"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
                    Audit Logs
                </h1>
            </div>

            {/* Description */}
            <p className="text-[#87888C] font-['Inter'] text-sm mb-6">
                View changes made by each Admin user
            </p>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full px-4 py-3 bg-[#21222D] text-white rounded-xl border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#87888C]"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-[#87888C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-[#CD0000]/20 border border-[#CD0000] rounded-lg text-[#CD0000] font-['Inter'] text-sm">
                    <p className="font-semibold">Error loading audit logs:</p>
                    <p>{error}</p>
                    <button
                        onClick={fetchAuditLogs}
                        className="mt-2 px-4 py-2 bg-[#96DDFF] text-[#171821] rounded-lg hover:bg-[#7ec4e8] transition"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-[#21222D] rounded-2xl overflow-hidden border border-[#2C2D33]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#2B2B36]">
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                                    Log ID
                                </th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                                    Bus ID
                                </th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                                    Event Type
                                </th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                                    Description
                                </th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                                    Timestamp
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">
                                        Loading audit logs...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-[#CD0000] font-['Inter'] text-sm">
                                        Failed to load audit logs. Please try again.
                                    </td>
                                </tr>
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">
                                        {searchTerm ? "No logs match your search." : "No audit logs available."}
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log, index) => (
                                    <tr
                                        key={log.id}
                                        className={`border-t border-[#2C2D33] hover:bg-[#2B2B36] transition ${index % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"
                                            }`}
                                    >
                                        <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                                            #{log.id}
                                        </td>
                                        <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                                            {log.busId ? `B${String(log.busId).padStart(3, "0")}` : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold font-['Inter'] ${getEventBadgeColor(log.eventType)}`}
                                            >
                                                {log.eventType.replace(/_/g, " ").toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[#87888C] font-['Inter'] text-sm max-w-xs truncate">
                                            {log.description}
                                        </td>
                                        <td className="px-6 py-4 text-[#87888C] font-['Inter'] text-sm whitespace-nowrap">
                                            {formatDate(log.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && !loading && !error && (
                    <div className="flex items-center justify-end px-6 py-4 border-t border-[#2C2D33]">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-2 rounded-lg font-['Inter'] text-sm transition ${currentPage === 1
                                    ? "text-[#87888C] cursor-not-allowed"
                                    : "text-[#87888C] hover:text-white"
                                    }`}
                            >
                                Previous
                            </button>

                            {getPageNumbers().map((page, index) => {
                                if (page === "...") {
                                    return (
                                        <span
                                            key={`ellipsis-${index}`}
                                            className="px-2 text-[#87888C] font-['Inter'] text-sm font-bold"
                                        >
                                            ...
                                        </span>
                                    );
                                }
                                return (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page as number)}
                                        className={`px-3 py-2 rounded-lg font-['Inter'] text-sm transition ${currentPage === page
                                            ? "bg-[#96DDFF] text-[#171821]"
                                            : "text-[#87888C] hover:text-white"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-2 rounded-lg font-['Inter'] text-sm transition ${currentPage === totalPages
                                    ? "text-[#87888C] cursor-not-allowed"
                                    : "text-[#87888C] hover:text-white"
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}