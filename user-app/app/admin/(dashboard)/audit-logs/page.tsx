"use client";

import { useState, useEffect } from "react";

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
    admin: { username: string; email: string; } | null;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSnapshot, setSelectedSnapshot] = useState<Record<string, any> | null>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/audit_logs");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                setLogs(data.logs || []);
            } else {
                throw new Error(data.error || "Failed to fetch audit logs");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch");
        } finally {
            setLoading(false);
        }
    };

    // --- CSV EXPORT FEATURE ---
    const exportToCSV = () => {
        if (logs.length === 0) return;
        const headers = ["Log ID", "Admin", "Category", "Action", "Target Type", "Target ID", "Timestamp"];
        const csvRows = logs.map(log => [
            log.id,
            log.admin?.username || "System",
            log.category,
            log.action,
            log.targetType || "N/A",
            log.targetId || "N/A",
            new Date(log.createdAt).toLocaleString()
        ]);
        const csvContent = [headers.join(","), ...csvRows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const filteredLogs = logs.filter((log) => {
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;
        const adminName = log.admin?.username?.toLowerCase() || "system";
        return (
            adminName.includes(searchLower) ||
            log.action.toLowerCase().includes(searchLower) ||
            log.category.toLowerCase().includes(searchLower) ||
            (log.targetType || "").toLowerCase().includes(searchLower) ||
            `#${log.id}`.includes(searchLower)
        );
    });

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            {/* Header & Export Button */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">Audit Logs</h1>
                    <p className="text-[#87888C] font-['Inter'] text-sm mt-1">Track administrator actions, events, and fleet mutations</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-[#96DDFF] text-[#171821] rounded-lg font-bold hover:bg-[#7ec4e8] transition"
                >
                    Export to CSV
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full px-4 py-3 bg-[#21222D] text-white rounded-xl border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] text-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-[#21222D] rounded-2xl overflow-hidden border border-[#2C2D33]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#2B2B36] text-white">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Admin</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Target</th>
                            <th className="px-6 py-4">Snapshot</th>
                            <th className="px-6 py-4">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedLogs.map((log, i) => (
                            <tr key={log.id} className={`border-t border-[#2C2D33] ${i % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"}`}>
                                <td className="px-6 py-4 text-white">#{log.id}</td>
                                <td className="px-6 py-4 text-white">{log.admin?.username || "System"}</td>
                                <td className="px-6 py-4 text-[#96DDFF]">{log.category}</td>
                                <td className="px-6 py-4 text-white">{log.action}</td>
                                <td className="px-6 py-4 text-[#87888C]">{log.targetType} {log.targetId ? `(#${log.targetId})` : ""}</td>
                                <td className="px-6 py-4">
                                    {log.details ? (
                                        <button onClick={() => setSelectedSnapshot(log.details)} className="px-3 py-1 bg-[#171821] border border-[#2C2D33] text-white rounded-lg hover:border-[#96DDFF] transition">View</button>
                                    ) : "-"}
                                </td>
                                <td className="px-6 py-4 text-[#87888C]">{new Date(log.createdAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selectedSnapshot && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6 max-w-xl w-full">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Record Snapshot Payload</h3>
                            <button onClick={() => setSelectedSnapshot(null)} className="text-[#87888C] hover:text-white">✕</button>
                        </div>
                        <pre className="bg-[#171821] p-4 rounded-xl text-xs text-[#96DDFF] overflow-auto max-h-[60vh]">
                            {JSON.stringify(selectedSnapshot, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}