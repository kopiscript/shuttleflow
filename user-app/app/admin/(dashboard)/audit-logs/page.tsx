"use client";

import { useState, useEffect, useMemo, useRef } from "react";

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

// Reusable UI Component for standard dropdowns
const CustomDropdown = ({
  value,
  options,
  onChange,
  className = "w-full",
  scrollable = true,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(
    (opt: any) => opt.value.toString() === value.toString(),
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2.5 bg-[#171821] text-white rounded-xl border border-[#2C2D33] cursor-pointer hover:border-[#96DDFF] transition text-sm"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : "Select..."}
        </span>
        <svg
          className={`w-4 h-4 text-[#87888C] transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {isOpen && (
        <div
          className={`absolute right-0 z-50 w-full min-w-[140px] mt-2 bg-[#21222D] border border-[#2C2D33] rounded-xl shadow-xl overflow-hidden ${scrollable ? "max-h-60 overflow-y-auto" : ""}`}
        >
          {options.map((opt: any) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-[#2B2B36] transition ${value.toString() === opt.value.toString() ? "text-[#96DDFF] bg-[#2B2B36]" : "text-white"}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

type AuditTab = "AUTH" | "BUS" | "ROUTE" | "DEVICE" | "SETTINGS";

const AUDIT_TABS: { value: AuditTab; label: string }[] = [
  { value: "AUTH", label: "Authentication" },
  { value: "BUS", label: "Bus" },
  { value: "ROUTE", label: "Route" },
  { value: "DEVICE", label: "Device" },
  { value: "SETTINGS", label: "Settings" },
];

const FLEET_ACTION_OPTIONS = [
  { label: "Add", suffix: "CREATED" },
  { label: "Edit", suffix: "UPDATED" },
  { label: "Delete", suffix: "DELETED" },
];

function matchesTab(log: AdminAuditLogItem, tab: AuditTab) {
  if (tab === "AUTH" || tab === "SETTINGS") {
    return log.category === tab;
  }

  if (log.category !== "FLEET") return false;

  // Use targetType, with a fallback for older logs.
  const targetType = log.targetType?.toUpperCase();

  return (
    targetType === tab || (!targetType && log.action.startsWith(`${tab}_`))
  );
}

function getActionLabel(action: string) {
  const simpleActions: Record<string, string> = {
    BUS_CREATED: "Added",
    BUS_UPDATED: "Edited",
    BUS_DELETED: "Deleted",
    ROUTE_CREATED: "Added",
    ROUTE_UPDATED: "Edited",
    ROUTE_DELETED: "Deleted",
    DEVICE_CREATED: "Added",
    DEVICE_UPDATED: "Edited",
    DEVICE_DELETED: "Deleted",
  };

  if (simpleActions[action]) return simpleActions[action];

  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<AuditTab>("AUTH");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Record<
    string,
    any
  > | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/audit_logs");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.success) setLogs(data.logs || []);
      else throw new Error(data.error || "Failed to fetch audit logs");
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch audit logs",
      );
    } finally {
      setLoading(false);
    }
  };

  const tabLogs = useMemo(() => {
    return logs.filter((log) => matchesTab(log, selectedTab));
  }, [logs, selectedTab]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(tabLogs.map((log) => log.action))).sort();
  }, [tabLogs]);

  const filteredLogs = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();

    return tabLogs.filter((log) => {
      if (selectedAction !== "ALL" && log.action !== selectedAction) {
        return false;
      }

      if (!searchLower) return true;

      const searchableText = [
        log.admin?.username || "System / Anonymous",
        log.admin?.email || "",
        log.action,
        getActionLabel(log.action),
        log.targetType || "",
        log.targetId || "",
        `#${log.id}`,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchLower);
    });
  }, [tabLogs, searchTerm, selectedAction]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const isFirst = i === 1;
      const isLast = i === totalPages;
      const isNearCurrent = Math.abs(i - currentPage) <= 1;

      if (isFirst || isLast || isNearCurrent) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      "Log ID",
      "Admin",
      "Admin Email",
      "Category",
      "Action",
      "Target Type",
      "Target ID",
      "IP Address",
      "Timestamp",
    ];
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

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
            Audit Logs
          </h1>
          <p className="text-[#87888C] font-['Inter'] text-sm mt-1">
            Track administrator actions, authentication events, and fleet
            mutations
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredLogs.length === 0}
          className="px-5 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-bold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export to CSV ({filteredLogs.length})
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Audit log categories"
        className="flex flex-wrap gap-2 border-b border-[#2C2D33] pb-3"
      >
        {AUDIT_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selectedTab === tab.value}
            onClick={() => {
              setSelectedTab(tab.value);
              setSelectedAction("ALL");
              setCurrentPage(1);
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              selectedTab === tab.value
                ? "bg-[#96DDFF] text-[#171821]"
                : "bg-[#21222D] text-[#87888C] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar with Custom Dropdowns */}
      <div className="bg-[#21222D] p-4 rounded-2xl border border-[#2C2D33] flex flex-col md:flex-row gap-3">
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

        <CustomDropdown
          className="w-full md:w-56"
          value={selectedAction}
          onChange={(val: string) => {
            setSelectedAction(val);
            setCurrentPage(1);
          }}
          options={[
            { label: "All Actions", value: "ALL" },
            ...(selectedTab === "BUS" ||
            selectedTab === "ROUTE" ||
            selectedTab === "DEVICE"
              ? FLEET_ACTION_OPTIONS.map((action) => ({
                  label: action.label,
                  value: `${selectedTab}_${action.suffix}`,
                }))
              : uniqueActions.map((action) => ({
                  label: getActionLabel(action),
                  value: action,
                }))),
          ]}
        />

        <CustomDropdown
          className="w-full md:w-32"
          value={itemsPerPage}
          onChange={(val: number) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
          options={[
            { label: "10 / page", value: 10 },
            { label: "25 / page", value: 25 },
            { label: "50 / page", value: 50 },
          ]}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-[#CD0000]/20 border border-[#CD0000] rounded-lg text-[#CD0000] text-sm">
          <p className="font-semibold">Error loading audit logs:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-[#21222D] rounded-2xl overflow-hidden border border-[#2C2D33]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#2B2B36]">
              <tr>
                <th className="text-left px-6 py-4 text-white font-semibold text-sm">
                  Log ID
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold text-sm">
                  Admin
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold text-sm">
                  Category
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold text-sm">
                  Action
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold text-sm">
                  Target
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold text-sm">
                  Snapshot
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold text-sm">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-[#87888C] text-sm"
                  >
                    Loading audit records...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-[#87888C] text-sm"
                  >
                    No records match.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={`border-t border-[#2C2D33] hover:bg-[#2B2B36] transition ${index % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"}`}
                  >
                    <td className="px-6 py-4 text-white text-sm whitespace-nowrap">
                      #{log.id}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {log.admin ? (
                        <div>
                          <span className="text-white font-medium block">
                            {log.admin.username}
                          </span>
                          <span className="text-[#87888C] text-xs">
                            {log.admin.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#87888C]">
                          System / Anonymous
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryBadge(log.category)}`}
                      >
                        {log.category === "AUTH"
                          ? "Authentication"
                          : log.category === "SETTINGS"
                            ? "Settings"
                            : log.targetType || "Fleet"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#96DDFF] text-sm font-medium whitespace-nowrap">
                      {getActionLabel(log.action)}
                    </td>
                    <td className="px-6 py-4 text-[#87888C] text-sm whitespace-nowrap">
                      {log.targetType
                        ? `${log.targetType} ${log.targetId ? `(#${log.targetId})` : ""}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedSnapshot(log.details)}
                          className="px-3 py-1 bg-[#171821] border border-[#2C2D33] text-white hover:border-[#96DDFF] rounded-lg text-xs transition"
                        >
                          View Snapshot
                        </button>
                      ) : (
                        <span className="text-[#87888C] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#87888C] text-sm whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
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
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg font-['Inter'] text-sm transition ${
                  currentPage === 1
                    ? "text-[#87888C] cursor-not-allowed"
                    : "text-[#87888C] hover:text-white"
                }`}
              >
                Previous
              </button>

              {getPageNumbers().map((page, index) => {
                if (typeof page === "string") {
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
                    type="button"
                    onClick={() => goToPage(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`px-3 py-2 rounded-lg font-['Inter'] text-sm transition ${
                      currentPage === page
                        ? "bg-[#96DDFF] text-[#171821]"
                        : "text-[#87888C] hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg font-['Inter'] text-sm transition ${
                  currentPage === totalPages
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

      {/* JSON Snapshot Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6 max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#2C2D33]">
              <h3 className="text-lg font-bold text-white">
                Record Snapshot Payload
              </h3>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="text-[#87888C] hover:text-white transition"
              >
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
                className="px-5 py-2 bg-[#2B2B36] hover:bg-[#3C3D44] text-white rounded-lg text-sm transition"
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
