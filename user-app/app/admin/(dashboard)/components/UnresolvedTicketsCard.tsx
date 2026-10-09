// app/admin/(dashboard)/components/UnresolvedTicketsCard.tsx
"use client";
import Link from "next/link";

interface TicketPreview {
  id: number;
  reportType: string;
}

interface UnresolvedTicketsCardProps {
  count: number;
  tickets: TicketPreview[];
  loading?: boolean;
}

export default function UnresolvedTicketsCard({
  count,
  tickets,
  loading = false,
}: UnresolvedTicketsCardProps) {
  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      route_problem: "Route Problem",
      feedback: "Feedback",
      bus_delay: "Bus Delay",
      other: "Other",
    };
    return labels[type] || type;
  };

  const previewTickets = tickets.slice(0, 6);

  return (
    <div className="bg-[#21222D] border border-[#2C2D33] rounded-2xl p-6 flex flex-col">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-white font-bold font-['Inter'] text-base">
            Unresolved Tickets
          </h2>
          <p className="text-[#87888C] font-['Inter'] text-xs mt-1">
            Awaiting admin response
          </p>
        </div>
        <div className="text-right">
          {loading ? (
            <span className="text-[#87888C] font-['Inter'] text-sm">...</span>
          ) : (
            <span className="text-white font-bold font-['Bai_Jamjuree'] text-3xl">
              {count}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-[#2C2D33] mb-4" />

      {/* No overflow-hidden, no fixed height — the table just renders
          its natural height and the card grows to fit. */}
      <div className="rounded-lg border border-[#2C2D33]">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-[#2B2B36]">
              <th className="text-left px-4 py-3 text-white font-semibold font-['Inter'] text-xs">
                Ticket ID
              </th>
              <th className="text-left px-4 py-3 text-white font-semibold font-['Inter'] text-xs">
                Report Type
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-[#87888C] font-['Inter'] text-xs"
                >
                  Loading tickets...
                </td>
              </tr>
            ) : previewTickets.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-[#87888C] font-['Inter'] text-xs"
                >
                  No unresolved tickets
                </td>
              </tr>
            ) : (
              previewTickets.map((ticket, index) => (
                <tr
                  key={ticket.id}
                  className={`border-t border-[#2C2D33] ${
                    index % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"
                  }`}
                >
                  <td className="px-4 py-4 text-white font-['Inter'] text-xs">
                    T{String(ticket.id).padStart(3, "0")}
                  </td>
                  <td className="px-4 py-4 text-[#87888C] font-['Inter'] text-xs">
                    {getReportTypeLabel(ticket.reportType)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5">
        <Link
          href="/admin/support-tickets?status=unresolved"
          className="group inline-flex items-center gap-2 text-[#96DDFF] font-['Inter'] text-sm font-semibold hover:text-white transition-colors"
        >
          <span>View unresolved tickets</span>
          <svg
            className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}