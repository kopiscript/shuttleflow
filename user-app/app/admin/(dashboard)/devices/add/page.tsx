// app/admin/devices/add/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UnclaimedDevice {
  id: number;
  deviceName: string;
  isUnclaimed?: boolean;
  lastSeen: string | null;
}

export default function ClaimDevicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unclaimedDevices, setUnclaimedDevices] = useState<UnclaimedDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [deviceName, setDeviceName] = useState("");

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch unclaimed NVS devices
  const fetchDetectedDevices = async () => {
    try {
      setLoadingDevices(true);
      const res = await fetch("/api/admin/devices");
      const data = await res.json();
      if (data.success && Array.isArray(data.devices)) {
        const pending = data.devices.filter(
          (d: UnclaimedDevice) =>
            d.isUnclaimed || d.deviceName?.toUpperCase().startsWith("UNCLAIMED")
        );
        setUnclaimedDevices(pending);
        if (pending.length > 0) {
          setSelectedDeviceId(String(pending[0].id));
        } else {
          setSelectedDeviceId("NEW");
        }
      }
    } catch (err) {
      console.error("Failed to fetch unclaimed devices:", err);
      setSelectedDeviceId("NEW");
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    fetchDetectedDevices();
  }, []);

  const getSelectedLabel = () => {
    if (loadingDevices) return "Scanning for detected hardware...";
    if (selectedDeviceId === "NEW") return "+ Pre-register Manual ID (No Hardware Yet)";
    const found = unclaimedDevices.find((d) => String(d.id) === selectedDeviceId);
    if (found) {
      return `D${String(found.id).padStart(3, "0")} — ${found.deviceName}`;
    }
    return "Select Device ID...";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId) {
      alert("Please select a Device ID from the dropdown.");
      return;
    }

    if (!deviceName.trim()) {
      alert("Please enter a device name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          deviceName: deviceName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/devices");
      } else {
        console.error("Failed to process device:", data.error);
        alert("Failed to process device: " + data.error);
      }
    } catch (error) {
      console.error("Error saving device:", error);
      alert("An error occurred while saving the device.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/devices"
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
        <div>
          <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
            Claim / Add Device
          </h1>
          <p className="text-[#87888C] font-['Inter'] text-sm mt-1">
            Pair and assign a friendly name to newly detected ESP32 units.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] max-w-3xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                Basic Information
              </h3>

              {/* Device ID Dropdown (NVS Provisioned Units) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#87888C] font-['Inter'] text-sm">
                    Select Device ID (NVS Provisioned)
                  </label>
                  <button
                    type="button"
                    onClick={fetchDetectedDevices}
                    disabled={loadingDevices}
                    className="text-xs text-[#96DDFF] hover:underline flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh scan
                  </button>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => !loadingDevices && setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] cursor-pointer hover:border-[#96DDFF] transition font-['Inter'] text-sm"
                  >
                    <span className="truncate">{getSelectedLabel()}</span>
                    <svg
                      className={`w-4 h-4 text-[#87888C] transition-transform ${isDropdownOpen ? "rotate-180" : ""
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

                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-2 bg-[#21222D] border border-[#2C2D33] rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      {unclaimedDevices.length > 0 && (
                        <div className="px-4 py-2 text-xs font-semibold text-[#87888C] bg-[#171821] border-b border-[#2C2D33]">
                          Detected Unclaimed ESP32 Units ({unclaimedDevices.length})
                        </div>
                      )}

                      {unclaimedDevices.map((dev) => (
                        <div
                          key={dev.id}
                          onClick={() => {
                            setSelectedDeviceId(String(dev.id));
                            setIsDropdownOpen(false);
                          }}
                          className={`px-4 py-3 text-sm cursor-pointer hover:bg-[#2B2B36] transition flex items-center justify-between ${selectedDeviceId === String(dev.id)
                              ? "text-[#96DDFF] bg-[#2B2B36]"
                              : "text-white"
                            }`}
                        >
                          <div>
                            <span className="font-semibold">
                              D{String(dev.id).padStart(3, "0")}
                            </span>{" "}
                            <span className="text-[#87888C] ml-1">
                              ({dev.deviceName})
                            </span>
                          </div>
                          <span className="text-xs text-[#3EB900] bg-[#E1FFDA]/10 px-2 py-0.5 rounded-full">
                            Ready to Claim
                          </span>
                        </div>
                      ))}

                      <div className="px-4 py-2 text-xs font-semibold text-[#87888C] bg-[#171821] border-y border-[#2C2D33]">
                        Manual Option
                      </div>
                      <div
                        onClick={() => {
                          setSelectedDeviceId("NEW");
                          setIsDropdownOpen(false);
                        }}
                        className={`px-4 py-3 text-sm cursor-pointer hover:bg-[#2B2B36] transition ${selectedDeviceId === "NEW"
                            ? "text-[#96DDFF] bg-[#2B2B36]"
                            : "text-white"
                          }`}
                      >
                        + Auto-generate New ID (Pre-register before flashing)
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[#87888C] font-['Inter'] text-xs mt-2">
                  When an ESP32 boots up for the first time, it registers its MAC address and permanently stores its assigned Device ID in NVS flash memory. Select it above to assign a friendly name.
                </p>
              </div>

              {/* Device Name */}
              <div className="mt-5">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Device Name
                </label>
                <input
                  type="text"
                  name="deviceName"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Enter device name (e.g., Bus 4 - Front GPS Module)"
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#87888C]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2C2D33]">
            <Link
              href="/admin/devices"
              className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition flex items-center gap-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting
                ? "Saving..."
                : selectedDeviceId !== "NEW"
                  ? "Claim Device"
                  : "Add Device"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}