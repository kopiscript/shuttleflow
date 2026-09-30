"use client";

import { useState, useEffect, useMemo } from "react";

interface AdminAuditLogItem {
    id: number;
    adminId: number | null;
    category: "AUTH" | "FLEET" | "SETTINGS";
    action: string;
    targetType: string | null;
    targetId: string | null;
    details: Record<string, any> | null;
    ipAddress: string | null;
    createdAt: string;
    admin: {
        username: string;
        email: string;
    } | null;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [selectedAction, setSelectedAction] = useState<string>("ALL");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Snapshot Modal
    const [selectedSnapshot, setSelectedSnapshot] = useState<Record<string, any> | null>(null);

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/admin/audit_logs");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (data.success) {
                setLogs(data.logs || []);
            } else {
                throw new Error(data.error || "Failed to fetch audit logs");
            }
        } catch (err) {
            console.error("Failed to fetch audit logs:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch audit logs");
        } finally {
            setLoading(false);
        }
    };

    // Extract unique actions dynamically from incoming data
    const uniqueActions = useMemo(() => {
        const actions = Array.from(new Set(logs.map((l) => l.action))).sort();
        return actions;
    }, [logs]);

    // Apply Search + Category Filter + Action Filter
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            // Category Filter
            if (selectedCategory !== "ALL" && log.category !== selectedCategory) {
                return false;
            }

            // Action Filter
            if (selectedAction !== "ALL" && log.action !== selectedAction) {
                return false;
            }

            // Search query
            const searchLower = searchTerm.toLowerCase().trim();
            if (!searchLower) return true;

            const adminName = log.admin?.username?.toLowerCase() || "system";
            const adminEmail = log.admin?.email?.toLowerCase() || "";
            const actionName = log.action.toLowerCase();
            const targetType = (log.targetType || "").toLowerCase();
            const targetId = (log.targetId || "").toLowerCase();
            const idString = `#${log.id}`;

            return (
                adminName.includes(searchLower) ||
                adminEmail.includes(searchLower) ||
                actionName.includes(searchLower) ||
                targetType.includes(searchLower) ||
                targetId.includes(searchLower) ||
                idString.includes(searchLower)
            );
        });
    }, [logs, searchTerm, selectedCategory, selectedAction]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // Export current filtered list
    const exportToCSV = () => {
        if (filteredLogs.length === 0) return;
        const headers = ["Log ID", "Admin", "Admin Email", "Category", "Action", "Target Type", "Target ID", "IP Address", "Timestamp"];
        const csvRows = filteredLogs.map((log) => [
            log.id,
            log.admin?.username || "System",
            log.admin?.email || "N/A",
            log.category,
            log.action,
            log.targetType || "N/A",
            log.targetId || "N/A",
            log.ipAddress || "N/A",
            new Date(log.createdAt).toLocaleString(),
        ]);

        const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getCategoryBadge = (category: string) => {
        switch (category) {
            case "AUTH":
                return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
            case "FLEET":
                return "bg-[#96DDFF]/20 text-[#96DDFF] border border-[#96DDFF]/30";
            case "SETTINGS":
                return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
            default:
                return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
                        Audit Logs
                    </h1>
                    <p className="text-[#87888C] font-['Inter'] text-sm mt-1">
                        Track administrator actions, authentication events, and fleet mutations
                    </p>
                </div>
                <button
                    onClick={exportToCSV}
                    disabled={filteredLogs.length === 0}
                    className="px-5 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-bold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export to CSV ({filteredLogs.length})
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[#21222D] p-4 rounded-2xl border border-[#2C2D33] flex flex-col md:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search admin, email, action, or target ID..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full px-4 py-2.5 bg-[#171821] text-white rounded-xl border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#87888C]"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87888C] hover:text-white text-xs"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Category Dropdown */}
                <div className="w-full md:w-44">
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2.5 bg-[#171821] text-white rounded-xl border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                    >
                        <option value="ALL">All Categories</option>
                        <option value="AUTH">AUTH</option>
                        <option value="FLEET">FLEET</option>
                        <option value="SETTINGS">SETTINGS</option>
                    </select>
                </div>

                {/* Action Dropdown */}
                <div className="w-full md:w-56">
                    <select
                        value={selectedAction}
                        onChange={(e) => {
                            setSelectedAction(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2.5 bg-[#171821] text-white rounded-xl border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                    >
                        <option value="ALL">All Actions</option>
                        {uniqueActions.map((action) => (
                            <option key={action} value={action}>
                                {action}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Rows per page */}
                <div className="w-full md:w-32">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2.5 bg-[#171821] text-white rounded-xl border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                    >
                        <option value={10}>10 / page</option>
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                    </select>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-[#CD0000]/20 border border-[#CD0000] rounded-lg text-[#CD0000] font-['Inter'] text-sm">
                    <p className="font-semibold">Error loading audit logs:</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Table Card */}
            <div className="bg-[#21222D] rounded-2xl overflow-hidden border border-[#2C2D33]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#2B2B36]">
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Log ID</th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Admin</th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Category</th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Action</th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Target</th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Snapshot</th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-[#87888C] font-['Inter'] text-sm">
                                        Loading audit records...
                                    </td>
                                </tr>
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-[#87888C] font-['Inter'] text-sm">
                                        No audit records match the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log, index) => (
                                    <tr
                                        key={log.id}
                                        className={`border-t border-[#2C2D33] hover:bg-[#2B2B36] transition ${index % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"
                                            }`}
                                    >
                                        <td className="px-6 py-4 text-white font-['Inter'] text-sm whitespace-nowrap">
                                            #{log.id}
                                        </td>
                                        <td className="px-6 py-4 font-['Inter'] text-sm whitespace-nowrap">
                                            {log.admin ? (
                                                <div>
                                                    <span className="text-white font-medium block">{log.admin.username}</span>
                                                    <span className="text-[#87888C] text-xs">{log.admin.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[#87888C]">System / Anonymous</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold font-['Inter'] ${getCategoryBadge(log.category)}`}>
                                                {log.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[#96DDFF] font-['Inter'] text-sm font-medium whitespace-nowrap">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4 text-[#87888C] font-['Inter'] text-sm whitespace-nowrap">
                                            {log.targetType ? `${log.targetType} ${log.targetId ? `(#${log.targetId})` : ""}` : "—"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.details ? (
                                                <button
                                                    onClick={() => setSelectedSnapshot(log.details)}
                                                    className="px-3 py-1 bg-[#171821] border border-[#2C2D33] text-white hover:border-[#96DDFF] rounded-lg font-['Inter'] text-xs transition"
                                                >
                                                    View Snapshot
                                                </button>
                                            ) : (
                                                <span className="text-[#87888C] font-['Inter'] text-xs">—</span>
                                            )}
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

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#2C2D33] gap-3">
                    <span className="text-[#87888C] font-['Inter'] text-xs">
                        Showing {filteredLogs.length === 0 ? 0 : startIndex + 1} to{" "}
                        {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                            className="px-2.5 py-1.5 rounded-lg font-['Inter'] text-xs text-[#87888C] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            First
                        </button>
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg font-['Inter'] text-sm text-[#87888C] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            Prev
                        </button>

                        <span className="text-white font-['Inter'] text-sm px-2 font-medium">
                            {currentPage} / {totalPages}
                        </span>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg font-['Inter'] text-sm text-[#87888C] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            Next
                        </button>
                        <button
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-2.5 py-1.5 rounded-lg font-['Inter'] text-xs text-[#87888C] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            Last
                        </button>
                    </div>
                </div>
            </div>

            {/* Snapshot Details Modal */}
            {selectedSnapshot && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6 max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-[#2C2D33]">
                            <h3 className="text-lg font-bold text-white font-['Bai_Jamjuree']">
                                Record Snapshot Payload
                            </h3>
                            <button onClick={() => setSelectedSnapshot(null)} className="text-[#87888C] hover:text-white transition">
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto my-4 bg-[#171821] p-4 rounded-xl border border-[#2C2D33]">
                            <pre className="text-xs text-[#96DDFF] font-mono leading-relaxed whitespace-pre-wrap break-all">
                                {JSON.stringify(selectedSnapshot, null, 2)}
                            </pre>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setSelectedSnapshot(null)}
                                className="px-5 py-2 bg-[#2B2B36] hover:bg-[#3C3D44] text-white rounded-lg font-['Inter'] text-sm transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}