// app/admin/(dashboard)/support-tickets/page.tsx
"use client";
import { Suspense, useEffect, useState, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SmallDropdown from "../components/SmallDropdown";

interface SupportTicket {
    id: number;
    description: string;
    email: string;
    reportType: string;
    status: string;
    fileUrl: string | null;
    fileUrls: string[];
    createdAt: string;
    updatedAt: string;
    replyCount: number;
}

const REPORT_TYPES: Record<string, string> = {
    route_problem: "Route Problem",
    feedback: "Feedback",
    bus_delay: "Bus Delay",
    other: "Other",
};

const STATUS_BADGES: Record<string, string> = {
    Unresolved: "bg-[#FFC0B9] text-[#EA1701]",
    Resolved: "bg-[#E1FFDA] text-[#3EB900]",
};

const ITEMS_PER_PAGE = 6;

const getReportTypeLabel = (type: string) => REPORT_TYPES[type] || type;
const getStatusBadge = (status: string) =>
    STATUS_BADGES[status] || "bg-[#2C2D33] text-[#87888C]";
const formatDate = (date: string) =>
    date ? new Date(date).toLocaleString() : "N/A";
const formatDateOnly = (date: string) =>
    date
        ? new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
        : "";

const FILTER_LABEL = "text-[#87888C] font-['Inter'] text-sm whitespace-nowrap mr-2";
const FILTER_SELECT =
    "px-4 py-2 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm cursor-pointer";
const FILTER_DATE =
    "px-4 py-2 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm [color-scheme:dark]";
const CHIP =
    "inline-flex items-center gap-2 px-3 py-1.5 bg-[#96DDFF]/10 text-[#96DDFF] rounded-full text-xs font-['Inter'] border border-[#96DDFF]/30";
const PAGE_BTN = "px-3 py-2 rounded-lg font-['Inter'] text-sm transition";

function SupportTicketsManagement() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [reportTypeFilter, setReportTypeFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const status = searchParams.get("status");
        setStatusFilter(
            status === "resolved" || status === "unresolved" ? status : "all"
        );
    }, [searchParams]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/admin/support-tickets");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Failed to fetch support tickets");
            setTickets(data.tickets || []);
        } catch (err) {
            console.error("Failed to fetch support tickets:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch support tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, []);

    const handleRowClick = (id: number) => router.push(`/admin/support-tickets/${id}`);
    const handleRowKeyDown = (event: KeyboardEvent, id: number) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleRowClick(id);
        }
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        router.replace(
            value === "all"
                ? "/admin/support-tickets"
                : `/admin/support-tickets?status=${encodeURIComponent(value)}`
        );
    };

    const filteredTickets = tickets.filter((ticket) => {
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "resolved" && ticket.status === "Resolved") ||
            (statusFilter === "unresolved" && ticket.status === "Unresolved");

        const matchesReportType =
            reportTypeFilter === "all" || ticket.reportType === reportTypeFilter;

        let matchesDate = true;
        if (startDate || endDate) {
            const ticketDate = new Date(ticket.createdAt).getTime();
            if (startDate) matchesDate &&= ticketDate >= new Date(startDate).getTime();
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchesDate &&= ticketDate <= end.getTime();
            }
        }
        return matchesStatus && matchesReportType && matchesDate;
    });

    const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    useEffect(() => { setCurrentPage(1); }, [statusFilter, reportTypeFilter, startDate, endDate]);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) pages.push(i);
            else if (pages[pages.length - 1] !== "...") pages.push("...");
        }
        return pages;
    };

    const clearFilters = () => {
        setStatusFilter("all");
        setReportTypeFilter("all");
        setStartDate("");
        setEndDate("");
        router.replace("/admin/support-tickets");
    };

    const hasActiveFilters = statusFilter !== "all" || reportTypeFilter !== "all" || startDate !== "" || endDate !== "";

    // Small helpers to reduce JSX repetition
    const filterLabel = "text-[#87888C] font-['Inter'] text-sm whitespace-nowrap mr-2";
    const filterSelect = "px-4 py-2 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm cursor-pointer";
    const filterDate = "px-4 py-2 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm [color-scheme:dark]";
    const chip = "inline-flex items-center gap-2 px-3 py-1.5 bg-[#96DDFF]/10 text-[#96DDFF] rounded-full text-xs font-['Inter'] border border-[#96DDFF]/30";

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">Support Tickets</h1>
                <p className="text-[#87888C] mt-2 font-['Inter'] text-sm">
                    View and manage support tickets submitted by users. Filter by status, report type, or date range.
                </p>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mb-4 p-4 bg-[#CD0000]/20 border border-[#CD0000] rounded-lg text-[#CD0000] font-['Inter'] text-sm">
                    <p className="font-semibold">Error loading support tickets:</p>
                    <p>{error}</p>
                    <button onClick={fetchTickets} className="mt-2 px-4 py-2 bg-[#96DDFF] text-[#171821] rounded-lg hover:bg-[#7ec4e8] transition">
                        Retry
                    </button>
                </div>
            )}

            {/* Filter bar */}
            <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-4 mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                    <div>
                        <label className={filterLabel}>Status:</label>
                        <select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)} className={filterSelect}>
                            <option value="all">All</option>
                            <option value="unresolved">Unresolved</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>

                    <div>
                        <label className={filterLabel}>Report Type:</label>
                        <select value={reportTypeFilter} onChange={(e) => setReportTypeFilter(e.target.value)} className={filterSelect}>
                            <option value="all">All</option>
                            {Object.entries(REPORT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className={filterLabel}>Start:</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={filterDate} />
                    </div>

                    <div>
                        <label className={filterLabel}>End:</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={filterDate} />
                    </div>
                </div>

                {/* Active filter chips */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-[#2C2D33]">
                        {statusFilter !== "all" && (
                            <span className={CHIP}>
                                Status: {statusFilter === "resolved" ? "Resolved" : "Unresolved"}
                                <button onClick={() => handleStatusChange("all")} className="hover:text-white">✕</button>
                            </span>
                        )}
                        {reportTypeFilter !== "all" && (
                            <span className={CHIP}>
                                Type: {getReportTypeLabel(reportTypeFilter)}
                                <button onClick={() => setReportTypeFilter("all")} className="hover:text-white">✕</button>
                            </span>
                        )}
                        {startDate && (
                            <span className={CHIP}>
                                From: {formatDateOnly(startDate)}
                                <button onClick={() => setStartDate("")} className="hover:text-white">✕</button>
                            </span>
                        )}
                        {endDate && (
                            <span className={CHIP}>
                                To: {formatDateOnly(endDate)}
                                <button onClick={() => setEndDate("")} className="hover:text-white">✕</button>
                            </span>
                        )}
                        <button onClick={clearFilters} className="text-[#96DDFF] hover:text-white hover:underline font-['Inter'] text-xs ml-1 transition">
                            Clear filters
                        </button>
                    </div>
                )}

                {/* Results count */}
                {!loading && !error && (
                    <div className="text-[#87888C] font-['Inter'] text-xs mt-4">
                        Showing {paginatedTickets.length === 0 ? 0 : startIndex + 1}–
                        {Math.min(startIndex + ITEMS_PER_PAGE, filteredTickets.length)} of{" "}
                        {filteredTickets.length} {filteredTickets.length === 1 ? "ticket" : "tickets"}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-[#21222D] rounded-2xl overflow-hidden border border-[#2C2D33]">
                <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#2B2B36]">
                                {["Ticket ID", "Email", "Report Type", "Status", "Submitted"].map((heading) => (
                                    <th key={heading} className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">Loading support tickets...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={5} className="text-center py-8 text-[#CD0000] font-['Inter'] text-sm">Failed to load support tickets.</td></tr>
                            ) : paginatedTickets.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">
                                    {hasActiveFilters ? "No tickets match your filters." : "No support tickets yet."}
                                </td></tr>
                            ) : (
                                paginatedTickets.map((ticket, index) => (
                                    <tr
                                        key={ticket.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleRowClick(ticket.id)}
                                        onKeyDown={(e) => handleRowKeyDown(e, ticket.id)}
                                        className={`border-t border-[#2C2D33] hover:bg-[#2B2B36] transition cursor-pointer ${index % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"
                                            }`}
                                    >
                                        <td className="px-6 py-4 text-white font-['Inter'] text-sm">T{String(ticket.id).padStart(3, "0")}</td>
                                        <td className="px-6 py-4 text-white font-['Inter'] text-sm">{ticket.email}</td>
                                        <td className="px-6 py-4 text-white font-['Inter'] text-sm">{getReportTypeLabel(ticket.reportType)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold font-['Inter'] ${getStatusBadge(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[#87888C] font-['Inter'] text-sm">{formatDate(ticket.createdAt)}</td>
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
                                className={`${PAGE_BTN} ${currentPage === 1 ? "text-[#87888C] cursor-not-allowed" : "text-[#87888C] hover:text-white"}`}
                            >
                                Previous
                            </button>
                            {getPageNumbers().map((page, index) =>
                                page === "..." ? (
                                    <span key={`ellipsis-${index}`} className="px-2 text-[#87888C] font-['Inter'] text-sm font-bold">...</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page as number)}
                                        className={`${PAGE_BTN} ${currentPage === page ? "bg-[#96DDFF] text-[#171821]" : "text-[#87888C] hover:text-white"}`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`${PAGE_BTN} ${currentPage === totalPages ? "text-[#87888C] cursor-not-allowed" : "text-[#87888C] hover:text-white"}`}
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
export default function SupportTicketsPage() {
    return (
        <Suspense fallback={<div role="status" className="text-[#87888C] font-['Inter']">Loading support tickets...</div>}>
            <SupportTicketsManagement />
        </Suspense>
    );
}
