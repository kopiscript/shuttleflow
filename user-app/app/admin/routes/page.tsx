// app/admin/routes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ActionMenu from "@/components/ActionMenu";

interface Route {
  id: number;
  routeName: string;
  pickupStop: string;
  dropoffStop: string;
  intermediateStops: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch routes
  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching routes from /api/admin/routes...");
      const response = await fetch("/api/admin/routes");
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Response is not JSON:", text.substring(0, 200));
        throw new Error("API returned non-JSON response. Check if the API route exists.");
      }
      
      const data = await response.json();
      console.log("Routes data:", data);
      
      if (data.success) {
        setRoutes(data.routes || []);
      } else {
        throw new Error(data.error || "Failed to fetch routes");
      }
    } catch (error) {
      console.error("Failed to fetch routes:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch routes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (routeId: number) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRoutes(routes.filter(route => route.id !== routeId));
      } else {
        alert("Failed to delete route: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("An error occurred while deleting the route.");
    }
  };

  // Filter routes by search term
  const filteredRoutes = routes.filter((route) =>
    route.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.pickupStop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.dropoffStop?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoutes = filteredRoutes.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
          Route Management
        </h1>
        <p className="text-[#87888C] mt-2 font-['Inter'] text-sm">
          Define and update bus routes across campus or city. Once a route is created, you can easily assign it to one or more buses with just a few clicks.
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
          href="/admin/routes/add"
          className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition flex items-center gap-2 whitespace-nowrap"
        >
          <span>+</span> Add Route
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-[#CD0000]/20 border border-[#CD0000] rounded-lg text-[#CD0000] font-['Inter'] text-sm">
          <p className="font-semibold">Error loading routes:</p>
          <p>{error}</p>
          <button 
            onClick={fetchRoutes}
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
                  Route ID
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                  Route Name
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                  Pickup Stop
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                  Drop-off Stop
                </th>
                <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                  Status
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
                    Loading routes...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#CD0000] font-['Inter'] text-sm">
                    Failed to load routes. Please try again.
                  </td>
                </tr>
              ) : paginatedRoutes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#87888C] font-['Inter'] text-sm">
                    {searchTerm ? "No routes match your search." : "No routes added yet. Click 'Add Route' to create one."}
                  </td>
                </tr>
              ) : (
                paginatedRoutes.map((route, index) => (
                  <tr
                    key={route.id}
                    className={`border-t border-[#2C2D33] hover:bg-[#2B2B36] transition ${
                      index % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"
                    }`}
                  >
                    <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                      R{String(route.id).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                      {route.routeName}
                    </td>
                    <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                      {route.pickupStop}
                    </td>
                    <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                      {route.dropoffStop}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold font-['Inter'] ${
                          route.status === "Active"
                            ? "bg-[#E1FFDA] text-[#3EB900]"
                            : "bg-[#FFC0B9] text-[#EA1701]"
                        }`}
                      >
                        {route.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ActionMenu 
                        id={route.id} 
                        type="route" 
                        onDelete={handleDelete}
                        customDeleteMessage={`Are you sure you want to delete route R${String(route.id).padStart(3, "0")} (${route.routeName})?`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Figma-styled Pagination */}
        {totalPages > 1 && !error && (
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