// app/admin/routes/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { validateRouteFields, hasErrors, RouteValidationErrors } from "@/lib/validation";

const RoutePickerMap = dynamic(
  () => import("../../../components/RoutePickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-[#171821] rounded-lg border border-[#2C2D33] flex items-center justify-center">
        <span className="text-[#87888C] font-['Inter'] text-sm">
          Loading map...
        </span>
      </div>
    ),
  }
);

interface Route {
  id: number;
  routeName: string;
  pickupStop: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffStop: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  intermediateStops: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditRoutePage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routeId, setRouteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    routeName: "",
    pickupStop: "",
    pickupLat: "",
    pickupLng: "",
    dropoffStop: "",
    dropoffLat: "",
    dropoffLng: "",
    intermediateStops: "",
  });
  const [errors, setErrors] = useState<RouteValidationErrors>({});

  // Refs for scroll-to-error
  const routeNameRef = useRef<HTMLInputElement>(null);
  const pickupStopRef = useRef<HTMLInputElement>(null);
  const pickupLatRef = useRef<HTMLInputElement>(null);
  const pickupLngRef = useRef<HTMLInputElement>(null);
  const dropoffStopRef = useRef<HTMLInputElement>(null);
  const dropoffLatRef = useRef<HTMLInputElement>(null);
  const dropoffLngRef = useRef<HTMLInputElement>(null);
  const intermediateStopsRef = useRef<HTMLTextAreaElement>(null);

  // Unwrap params and fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id } = await params;
        const routeIdNum = parseInt(id);
        setRouteId(routeIdNum);

        const response = await fetch(`/api/admin/routes/${routeIdNum}`);
        const data = await response.json();

        if (data.success) {
          const route: Route = data.route;

          setFormData({
            routeName: route.routeName || "",
            pickupStop: route.pickupStop || "",
            pickupLat:
              route.pickupLat !== null && route.pickupLat !== undefined
                ? String(route.pickupLat)
                : "",
            pickupLng:
              route.pickupLng !== null && route.pickupLng !== undefined
                ? String(route.pickupLng)
                : "",
            dropoffStop: route.dropoffStop || "",
            dropoffLat:
              route.dropoffLat !== null && route.dropoffLat !== undefined
                ? String(route.dropoffLat)
                : "",
            dropoffLng:
              route.dropoffLng !== null && route.dropoffLng !== undefined
                ? String(route.dropoffLng)
                : "",
            intermediateStops: route.intermediateStops?.join(", ") || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params]);

  // Helper: scroll + focus the first field that has an error
  const scrollToFirstError = (validationErrors: RouteValidationErrors) => {
    const fieldOrder: (keyof RouteValidationErrors)[] = [
      "routeName",
      "pickupStop",
      "pickupLat",
      "pickupLng",
      "dropoffStop",
      "dropoffLat",
      "dropoffLng",
      "intermediateStops",
    ];

    const refMap: Record<
      keyof RouteValidationErrors,
      React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>
    > = {
      routeName: routeNameRef,
      pickupStop: pickupStopRef,
      pickupLat: pickupLatRef,
      pickupLng: pickupLngRef,
      dropoffStop: dropoffStopRef,
      dropoffLat: dropoffLatRef,
      dropoffLng: dropoffLngRef,
      intermediateStops: intermediateStopsRef,
    };

    for (const field of fieldOrder) {
      if (validationErrors[field]) {
        const el = refMap[field]?.current;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => el.focus({ preventScroll: true }), 300);
        }
        break;
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof RouteValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePickupChange = useCallback((lat: string, lng: string) => {
    setFormData((prev) => ({ ...prev, pickupLat: lat, pickupLng: lng }));
    // Clear coordinate errors when map updates them
    setErrors((prev) => ({
      ...prev,
      pickupLat: undefined,
      pickupLng: undefined,
    }));
  }, []);

  const handleDropoffChange = useCallback((lat: string, lng: string) => {
    setFormData((prev) => ({ ...prev, dropoffLat: lat, dropoffLng: lng }));
    // Clear coordinate errors when map updates them
    setErrors((prev) => ({
      ...prev,
      dropoffLat: undefined,
      dropoffLng: undefined,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Client-side validation
    const validationErrors = validateRouteFields({
      routeName: formData.routeName,
      pickupStop: formData.pickupStop,
      pickupLat: formData.pickupLat,
      pickupLng: formData.pickupLng,
      dropoffStop: formData.dropoffStop,
      dropoffLat: formData.dropoffLat,
      dropoffLng: formData.dropoffLng,
      intermediateStops: formData.intermediateStops,
    });

    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      scrollToFirstError(validationErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const intermediateStopsArray = formData.intermediateStops
        .split(",")
        .map((stop) => stop.trim())
        .filter((stop) => stop.length > 0);

      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeName: formData.routeName.trim(),
          pickupStop: formData.pickupStop.trim(),
          pickupLat: formData.pickupLat ? parseFloat(formData.pickupLat) : null,
          pickupLng: formData.pickupLng ? parseFloat(formData.pickupLng) : null,
          dropoffStop: formData.dropoffStop.trim(),
          dropoffLat: formData.dropoffLat
            ? parseFloat(formData.dropoffLat)
            : null,
          dropoffLng: formData.dropoffLng
            ? parseFloat(formData.dropoffLng)
            : null,
          intermediateStops: intermediateStopsArray,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/admin/routes/${routeId}`);
      } else {
        // Server-side error handling
        if (data.error?.toLowerCase().includes("route name")) {
          routeNameRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          setTimeout(
            () => routeNameRef.current?.focus({ preventScroll: true }),
            300
          );
        }
        alert(data.error || "Failed to update route");
      }
    } catch (error) {
      console.error("Error updating route:", error);
      alert("An error occurred while updating the route.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#87888C] font-['Inter'] text-sm">
          Loading route details...
        </span>
      </div>
    );
  }

  // Helper for input className with error state
  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 bg-[#21222D] text-white rounded-lg border font-['Inter'] text-sm placeholder:text-[#2B2B36] focus:outline-none transition ${
      hasError
        ? "border-[#EA1701] focus:border-[#EA1701]"
        : "border-[#2C2D33] focus:border-[#96DDFF]"
    }`;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/admin/routes/${routeId}`}
          className="text-white hover:text-[#96DDFF] transition"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
          Edit Route – R{String(routeId).padStart(3, "0")} (
          {formData.routeName || "N/A"})
        </h1>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-2 gap-6 max-w-7xl">
        {/* Left Column: Form */}
        <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33]">
          <form onSubmit={handleSubmit} noValidate>
            <div className="p-6 space-y-6">
              <h3 className="text-white font-bold font-['Inter'] text-base">
                Route Information
              </h3>

              {/* Route ID - Read-only */}
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">
                  Route ID
                </span>
                <span className="text-white font-['Inter'] text-sm">
                  R{String(routeId).padStart(3, "0")}
                </span>
              </div>

              {/* Route Name */}
              <div>
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Route Name <span className="text-[#EA1701]">*</span>
                </label>
                <input
                  ref={routeNameRef}
                  type="text"
                  name="routeName"
                  value={formData.routeName}
                  onChange={handleInputChange}
                  placeholder="e.g. Inti Subang → Caltex Kelana Jaya"
                  className={`w-full px-4 py-3 bg-[#171821] text-white rounded-lg border font-['Inter'] text-sm placeholder:text-[#2B2B36] focus:outline-none transition ${
                    errors.routeName
                      ? "border-[#EA1701] focus:border-[#EA1701]"
                      : "border-[#2C2D33] focus:border-[#96DDFF]"
                  }`}
                />
                {errors.routeName && (
                  <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                    {errors.routeName}
                  </p>
                )}
              </div>

              {/* Pickup Section */}
              <div className="p-4 bg-[#171821] rounded-lg border border-[#2C2D33]">
                <h4 className="text-[#1A4B9B] font-bold font-['Inter'] text-sm mb-3">
                  Pickup Stop <span className="text-[#EA1701]">*</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                      Address
                    </label>
                    <input
                      ref={pickupStopRef}
                      type="text"
                      name="pickupStop"
                      value={formData.pickupStop}
                      onChange={handleInputChange}
                      placeholder="Enter pickup address"
                      className={inputClass(!!errors.pickupStop)}
                    />
                    {errors.pickupStop && (
                      <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                        {errors.pickupStop}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                        Latitude
                      </label>
                      <input
                        ref={pickupLatRef}
                        type="number"
                        step="any"
                        name="pickupLat"
                        value={formData.pickupLat}
                        onChange={handleInputChange}
                        placeholder="3.074200"
                        className={inputClass(!!errors.pickupLat)}
                      />
                      {errors.pickupLat && (
                        <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                          {errors.pickupLat}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                        Longitude
                      </label>
                      <input
                        ref={pickupLngRef}
                        type="number"
                        step="any"
                        name="pickupLng"
                        value={formData.pickupLng}
                        onChange={handleInputChange}
                        placeholder="101.591300"
                        className={inputClass(!!errors.pickupLng)}
                      />
                      {errors.pickupLng && (
                        <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                          {errors.pickupLng}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dropoff Section */}
              <div className="p-4 bg-[#171821] rounded-lg border border-[#2C2D33]">
                <h4 className="text-[#3EB900] font-bold font-['Inter'] text-sm mb-3">
                  Drop-off Stop <span className="text-[#EA1701]">*</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                      Address
                    </label>
                    <input
                      ref={dropoffStopRef}
                      type="text"
                      name="dropoffStop"
                      value={formData.dropoffStop}
                      onChange={handleInputChange}
                      placeholder="Enter drop-off address"
                      className={inputClass(!!errors.dropoffStop)}
                    />
                    {errors.dropoffStop && (
                      <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                        {errors.dropoffStop}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                        Latitude
                      </label>
                      <input
                        ref={dropoffLatRef}
                        type="number"
                        step="any"
                        name="dropoffLat"
                        value={formData.dropoffLat}
                        onChange={handleInputChange}
                        placeholder="3.074200"
                        className={inputClass(!!errors.dropoffLat)}
                      />
                      {errors.dropoffLat && (
                        <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                          {errors.dropoffLat}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                        Longitude
                      </label>
                      <input
                        ref={dropoffLngRef}
                        type="number"
                        step="any"
                        name="dropoffLng"
                        value={formData.dropoffLng}
                        onChange={handleInputChange}
                        placeholder="101.591300"
                        className={inputClass(!!errors.dropoffLng)}
                      />
                      {errors.dropoffLng && (
                        <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                          {errors.dropoffLng}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Intermediate Stops */}
              <div>
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Intermediate Stops{" "}
                  <span className="text-[#87888C] text-xs">
                    (comma separated)
                  </span>
                </label>
                <textarea
                  ref={intermediateStopsRef}
                  name="intermediateStops"
                  value={formData.intermediateStops}
                  onChange={handleInputChange}
                  placeholder="e.g. Main Gate, Library, Admin Building"
                  rows={2}
                  className={`w-full px-4 py-3 bg-[#171821] text-white rounded-lg border font-['Inter'] text-sm placeholder:text-[#2B2B36] focus:outline-none transition resize-none ${
                    errors.intermediateStops
                      ? "border-[#EA1701] focus:border-[#EA1701]"
                      : "border-[#2C2D33] focus:border-[#96DDFF]"
                  }`}
                />
                {errors.intermediateStops && (
                  <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                    {errors.intermediateStops}
                  </p>
                )}
              </div>

              {/* Status Note */}
              <div className="p-3 bg-[#171821] rounded-lg border border-[#2C2D33]">
                <p className="text-[#87888C] font-['Inter'] text-xs">
                  <span className="text-[#96DDFF] font-semibold">Note:</span>{" "}
                  Route status is automatically determined by bus assignment.
                  To deactivate a route, unassign the bus or set the bus to
                  Inactive.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2C2D33]">
              <Link
                href={`/admin/routes/${routeId}`}
                className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Interactive Map */}
        <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6 h-fit sticky top-6">
          <h3 className="text-white font-bold font-['Inter'] text-base mb-2">
            Location Preview
          </h3>
          <p className="text-[#87888C] font-['Inter'] text-xs mb-4">
            Drag the markers or click on the map to update coordinates.
          </p>
          <RoutePickerMap
            pickupLat={formData.pickupLat}
            pickupLng={formData.pickupLng}
            dropoffLat={formData.dropoffLat}
            dropoffLng={formData.dropoffLng}
            onPickupChange={handlePickupChange}
            onDropoffChange={handleDropoffChange}
          />
        </div>
      </div>
    </div>
  );
}