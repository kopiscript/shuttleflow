// app/admin/routes/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Bus {
  id: number;
  busName: string;
  licensePlate: string;
  device?: {
    id: number;
    deviceName: string;
    status: string;
  };
}

interface Route {
  id: number;
  routeName: string;
  pickupStop: string;
  dropoffStop: string;
  intermediateStops: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedBuses?: Bus[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RouteDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeId, setRouteId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params;
      setRouteId(parseInt(id));
    };
    unwrapParams();
  }, [params]);

  // Fetch route details
  useEffect(() => {
    if (!routeId) return;

    const fetchRouteDetails = async () => {
      try {
        const response = await fetch(`/api/admin/routes/${routeId}`);
        const data = await response.json();
        
        if (data.success) {
          setRoute(data.route);
          setIsActive(data.route.status === "Active");
        }
      } catch (error) {
        console.error("Failed to fetch route details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRouteDetails();
  }, [routeId]);

  const toggleStatus = async () => {
    if (!route) return;
    
    const newStatus = isActive ? "Inactive" : "Active";
    setIsActive(!isActive);
    
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...route,
          status: newStatus,
        }),
      });
      
      const data = await response.json();
      if (!data.success) {
        // Revert if failed
        setIsActive(isActive);
        alert("Failed to update status: " + data.error);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setIsActive(isActive);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push("/admin/routes");
      } else {
        alert("Failed to delete route: " + data.error);
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("An error occurred while deleting the route.");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#87888C] font-['Inter'] text-sm">Loading route details...</span>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-4">
        <span className="text-[#87888C] font-['Inter'] text-sm">Route not found</span>
        <Link href="/admin/routes" className="text-[#96DDFF] hover:underline font-['Inter'] text-sm">
          Back to Route Management
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/routes" className="text-white hover:text-[#96DDFF] transition">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
            Route Details – R{String(route.id).padStart(3, "0")} ({route.routeName})
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/routes/${route.id}/edit`}
            className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] max-w-3xl">
        <div className="p-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-white font-bold font-['Inter'] text-base mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Route ID</span>
                <span className="text-white font-['Inter'] text-sm">R{String(route.id).padStart(3, "0")}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Route Name</span>
                <span className="text-white font-['Inter'] text-sm">{route.routeName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Pickup Stop</span>
                <span className="text-white font-['Inter'] text-sm">{route.pickupStop}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Drop-off Stop</span>
                <span className="text-white font-['Inter'] text-sm">{route.dropoffStop}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Intermediate Stops</span>
                <span className="text-white font-['Inter'] text-sm">
                  {route.intermediateStops?.length > 0 
                    ? route.intermediateStops.join(", ") 
                    : "None"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Status</span>
                <div className="flex items-center gap-3">
                  <span className={`font-['Inter'] text-sm ${isActive ? "text-[#3EB900]" : "text-[#EA1701]"}`}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    type="button"
                    onClick={toggleStatus}
                    className={`relative w-[46px] h-[23px] rounded-full transition-colors ${
                      isActive ? "bg-[#96DDFF]" : "bg-[#C7C7CC]"
                    }`}
                  >
                    <div
                      className={`absolute top-[3px] w-[17px] h-[17px] bg-white rounded-full shadow-md transition-all ${
                        isActive ? "right-[3px]" : "left-[3px]"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-4 text-right">
            <span className="text-[#87888C] font-['Inter'] text-xs">
              Last updated: {formatDate(route.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Buses Card */}
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] max-w-3xl mt-6">
        <div className="p-6">
          <h3 className="text-white font-bold font-['Inter'] text-base mb-2">
            Assigned Buses
          </h3>
          <p className="text-[#87888C] font-['Inter'] text-sm mb-4">
            To change which buses are on this route, go to each bus's detail page and update the assigned route there.
          </p>

          {route.assignedBuses && route.assignedBuses.length > 0 ? (
            <div className="bg-[#171821] rounded-2xl overflow-hidden border border-[#2C2D33]">
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
                      Device Name
                    </th>
                    <th className="text-left px-6 py-4 text-white font-semibold font-['Inter'] text-sm">
                      Device Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {route.assignedBuses.map((bus, index) => (
                    <tr
                      key={bus.id}
                      className={`border-t border-[#2C2D33] hover:bg-[#2B2B36] transition ${
                        index % 2 === 0 ? "bg-[#171821]" : "bg-[#1D1E27]"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/buses/${bus.id}`}
                          className="text-white hover:text-[#96DDFF] transition font-['Inter'] text-sm"
                        >
                          B{String(bus.id).padStart(3, "0")}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-white font-['Inter'] text-sm">
                        {bus.licensePlate}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-[#171821] rounded-2xl border border-[#2C2D33] p-8 text-center">
              <p className="text-[#87888C] font-['Inter'] text-sm">
                No buses assigned to this route yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6 max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white font-['Bai_Jamjuree']">
                Delete Route
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#87888C] hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#CD0000]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#CD0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              <p className="text-white text-center font-['Inter'] text-base">
                Are you sure you want to delete <br />
                <span className="font-bold text-[#CD0000]">
                  Route R{String(route.id).padStart(3, "0")} ({route.routeName})
                </span>
                ?
              </p>
              <p className="text-[#87888C] text-center font-['Inter'] text-sm mt-2">
                This action cannot be undone. All data associated with this route will be permanently removed.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2.5 bg-[#2C2D33] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#3C3D44] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}