// user-app/app/admin/buses/add/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  validateBusFields,
  hasErrors,
  BusValidationErrors,
} from "@/lib/validation";

interface Bus {
  id: number;
  busName: string;
  licensePlate: string;
}

interface Route {
  id: number;
  routeName: string;
  assignedBusId: number | null;
  assignedBusName: string | null;
}

interface Device {
  id: number;
  deviceName: string;
  busId: number | null;
}

export default function AddBusPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextBusId, setNextBusId] = useState(1);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [errors, setErrors] = useState<BusValidationErrors>({});
  const [formData, setFormData] = useState({
    busName: "",
    licensePlate: "",
    capacity: "",
    status: "Active",
    driverName: "",
    driverPhone: "",
    routeId: "",
    deviceId: "",
  });

  // Refs for scroll-to-error
  const licensePlateRef = useRef<HTMLInputElement>(null);
  const busNameRef = useRef<HTMLInputElement>(null);
  const capacityRef = useRef<HTMLInputElement>(null);
  const driverNameRef = useRef<HTMLInputElement>(null);
  const driverPhoneRef = useRef<HTMLInputElement>(null);

  // Fetch buses to calculate next ID
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const response = await fetch("/api/admin/buses");
        const data = await response.json();
        if (data.success && data.buses.length > 0) {
          const maxId = Math.max(...data.buses.map((b: Bus) => b.id));
          setNextBusId(maxId + 1);
        }
      } catch (error) {
        console.error("Failed to fetch buses:", error);
      }
    };
    fetchBuses();
  }, []);

  // Fetch routes for dropdown
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch("/api/admin/routes");
        const data = await response.json();
        if (data.success) {
          setRoutes(data.routes);
        }
      } catch (error) {
        console.error("Failed to fetch routes:", error);
      }
    };
    fetchRoutes();
  }, []);

  // Fetch devices for dropdown
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch("/api/admin/devices");
        const data = await response.json();
        if (data.success) {
          setDevices(data.devices);
        }
      } catch (error) {
        console.error("Failed to fetch devices:", error);
      }
    };
    fetchDevices();
  }, []);

  // Helper: scroll + focus the first field that has an error
  const scrollToFirstError = (validationErrors: BusValidationErrors) => {
    const fieldOrder: (keyof BusValidationErrors)[] = [
      "licensePlate",
      "busName",
      "capacity",
      "driverName",
      "driverPhone",
    ];

    const refMap: Record<
      keyof BusValidationErrors,
      React.RefObject<HTMLInputElement | null>
    > = {
      licensePlate: licensePlateRef,
      busName: busNameRef,
      capacity: capacityRef,
      driverName: driverNameRef,
      driverPhone: driverPhoneRef,
    };

    for (const field of fieldOrder) {
      if (validationErrors[field]) {
        const el = refMap[field]?.current;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // Small delay so scroll settles before focusing
          setTimeout(() => el.focus({ preventScroll: true }), 300);
        }
        break;
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Auto-uppercase license plate as user types
    const finalValue =
      name === "licensePlate" ? value.toUpperCase() : value;

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof BusValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Client-side validation
    const validationErrors = validateBusFields({
      licensePlate: formData.licensePlate,
      busName: formData.busName,
      capacity: formData.capacity,
      driverName: formData.driverName,
      driverPhone: formData.driverPhone,
    });

    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      scrollToFirstError(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/buses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busName: formData.busName.trim(),
          licensePlate: formData.licensePlate.trim().toUpperCase(),
          capacity: parseInt(formData.capacity),
          status: formData.status,
          driverName: formData.driverName.trim() || null,
          driverPhone: formData.driverPhone.trim() || null,
          routeId: formData.routeId ? parseInt(formData.routeId) : null,
          deviceId: formData.deviceId ? parseInt(formData.deviceId) : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push("/admin/buses");
      } else {
        // Server-side error: scroll to a field if we can guess which one
        if (data.error?.toLowerCase().includes("license plate")) {
          licensePlateRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          setTimeout(
            () => licensePlateRef.current?.focus({ preventScroll: true }),
            300,
          );
        }
        alert(data.error || "Failed to add bus");
      }
    } catch (error) {
      console.error("Error adding bus:", error);
      alert("An error occurred while adding the bus.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/buses"
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
          Add New Shuttle
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] max-w-2xl">
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                Basic Information
              </h3>

              {/* Bus ID */}
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">
                  Bus ID
                </span>
                <span className="text-white font-['Inter'] text-sm">
                  B{String(nextBusId).padStart(3, "0")}
                </span>
              </div>

              {/* License Plate */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  License Plate <span className="text-[#EA1701]">*</span>
                </label>
                <input
                  ref={licensePlateRef}
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  placeholder="e.g., VJL3738"
                  className={`w-full px-4 py-3 bg-[#171821] text-white rounded-lg border font-['Inter'] text-sm placeholder:text-[#2B2B36] focus:outline-none transition ${
                    errors.licensePlate
                      ? "border-[#EA1701] focus:border-[#EA1701]"
                      : "border-[#2C2D33] focus:border-[#96DDFF]"
                  }`}
                />
                {errors.licensePlate && (
                  <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                    {errors.licensePlate}
                  </p>
                )}
              </div>

              {/* Bus Model */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Bus Model <span className="text-[#EA1701]">*</span>
                </label>
                <input
                  ref={busNameRef}
                  type="text"
                  name="busName"
                  value={formData.busName}
                  onChange={handleInputChange}
                  placeholder="Enter model"
                  className={`w-full px-4 py-3 bg-[#171821] text-white rounded-lg border font-['Inter'] text-sm placeholder:text-[#2B2B36] focus:outline-none transition ${
                    errors.busName
                      ? "border-[#EA1701] focus:border-[#EA1701]"
                      : "border-[#2C2D33] focus:border-[#96DDFF]"
                  }`}
                />
                {errors.busName && (
                  <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                    {errors.busName}
                  </p>
                )}
              </div>

              {/* Capacity */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Capacity <span className="text-[#EA1701]">*</span>
                </label>
                <input
                  ref={capacityRef}
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Enter passenger capacity"
                  className={`w-full px-4 py-3 bg-[#171821] text-white rounded-lg border font-['Inter'] text-sm placeholder:text-[#2B2B36] focus:outline-none transition ${
                    errors.capacity
                      ? "border-[#EA1701] focus:border-[#EA1701]"
                      : "border-[#2C2D33] focus:border-[#96DDFF]"
                  }`}
                  min="1"
                  max="100"
                />
                {errors.capacity && (
                  <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                    {errors.capacity}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm appearance-none pr-10"
                    >
                      <option value="Active">Active (running normally)</option>
                      <option value="Inactive">Inactive (not in use)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-[#87888C]"
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
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold font-['Inter'] ${
                      formData.status === "Active"
                        ? "bg-[#E1FFDA] text-[#3EB900]"
                        : "bg-[#FFC0B9] text-[#EA1701]"
                    }`}
                  >
                    {formData.status}
                  </span>
                </div>

                <div className="mt-3 p-3 bg-[#171821] rounded-lg border border-[#2C2D33]">
                  <p className="text-[#87888C] font-['Inter'] text-xs leading-relaxed">
                    <span className="text-[#96DDFF] font-semibold">Note:</span>{" "}
                    Setting this bus to{" "}
                    <span className="text-[#EA1701] font-semibold">
                      Inactive
                    </span>{" "}
                    will also deactivate its assigned route. The route will not
                    appear in the user app.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#2C2D33]" />

            {/* Driver Information */}
            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                Driver Information
              </h3>

              {/* Driver Name */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Driver Name
                </label>
                <input
                  ref={driverNameRef}
                  type="text"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleInputChange}
                  placeholder="e.g., Ahmad bin Abdullah"
                  className={`w-full px-4 py-3 bg-[#171821] text-white rounded-lg border font-['Inter'] text-sm placeholder:text-[#2B2B36] focus:outline-none transition ${
                    errors.driverName
                      ? "border-[#EA1701] focus:border-[#EA1701]"
                      : "border-[#2C2D33] focus:border-[#96DDFF]"
                  }`}
                />
                {errors.driverName && (
                  <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                    {errors.driverName}
                  </p>
                )}
              </div>

              {/* Driver Phone */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Contact Number
                </label>
                <input
                  ref={driverPhoneRef}
                  type="tel"
                  name="driverPhone"
                  value={formData.driverPhone}
                  onChange={handleInputChange}
                  placeholder="e.g., 012-3456789"
                  className={`w-full px-4 py-3 bg-[#171821] text-white rounded-lg border font-['Inter'] text-sm placeholder:text-[#2B2B36] focus:outline-none transition ${
                    errors.driverPhone
                      ? "border-[#EA1701] focus:border-[#EA1701]"
                      : "border-[#2C2D33] focus:border-[#96DDFF]"
                  }`}
                />
                {errors.driverPhone && (
                  <p className="text-[#EA1701] font-['Inter'] text-xs mt-1.5">
                    {errors.driverPhone}
                  </p>
                )}
              </div>

              <div className="mt-3 p-3 bg-[#171821] rounded-lg border border-[#2C2D33]">
                <p className="text-[#87888C] font-['Inter'] text-xs leading-relaxed">
                  <span className="text-[#96DDFF] font-semibold">Note:</span>{" "}
                  Driver information is optional and can be added later from
                  the bus edit page.
                </p>
              </div>
            </div>

            <div className="border-t border-[#2C2D33]" />

            {/* Assigned Route */}
            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                Assigned Route
              </h3>
              <div className="mt-4">
                <div className="relative">
                  <select
                    name="routeId"
                    value={formData.routeId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm appearance-none pr-10"
                  >
                    <option value="">Select route</option>
                    {routes.length === 0 ? (
                      <option value="" disabled>
                        No routes available
                      </option>
                    ) : (
                      routes.map((route) => {
                        const alreadyAssigned = route.assignedBusId !== null;

                        return (
                          <option
                            key={route.id}
                            value={route.id.toString()}
                            disabled={alreadyAssigned}
                          >
                            {route.routeName}
                            {alreadyAssigned ? " (Already assigned)" : ""}
                          </option>
                        );
                      })
                    )}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-[#87888C]"
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
                </div>
              </div>
            </div>

            <div className="border-t border-[#2C2D33]" />

            {/* Assigned Device */}
            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                Assigned Device
              </h3>
              <div className="mt-4">
                <div className="relative">
                  <select
                    name="deviceId"
                    value={formData.deviceId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm appearance-none pr-10"
                  >
                    <option value="">Select device</option>
                    {devices.length === 0 ? (
                      <option value="" disabled>
                        No devices available
                      </option>
                    ) : (
                      devices.map((device) => {
                        const alreadyAssigned = device.busId != null;
                        return (
                          <option
                            key={device.id}
                            value={device.id.toString()}
                            disabled={alreadyAssigned}
                          >
                            {device.deviceName}
                            {alreadyAssigned ? " (already assigned)" : ""}
                          </option>
                        );
                      })
                    )}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-[#87888C]"
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
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2C2D33]">
            <Link
              href="/admin/buses"
              className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}