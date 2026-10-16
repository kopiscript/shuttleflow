// app/admin/buses/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { validateBusFields, hasErrors, BusValidationErrors } from "@/lib/validation";

interface Bus {
  id: number;
  busName: string;
  licensePlate: string;
  capacity: number;
  status: string;
  driverName?: string | null;
  driverPhone?: string | null;
  route?: {
    id: number;
    routeName: string;
  };
  device?: {
    id: number;
    deviceName: string;
  };
}

interface RouteOption {
  id: number;
  routeName: string;
  assignedBusId: number | null;
  assignedBusName: string | null;
}

interface DeviceOption {
  id: number;
  deviceName: string;
  busId: number | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditBusPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busId, setBusId] = useState<number | null>(null);
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
  const [errors, setErrors] = useState<BusValidationErrors>({});
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [showRemoveRouteModal, setShowRemoveRouteModal] = useState(false);
  const [showRemoveDeviceModal, setShowRemoveDeviceModal] = useState(false);

  // Refs for scroll-to-error
  const licensePlateRef = useRef<HTMLInputElement>(null);
  const busNameRef = useRef<HTMLInputElement>(null);
  const capacityRef = useRef<HTMLInputElement>(null);
  const driverNameRef = useRef<HTMLInputElement>(null);
  const driverPhoneRef = useRef<HTMLInputElement>(null);

  // Unwrap params and fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id } = await params;
        const busIdNum = parseInt(id);
        setBusId(busIdNum);

        const busRes = await fetch(`/api/admin/buses/${busIdNum}`);
        const busData = await busRes.json();
        if (busData.success) {
          const bus = busData.bus;
          setFormData({
            busName: bus.busName || "",
            licensePlate: bus.licensePlate || "",
            capacity: bus.capacity?.toString() || "",
            status: bus.status || "Active",
            driverName: bus.driverName || "",
            driverPhone: bus.driverPhone || "",
            routeId: bus.route?.id?.toString() || "",
            deviceId: bus.device?.id?.toString() || "",
          });
        }

        const routesRes = await fetch("/api/admin/routes");
        const routesData = await routesRes.json();
        if (routesData.success) setRoutes(routesData.routes);

        const devicesRes = await fetch("/api/admin/devices");
        const devicesData = await devicesRes.json();
        if (devicesData.success) setDevices(devicesData.devices);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params]);

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

  const handleRemoveRoute = () => {
    setFormData((prev) => ({ ...prev, routeId: "" }));
  };

  const handleRemoveDevice = () => {
    setFormData((prev) => ({ ...prev, deviceId: "" }));
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
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/buses/${busId}`, {
        method: "PUT",
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
        router.push(`/admin/buses/${busId}`);
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
        alert(data.error || "Failed to update bus");
      }
    } catch (error) {
      console.error("Error updating bus:", error);
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#87888C] font-['Inter'] text-sm">
          Loading bus details...
        </span>
      </div>
    );
  }

  // Status helper for the badge preview
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-[#E1FFDA] text-[#3EB900]";
      case "Delayed":
        return "bg-[#FFF4CC] text-[#B8860B]";
      case "Breakdown":
        return "bg-[#FFC0B9] text-[#EA1701]";
      case "Inactive":
        return "bg-[#FFC0B9] text-[#EA1701]";
      default:
        return "bg-[#2C2D33] text-[#87888C]";
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/admin/buses/${busId}`}
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
          Edit Bus – B{String(busId).padStart(3, "0")} (
          {formData.licensePlate || "N/A"})
        </h1>
      </div>

      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] max-w-2xl">
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                Basic Information
              </h3>

              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">
                  Bus ID
                </span>
                <span className="text-white font-['Inter'] text-sm">
                  B{String(busId).padStart(3, "0")}
                </span>
              </div>

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

              {/* Status dropdown */}
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
                      <option value="Breakdown">Breakdown (out of service)</option>
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
                    className={`px-3 py-1 rounded-full text-xs font-semibold font-['Inter'] ${getStatusStyle(formData.status)}`}
                  >
                    {formData.status}
                  </span>
                </div>

                <div className="mt-3 p-3 bg-[#171821] rounded-lg border border-[#2C2D33]">
                  <p className="text-[#87888C] font-['Inter'] text-xs">
                    <span className="text-[#96DDFF] font-semibold">Note:</span>{" "}
                    Setting this bus to{" "}
                    <span className="text-[#EA1701]">Breakdown</span> will notify users of the
                    disruption. Setting to <span className="text-[#6E6E7E]">Inactive</span> will
                    also deactivate its assigned route. Routes with live ETAs beyond the
                    scheduled time are automatically flagged as delayed.
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
            </div>

            <div className="border-t border-[#2C2D33]" />

            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                Assigned Route
              </h3>
              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <select
                    name="routeId"
                    value={formData.routeId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm appearance-none pr-10"
                  >
                    <option value="">Select route</option>
                    {routes.map((route) => {
                      const alreadyAssignedToAnotherBus =
                        route.assignedBusId !== null &&
                        route.assignedBusId !== busId;

                      return (
                        <option
                          key={route.id}
                          value={route.id}
                          disabled={alreadyAssignedToAnotherBus}
                        >
                          {route.routeName}
                          {alreadyAssignedToAnotherBus
                            ? " (Already assigned)"
                            : ""}
                        </option>
                      );
                    })}
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
                {formData.routeId && (
                  <button
                    type="button"
                    onClick={() => setShowRemoveRouteModal(true)}
                    className="px-4 py-3 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition flex items-center gap-2 whitespace-nowrap"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-[#2C2D33]" />

            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                Assigned Device
              </h3>
              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <select
                    name="deviceId"
                    value={formData.deviceId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm appearance-none pr-10"
                  >
                    <option value="">Select device</option>
                    {devices.map((device) => {
                      const alreadyAssignedToAnotherBus =
                        device.busId != null && device.busId !== busId;

                      return (
                        <option
                          key={device.id}
                          value={device.id}
                          disabled={alreadyAssignedToAnotherBus}
                        >
                          {device.deviceName}
                          {alreadyAssignedToAnotherBus
                            ? " (Already assigned)"
                            : ""}
                        </option>
                      );
                    })}
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
                {formData.deviceId && (
                  <button
                    type="button"
                    onClick={() => setShowRemoveDeviceModal(true)}
                    className="px-4 py-3 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition flex items-center gap-2 whitespace-nowrap"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Remove Route Confirmation Modal */}
            <DeleteConfirmModal
              isOpen={showRemoveRouteModal}
              onClose={() => setShowRemoveRouteModal(false)}
              onConfirm={() => {
                handleRemoveRoute();
                setShowRemoveRouteModal(false);
              }}
              title="Remove Route"
              message="Are you sure you want to remove"
              itemName={
                routes.find((r) => r.id.toString() === formData.routeId)
                  ?.routeName || "this route"
              }
              description="This will unassign the route from this bus. The route itself will not be deleted."
              confirmLabel="Remove"
              loadingLabel="Removing..."
              variant="warning"
            />

            <DeleteConfirmModal
              isOpen={showRemoveDeviceModal}
              onClose={() => setShowRemoveDeviceModal(false)}
              onConfirm={() => {
                handleRemoveDevice();
                setShowRemoveDeviceModal(false);
              }}
              title="Remove Device"
              message="Are you sure you want to remove"
              itemName={
                devices.find((d) => d.id.toString() === formData.deviceId)
                  ?.deviceName || "this device"
              }
              description="This will unassign the device from this bus. The device itself will not be deleted."
              confirmLabel="Remove"
              loadingLabel="Removing..."
              variant="warning"
            />
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2C2D33]">
            <Link
              href={`/admin/buses/${busId}`}
              className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}