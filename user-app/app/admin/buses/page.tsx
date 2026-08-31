// app/admin/buses/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ActionMenu from "@/components/ActionMenu";

interface Bus {
  id: number;
  busName: string;
  licensePlate: string;
  capacity: number;
  status: string;
  route?: {
    id: number;
    routeName: string;
  };
  device?: {
    id: number;
    deviceName: string;
    status: string;
  };
}

export default function BusManagement() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch buses
  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const response = await fetch("/api/admin/buses");
      const data = await response.json();
      if (data.success) {
        setBuses(data.buses);
      }
    } catch (error) {
      console.error("Failed to fetch buses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (busId: number) => {
    try {
      const response = await fetch(`/api/admin/buses/${busId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBuses(buses.filter(bus => bus.id !== busId));
      } else {
        alert("Failed to delete bus: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting bus:", error);
      alert("An error occurred while deleting the bus.");
    }
  };

  // Filter buses by search term
  const filteredBuses = buses.filter((bus) =>
    bus.busName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.route?.routeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBuses = filteredBuses.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Generate page numbers with ellipsis
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

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
          Shuttle Management
        </h1>
        <p className="text-[#87888C] mt-2 font-['Inter'] text-sm">
          Create and manage all buses in the system. For each bus, you can assign a specific route and link the hardware device installed on it.
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search here..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#21222D] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#D2D2D2]"
          />
        </div>
        <Link
          href="/admin/buses/add"
          className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition flex items-center gap-2 whitespace-nowrap"
        >
          <span>+</span> Add Shuttle
        </Link>
      </div>

      {/* Table */}
      <div className="bg-[#21222D] rounded-2xl overflow-hidden border border-[#2C2D33]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#2B2B36]">
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                  Bus ID
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                  License Plate
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                  Route
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                  Device
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                  Device Status
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">
                    Loading buses...
                  </td>
                </tr>
              ) : paginatedBuses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">
                    {searchTerm ? "No buses match your search." : "No buses added yet. Click 'Add Shuttle' to create one."}
                  </td>
                </tr>
              ) : (
                paginatedBuses.map((bus, index) => (
                  <tr
                    key={bus.id}
                    className={`border-t border-[#2C2D33] hover:bg-[#2B2B36] transition ${
                      index % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"
                    }`}
                  >
                    <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                      B{String(bus.id).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                      {bus.licensePlate}
                    </td>
                    <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                      {bus.route?.routeName || "—"}
                    </td>
                    <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                      {bus.device?.deviceName || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold font-['Inter'] ${
                          bus.device?.status === "Online"
                            ? "bg-[#E1FFDA] text-[#3EB900]"
                            : bus.device?.status === "Offline"
                            ? "bg-[#FFC0B9] text-[#EA1701]"
                            : "bg-[#2C2D33] text-[#87888C]"
                        }`}
                      >
                        {bus.device?.status || "No Device"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ActionMenu 
                        id={bus.id} 
                        type="bus" 
                        onDelete={handleDelete}
                        customDeleteMessage={`Are you sure you want to delete bus B${String(bus.id).padStart(3, "0")} (${bus.licensePlate})?`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Figma-styled Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end px-6 py-4 border-t border-[#2C2D33]">
            <div className="flex items-center gap-2">
              <button
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
    </div>
  );
}