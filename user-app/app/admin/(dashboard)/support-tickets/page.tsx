// app/admin/support-tickets/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SupportTicket {
    id: number;
    title: string | null;
    description: string;
    email: string;
    reportType: string;
    status: string;
    fileUrl: string | null;
    fileUrls: string[];
    createdAt: string;
    updatedAt: string;
}

export default function SupportTicketsManagement() {
    const router = useRouter();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [statusFilter, setStatusFilter] = useState("all");
    const [reportTypeFilter, setReportTypeFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Fetch tickets
    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/admin/support-tickets");

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setTickets(data.tickets || []);
            } else {
                throw new Error(data.error || "Failed to fetch support tickets");
            }
        } catch (error) {
            console.error("Failed to fetch support tickets:", error);
            setError(error instanceof Error ? error.message : "Failed to fetch support tickets");
        } finally {
            setLoading(false);
        }
    };

    // ---- Row navigation ----
    const handleRowClick = (ticketId: number) => {
        router.push(`/admin/support-tickets/${ticketId}`);
    };

    const handleRowKeyDown = (e: React.KeyboardEvent, ticketId: number) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleRowClick(ticketId);
        }
    };

    // Filter tickets
    const filteredTickets = tickets.filter((ticket) => {
        const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
        const matchesReportType =
            reportTypeFilter === "all" || ticket.reportType === reportTypeFilter;

        let matchesDate = true;
        if (startDate || endDate) {
            const ticketDate = new Date(ticket.createdAt).getTime();
            if (startDate) {
                matchesDate = matchesDate && ticketDate >= new Date(startDate).getTime();
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && ticketDate <= end.getTime();
            }
        }

        return matchesStatus && matchesReportType && matchesDate;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, reportTypeFilter, startDate, endDate]);

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

    const clearFilters = () => {
        setStatusFilter("all");
        setReportTypeFilter("all");
        setStartDate("");
        setEndDate("");
    };

    const hasActiveFilters =
        statusFilter !== "all" ||
        reportTypeFilter !== "all" ||
        startDate !== "" ||
        endDate !== "";

    const getStatusBadge = (status: string) => {
        if (status === "Resolved") {
            return "bg-[#E1FFDA] text-[#3EB900]";
        } else if (status === "Open") {
            return "bg-[#FFC0B9] text-[#EA1701]";
        } else if (status === "In Progress") {
            return "bg-[#FFF4CC] text-[#B8860B]";
        } else if (status === "Closed") {
            return "bg-[#2C2D33] text-[#87888C]";
        }
        return "bg-[#2C2D33] text-[#87888C]";
    };

    const getReportTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            route_problem: "Route Problem",
            feedback: "Feedback",
            bus_delay: "Bus Delay",
            other: "Other",
        };
        return labels[type] || type;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString();
    };

    const formatDateOnly = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    return (
        <div>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
                    Support Tickets
                </h1>
                <p className="text-[#87888C] mt-2 font-['Inter'] text-sm">
                    View and manage support tickets submitted by users. Filter by status, report type, or date range.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-[#CD0000]/20 border border-[#CD0000] rounded-lg text-[#CD0000] font-['Inter'] text-sm">
                    <p className="font-semibold">Error loading support tickets:</p>
                    <p>{error}</p>
                    <button
                        onClick={fetchTickets}
                        className="mt-2 px-4 py-2 bg-[#96DDFF] text-[#171821] rounded-lg hover:bg-[#7ec4e8] transition"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ===== Filter Bar (above table) ===== */}
            <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-4 mb-6">
                {/* Filter Controls Row */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Status Filter */}
                    <div className="relative">
                        <label className="text-[#87888C] font-['Inter'] text-sm whitespace-nowrap">
                            Status:
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm appearance-none pr-9 cursor-pointer"
                        >
                            <option value="all">All</option>
                            <option value="Open">Status: Open</option>
                            <option value="In Progress">Status: In Progress</option>
                            <option value="Resolved">Status: Resolved</option>
                            <option value="Closed">Status: Closed</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-3.5 h-3.5 text-[#87888C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Report Type Filter */}
                    <div className="relative">
                        <label className="text-[#87888C] font-['Inter'] text-sm whitespace-nowrap">
                            Report Type:
                        </label>
                        <select
                            value={reportTypeFilter}
                            onChange={(e) => setReportTypeFilter(e.target.value)}
                            className="px-4 py-2 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm appearance-none pr-9 cursor-pointer"
                        >
                            <option value="all">All</option>
                            <option value="route_problem">Route Problem</option>
                            <option value="feedback">Feedback</option>
                            <option value="bus_delay">Bus Delay</option>
                            <option value="other">Other</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-3.5 h-3.5 text-[#87888C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Start Date */}
                    <div className="relative">
                        <label className="text-[#87888C] font-['Inter'] text-sm whitespace-nowrap">
                            Start:
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm [color-scheme:dark] cursor-pointer"
                            placeholder="From date"
                        />
                    </div>

                    {/* End Date */}
                    <div className="relative">
                        <label className="text-[#87888C] font-['Inter'] text-sm whitespace-nowrap">
                            End:
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm [color-scheme:dark] cursor-pointer"
                            placeholder="To date"
                        />
                    </div>
                </div>

                {/* Active Filter Chips Row (only shows when filters are active) */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-[#2C2D33]">
                        {statusFilter !== "all" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#96DDFF]/10 text-[#96DDFF] rounded-full text-xs font-['Inter'] border border-[#96DDFF]/30">
                                Status: {statusFilter}
                                <button
                                    onClick={() => setStatusFilter("all")}
                                    className="hover:text-white transition"
                                    aria-label="Remove status filter"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {reportTypeFilter !== "all" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#96DDFF]/10 text-[#96DDFF] rounded-full text-xs font-['Inter'] border border-[#96DDFF]/30">
                                Type: {getReportTypeLabel(reportTypeFilter)}
                                <button
                                    onClick={() => setReportTypeFilter("all")}
                                    className="hover:text-white transition"
                                    aria-label="Remove report type filter"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {startDate && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#96DDFF]/10 text-[#96DDFF] rounded-full text-xs font-['Inter'] border border-[#96DDFF]/30">
                                From: {formatDateOnly(startDate)}
                                <button
                                    onClick={() => setStartDate("")}
                                    className="hover:text-white transition"
                                    aria-label="Remove from date filter"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {endDate && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#96DDFF]/10 text-[#96DDFF] rounded-full text-xs font-['Inter'] border border-[#96DDFF]/30">
                                To: {formatDateOnly(endDate)}
                                <button
                                    onClick={() => setEndDate("")}
                                    className="hover:text-white transition"
                                    aria-label="Remove to date filter"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        <button
                            onClick={clearFilters}
                            className="text-[#96DDFF] hover:text-white hover:underline font-['Inter'] text-xs ml-1 transition"
                        >
                            Clear filters
                        </button>
                    </div>
                )}

                {/* Results Count */}
                {!loading && !error && (
                    <div className="text-[#87888C] font-['Inter'] text-xs mt-3">
                        Showing {paginatedTickets.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredTickets.length)} of {filteredTickets.length} {filteredTickets.length === 1 ? "ticket" : "tickets"}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-[#21222D] rounded-2xl overflow-hidden border border-[#2C2D33]">
                <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#2B2B36]">
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Ticket ID</th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Email</th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Report Type</th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Status</th>
                                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Submitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">
                                        Loading support tickets...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-[#CD0000] font-['Inter'] text-sm">
                                        Failed to load support tickets. Please try again.
                                    </td>
                                </tr>
                            ) : paginatedTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">
                                        {hasActiveFilters
                                            ? "No tickets match your filters."
                                            : "No support tickets yet."}
                                    </td>
                                </tr>
                            ) : (
                                paginatedTickets.map((ticket, index) => (
                                    <tr
                                        key={ticket.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View details for ticket T${String(ticket.id).padStart(3, "0")}`}
                                        onClick={() => handleRowClick(ticket.id)}
                                        onKeyDown={(e) => handleRowKeyDown(e, ticket.id)}
                                        className={`border-t border-[#2C2D33] hover:bg-[#2B2B36] transition cursor-pointer focus:outline-none focus:bg-[#2B2B36] ${index % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"
                                            }`}
                                    >
                                        <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                                            T{String(ticket.id).padStart(3, "0")}
                                        </td>
                                        <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                                            {ticket.email}
                                        </td>
                                        <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                                            {getReportTypeLabel(ticket.reportType)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold font-['Inter'] ${getStatusBadge(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[#87888C] font-['Inter'] text-sm">
                                            {formatDate(ticket.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && !error && (
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