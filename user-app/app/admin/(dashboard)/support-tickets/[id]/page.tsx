// app/admin/support-tickets/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function TicketDetailsPage({ params }: PageProps) {
    const router = useRouter();
    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [ticketId, setTicketId] = useState<number | null>(null);
    const [updating, setUpdating] = useState(false);

    // Reply state
    const [replyMessage, setReplyMessage] = useState("");
    const [sendingReply, setSendingReply] = useState(false);
    const [replyFeedback, setReplyFeedback] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    useEffect(() => {
        const unwrapParams = async () => {
            const { id } = await params;
            setTicketId(parseInt(id));
        };
        unwrapParams();
    }, [params]);

    useEffect(() => {
        if (!ticketId) return;
        const fetchTicket = async () => {
            try {
                const response = await fetch(`/api/admin/support-tickets/${ticketId}`);
                const data = await response.json();
                if (data.success) {
                    setTicket(data.ticket);
                }
            } catch (error) {
                console.error("Failed to fetch ticket:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [ticketId]);

    const handleStatusChange = async (newStatus: string) => {
        if (!ticket) return;
        setUpdating(true);
        try {
            const response = await fetch(`/api/admin/support-tickets/${ticket.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (data.success) {
                setTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setUpdating(false);
        }
    };

    const handleSendReply = async () => {
        if (!ticket || !replyMessage.trim()) return;

        setSendingReply(true);
        setReplyFeedback(null);

        try {
            const response = await fetch(
                `/api/admin/support-tickets/${ticket.id}/reply`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: replyMessage.trim() }),
                }
            );

            const data = await response.json();

            if (data.success) {
                setReplyFeedback({
                    type: "success",
                    message: `Reply sent to ${ticket.email}`,
                });
                setReplyMessage("");
            } else {
                setReplyFeedback({
                    type: "error",
                    message: data.error || "Failed to send reply",
                });
            }
        } catch (error) {
            console.error("Failed to send reply:", error);
            setReplyFeedback({
                type: "error",
                message: "An error occurred while sending the reply",
            });
        } finally {
            setSendingReply(false);
        }
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

    const getReportTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            route_problem: "Route Problem",
            feedback: "Feedback",
            bus_delay: "Bus Delay",
            other: "Other",
        };
        return labels[type] || type;
    };

    const getStatusBadge = (status: string) => {
        if (status === "Resolved") return "bg-[#E1FFDA] text-[#3EB900]";
        if (status === "Open") return "bg-[#FFC0B9] text-[#EA1701]";
        if (status === "In Progress") return "bg-[#FFF4CC] text-[#B8860B]";
        return "bg-[#2C2D33] text-[#87888C]";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="text-[#87888C] font-['Inter'] text-sm">
                    Loading ticket details...
                </span>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="flex items-center justify-center h-64 flex-col gap-4">
                <span className="text-[#87888C] font-['Inter'] text-sm">
                    Ticket not found
                </span>
                <Link
                    href="/admin/support-tickets"
                    className="text-[#96DDFF] hover:underline font-['Inter'] text-sm"
                >
                    Back to Support Tickets
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/support-tickets"
                        className="text-white hover:text-[#96DDFF] transition"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
                        Ticket Details – T{String(ticket.id).padStart(3, "0")}
                    </h1>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-2 gap-6">
                {/* ===== LEFT COLUMN: Ticket Information ===== */}
                <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
                    <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                        Ticket Information
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[#87888C] font-['Inter'] text-sm">Ticket ID</span>
                            <span className="text-white font-['Inter'] text-sm">
                                T{String(ticket.id).padStart(3, "0")}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#87888C] font-['Inter'] text-sm">Email</span>
                            <span className="text-white font-['Inter'] text-sm break-all">
                                {ticket.email}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#87888C] font-['Inter'] text-sm">Report Type</span>
                            <span className="text-white font-['Inter'] text-sm">
                                {getReportTypeLabel(ticket.reportType)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#87888C] font-['Inter'] text-sm">Submitted</span>
                            <span className="text-white font-['Inter'] text-sm">
                                {formatDate(ticket.createdAt)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#87888C] font-['Inter'] text-sm">Last Updated</span>
                            <span className="text-white font-['Inter'] text-sm">
                                {formatDate(ticket.updatedAt)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#87888C] font-['Inter'] text-sm">Status</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold font-['Inter'] ${getStatusBadge(ticket.status)}`}>
                                {ticket.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ===== RIGHT COLUMN: Description + Attachments + Reply ===== */}
                <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
                    {/* User Description */}
                    <h3 className="text-white font-bold font-['Inter'] text-base mb-3">
                        User Description
                    </h3>
                    <div className="bg-[#171821] rounded-xl p-4 border border-[#2C2D33]">
                        <p className="text-white font-['Inter'] text-sm whitespace-pre-wrap break-words">
                            {ticket.description}
                        </p>
                    </div>

                    <div className="border-t border-[#2C2D33] my-6 -mx-6" />

                    {/* Attachments */}
                    <h3 className="text-white font-bold font-['Inter'] text-base mb-3">
                        Attachments ({ticket.fileUrls.length})
                    </h3>
                    {ticket.fileUrls.length === 0 ? (
                        <p className="text-[#87888C] font-['Inter'] text-sm">
                            No files attached
                        </p>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {ticket.fileUrls.map((url, index) => {
                                const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(url);
                                return (
                                    <a
                                        key={index}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#171821] rounded-xl border border-[#2C2D33] overflow-hidden hover:border-[#96DDFF] transition group"
                                    >
                                        {isImage ? (
                                            <img
                                                src={url}
                                                alt={`Attachment ${index + 1}`}
                                                className="w-full h-24 object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-24 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-[#87888C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="p-2">
                                            <p className="text-white font-['Inter'] text-xs truncate group-hover:text-[#96DDFF]">
                                                {url.split("/").pop()}
                                            </p>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    <div className="border-t border-[#2C2D33] my-6 -mx-6" />

                    {/* Admin Reply */}
                    <h3 className="text-white font-bold font-['Inter'] text-base mb-3">
                        Reply to User
                    </h3>
                    <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply here. This will be sent to the user's email address."
                        rows={5}
                        disabled={sendingReply}
                        className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#2B2B36] resize-none disabled:opacity-50"
                    />

                    {replyFeedback && (
                        <div
                            className={`mt-3 p-3 rounded-lg font-['Inter'] text-sm ${replyFeedback.type === "success"
                                ? "bg-[#3EB900]/20 border border-[#3EB900] text-[#3EB900]"
                                : "bg-[#CD0000]/20 border border-[#CD0000] text-[#CD0000]"
                                }`}
                        >
                            {replyFeedback.message}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center justify-end gap-3">
                        {ticket.status !== "Resolved" && ticket.status !== "Closed" && (
                            <button
                                onClick={() => handleStatusChange("Resolved")}
                                disabled={updating}
                                className="px-5 py-2.5 bg-[#3EB900] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#359e00] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {updating ? "Updating..." : "Mark as Resolved"}
                            </button>
                        )}
                        <button
                            onClick={handleSendReply}
                            disabled={sendingReply || !replyMessage.trim()}
                            className="px-5 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            {sendingReply ? "Sending..." : "Send Reply"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}