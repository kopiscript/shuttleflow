// app/admin/devices/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ActionMenu from "@/components/ActionMenu";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Device {
  id: number;
  deviceName: string;
  isUnclaimed?: boolean;
  status: string;
  lastSeen: string | null;
  busId: number | null;
  busName?: string;
  busLicensePlate?: string;
  createdAt: string;
}

interface DeleteModalState {
  isOpen: boolean;
  deviceId: number | null;
  deviceName: string;
  isDeleting: boolean;
}

const initialDeleteModal: DeleteModalState = {
  isOpen: false,
  deviceId: null,
  deviceName: "",
  isDeleting: false,
};

type FilterMode = "ALL" | "UNCLAIMED" | "CLAIMED" | "UNASSIGNED_BUS";

export default function DeviceManagement() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(initialDeleteModal);

  // Filter Dropdown state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch devices
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching devices from /api/admin/devices...");
      const response = await fetch("/api/admin/devices");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Response is not JSON:", text.substring(0, 200));
        throw new Error("API returned non-JSON response.");
      }

      const data = await response.json();
      console.log("Devices data:", data);

      if (data.success) {
        setDevices(data.devices || []);
      } else {
        throw new Error(data.error || "Failed to fetch devices");
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  // ---- Delete flow (shared modal) ----
  const handleDeleteClick = (deviceId: number, deviceName: string) => {
    setDeleteModal({
      isOpen: true,
      deviceId,
      deviceName,
      isDeleting: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.deviceId) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      const response = await fetch(`/api/admin/devices/${deleteModal.deviceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        const updatedDevices = devices.filter((device) => device.id !== deleteModal.deviceId);
        setDevices(updatedDevices);
        setDeleteModal(initialDeleteModal);

        // ✅ Fix: adjust current page if the current page becomes empty
        const newTotalPages = Math.ceil(updatedDevices.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        } else if (newTotalPages === 0) {
          setCurrentPage(1);
        }
      } else {
        alert("Failed to delete device: " + data.error);
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      console.error("Error deleting device:", error);
      alert("An error occurred while deleting the device.");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleCloseModal = () => {
    if (!deleteModal.isDeleting) setDeleteModal(initialDeleteModal);
  };

  // ---- Row navigation ----
  const handleRowClick = (deviceId: number) => {
    router.push(`/admin/devices/${deviceId}`);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, deviceId: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRowClick(deviceId);
    }
  };

  const isDeviceUnclaimed = (device: Device) =>
    Boolean(device.isUnclaimed || device.deviceName?.toUpperCase().startsWith("UNCLAIMED"));

  // Filter devices by dropdown filter mode AND search term
  const filteredDevices = devices.filter((device) => {
    const unclaimed = isDeviceUnclaimed(device);

    if (filterMode === "UNCLAIMED" && !unclaimed) return false;
    if (filterMode === "CLAIMED" && unclaimed) return false;
    if (filterMode === "UNASSIGNED_BUS" && device.busId !== null) return false;

    const searchTermLower = searchTerm.toLowerCase().trim();
    if (!searchTermLower) return true;

    const formattedId = `D${String(device.id).padStart(3, "0")}`;
    const formattedBusId = device.busId ? `B${String(device.busId).padStart(3, "0")}` : "";
    const licensePlate = device.busLicensePlate || "";

    const searchFields = [
      device.id.toString(),
      formattedId.toLowerCase(),
      device.deviceName?.toLowerCase() || "",
      device.busName?.toLowerCase() || "",
      formattedBusId.toLowerCase(),
      device.busId?.toString() || "",
      licensePlate.toLowerCase(),
      device.status?.toLowerCase() || "",
      unclaimed ? "unclaimed" : "claimed",
    ];

    return searchFields.some((field) => field.includes(searchTermLower));
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMode]);

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

  const getStatusBadge = (status: string) => {
    if (status === "Online") return "bg-[#E1FFDA] text-[#3EB900]";
    if (status === "Warning") return "bg-[#FFF4CC] text-[#B8860B]";
    if (status === "Offline") return "bg-[#FFC0B9] text-[#EA1701]";
    return "bg-[#2C2D33] text-[#87888C]";
  };

  const getBusDisplay = (device: Device) => {
    if (!device.busId) return "Unassigned";
    const busId = `B${String(device.busId).padStart(3, "0")}`;
    return device.busLicensePlate ? `${busId} (${device.busLicensePlate})` : busId;
  };

  const filterOptions: { label: string; value: FilterMode }[] = [
    { label: "All Devices", value: "ALL" },
    { label: "Unclaimed Name (NVS)", value: "UNCLAIMED" },
    { label: "Claimed Devices", value: "CLAIMED" },
    { label: "Unassigned Bus", value: "UNASSIGNED_BUS" },
  ];

  const currentFilterLabel =
    filterOptions.find((f) => f.value === filterMode)?.label || "All Devices";

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
          Device Management
        </h1>
        <p className="text-[#87888C] mt-2 font-['Inter'] text-sm">
          Manage GPS devices across your fleet. Monitor device status, claim newly flashed NVS units, and assign devices to buses.
        </p>
      </div>

      {/* Search, Filter Dropdown, and Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by ID, Name, MAC, Assigned Bus, Status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#21222D] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#D2D2D2]"
          />
        </div>

        {/* Custom Filter Dropdown */}
        <div className="relative w-full sm:w-52" ref={filterRef}>
          <div
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 bg-[#21222D] text-white rounded-lg border border-[#2C2D33] cursor-pointer hover:border-[#96DDFF] transition font-['Inter'] text-sm"
          >
            <span className="truncate">{currentFilterLabel}</span>
            <svg
              className={`w-4 h-4 text-[#87888C] transition-transform ${isFilterOpen ? "rotate-180" : ""
                }`}
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

          {isFilterOpen && (
            <div className="absolute right-0 z-50 w-full mt-2 bg-[#21222D] border border-[#2C2D33] rounded-xl shadow-xl overflow-hidden">
              {filterOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setFilterMode(opt.value);
                    setIsFilterOpen(false);
                  }}
                  className={`px-4 py-2.5 text-sm font-['Inter'] cursor-pointer hover:bg-[#2B2B36] transition ${filterMode === opt.value
                      ? "text-[#96DDFF] bg-[#2B2B36]"
                      : "text-white"
                    }`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/admin/devices/add"
          className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <span>+</span> Add Device
        </Link>
      </div>

      {/* Search Results Count */}
      {!loading && !error && (searchTerm || filterMode !== "ALL") && (
        <div className="text-[#87888C] font-['Inter'] text-sm mb-3">
          Found {filteredDevices.length} result{filteredDevices.length !== 1 ? "s" : ""}
          {searchTerm ? ` for "${searchTerm}"` : ""}
          {filterMode !== "ALL" ? ` (${currentFilterLabel})` : ""}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-[#CD0000]/20 border border-[#CD0000] rounded-lg text-[#CD0000] font-['Inter'] text-sm">
          <p className="font-semibold">Error loading devices:</p>
          <p>{error}</p>
          <button
            onClick={fetchDevices}
            className="mt-2 px-4 py-2 bg-[#96DDFF] text-[#171821] rounded-lg hover:bg-[#7ec4e8] transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#21222D] rounded-2xl overflow-hidden border border-[#2C2D33]">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#2B2B36]">
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Device ID</th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Device Name</th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Status</th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Assigned Bus</th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Last Seen</th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">
                    Loading devices...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#CD0000] font-['Inter'] text-sm">
                    Failed to load devices. Please try again.
                  </td>
                </tr>
              ) : paginatedDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">
                    {searchTerm || filterMode !== "ALL"
                      ? "No devices match your current filter."
                      : "No devices added yet. Power on an ESP32 or click 'Add Device' to create one."}
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((device, index) => {
                  const unclaimed = isDeviceUnclaimed(device);
                  return (
                    <tr
                      key={device.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for device D${String(device.id).padStart(3, "0")}`}
                      onClick={() => handleRowClick(device.id)}
                      onKeyDown={(e) => handleRowKeyDown(e, device.id)}
                      className={`border-t border-[#2C2D33] hover:bg-[#2B2B36] transition cursor-pointer focus:outline-none focus:bg-[#2B2B36] ${index % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"
                        }`}
                    >
                      <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                        D{String(device.id).padStart(3, "0")}
                      </td>
                      <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                        <div className="flex items-center gap-2">
                          <span>{device.deviceName}</span>
                          {unclaimed && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF4CC]/20 text-[#F5A623] border border-[#F5A623]/40">
                              Unclaimed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold font-['Inter'] ${getStatusBadge(
                            device.status
                          )}`}
                        >
                          {device.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                        {getBusDisplay(device)}
                      </td>
                      <td className="px-6 py-4 text-[#87888C] font-['Inter'] text-sm">
                        {device.lastSeen
                          ? new Date(device.lastSeen).toLocaleString()
                          : "Never"}
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <ActionMenu
                          id={device.id}
                          type="device"
                          onDelete={handleDeleteClick}
                          itemName={device.deviceName}
                        />
                      </td>
                    </tr>
                  );
                })
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

      {/* Shared Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Device"
        message="Are you sure you want to delete"
        itemName={
          deleteModal.deviceId
            ? `Device D${String(deleteModal.deviceId).padStart(3, "0")} (${deleteModal.deviceName})`
            : undefined
        }
        description="This action cannot be undone. All data associated with this device will be permanently removed."
        loading={deleteModal.isDeleting}
      />
    </div>
  );
}