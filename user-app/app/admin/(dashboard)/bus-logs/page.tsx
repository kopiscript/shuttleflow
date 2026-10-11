"use client";

import { useState, useEffect, useRef } from "react";

// Reusable UI Component for standard dropdowns
const CustomDropdown = ({ value, options, onChange, className = "w-full md:w-32" }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt: any) => opt.value.toString() === value.toString());

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-2.5 bg-[#171821] text-white rounded-xl border border-[#2C2D33] cursor-pointer hover:border-[#96DDFF] transition text-sm"
            >
                <span className="truncate">{selectedOption ? selectedOption.label : "Select..."}</span>
                <svg className={`w-4 h-4 text-[#87888C] transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {isOpen && (
                <div className="absolute right-0 z-50 w-full min-w-[120px] mt-2 bg-[#21222D] border border-[#2C2D33] rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    {options.map((opt: any) => (
                        <div
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
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

// Custom Dropdown specifically for filtering Buses with a search bar
const SearchableBusDropdown = ({ buses, selectedBus, onChange }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredBuses = buses.filter((bus: any) => {
        const query = searchTerm.toLowerCase();
        return (
            (bus.busName || bus.bus_name || "").toLowerCase().includes(query) ||
            (bus.licensePlate || bus.license_plate || "").toLowerCase().includes(query)
        );
    });

    const selectedBusData = buses.find((b: any) => b.id.toString() === selectedBus);
    const selectedBusName = selectedBusData
        ? `${selectedBusData.busName || selectedBusData.bus_name} (${selectedBusData.licensePlate || selectedBusData.license_plate})`
        : "All Buses";

    return (
        <div className="relative flex-1" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-2.5 bg-[#171821] text-white rounded-xl border border-[#2C2D33] cursor-pointer hover:border-[#96DDFF] transition text-sm"
            >
                <span className="truncate">{selectedBus === "ALL" ? "All Buses" : selectedBusName}</span>
                <svg className={`w-4 h-4 text-[#87888C] transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#21222D] border border-[#2C2D33] rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-[#2C2D33]">
                        <input
                            type="text"
                            placeholder="Search bus name or plate..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:border-[#96DDFF] outline-none text-sm placeholder:text-[#87888C]"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <div
                            onClick={() => { onChange("ALL"); setIsOpen(false); setSearchTerm(""); }}
                            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-[#2B2B36] transition ${selectedBus === "ALL" ? "text-[#96DDFF] bg-[#2B2B36]" : "text-white"}`}
                        >
                            All Buses
                        </div>
                        {filteredBuses.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-[#87888C] text-center">No buses found.</div>
                        ) : (
                            filteredBuses.map((bus: any) => (
                                <div
                                    key={bus.id}
                                    onClick={() => { onChange(bus.id.toString()); setIsOpen(false); setSearchTerm(""); }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-[#2B2B36] transition ${selectedBus === bus.id.toString() ? "text-[#96DDFF] bg-[#2B2B36]" : "text-white"}`}
                                >
                                    {bus.busName || bus.bus_name} ({bus.licensePlate || bus.license_plate})
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function BusLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [buses, setBuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const [selectedBus, setSelectedBus] = useState<string>("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    useEffect(() => {
        fetch("/api/admin/buses")
            .then(res => res.json())
            .then(data => {
                if (data.success) setBuses(data.buses || []);
            });
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [selectedBus]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const url = new URL("/api/admin/bus-logs", window.location.origin);
            if (selectedBus !== "ALL") url.searchParams.append("busId", selectedBus);

            const response = await fetch(url.toString());
            const data = await response.json();

            if (data.success) {
                setLogs(data.logs || []);
                setCurrentPage(1);
            }
        } catch (err) {
            console.error("Failed to fetch bus logs:", err);
        } finally {
            setLoading(false);
        }
    };

    const downloadCumulativeData = async () => {
        try {
            setIsExporting(true);
            const url = new URL("/api/admin/bus-logs", window.location.origin);
            if (selectedBus !== "ALL") url.searchParams.append("busId", selectedBus);
            url.searchParams.append("export", "true");

            const res = await fetch(url.toString());
            const data = await res.json();

            if (!data.success || data.logs.length === 0) {
                alert("No location data available to export.");
                return;
            }

            const headers = ["Log ID", "Bus Name", "License Plate", "Latitude", "Longitude", "Speed", "Timestamp"];
            const csvRows = data.logs.map((l: any) => [
                l.id,
                l.bus?.busName || "Unknown",
                l.bus?.licensePlate || "N/A",
                l.latitude,
                l.longitude,
                l.speed || "0",
                new Date(l.recordedAt).toISOString()
            ]);

            const csvContent = [headers.join(","), ...csvRows.map((r: any) => r.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `cumulative_bus_logs_${new Date().toISOString().split("T")[0]}.csv`;
            link.click();
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to export data.");
        } finally {
            setIsExporting(false);
        }
    };

    const totalPages = Math.ceil(logs.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = logs.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">Bus Location Logs</h1>
                    <p className="text-[#87888C] font-['Inter'] text-sm mt-1">Track hardware telemetry and historical GPS coordinates</p>
                </div>
                <button
                    onClick={downloadCumulativeData}
                    disabled={isExporting || logs.length === 0}
                    className="px-5 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-bold text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50"
                >
                    {isExporting ? "Exporting..." : "Download Cumulative CSV"}
                </button>
            </div>

            {/* Filter Bar with Custom Dropdowns */}
            <div className="bg-[#21222D] p-4 rounded-2xl border border-[#2C2D33] flex flex-col md:flex-row gap-3">
                <SearchableBusDropdown
                    buses={buses}
                    selectedBus={selectedBus}
                    onChange={(val: string) => {
                        setSelectedBus(val);
                        setCurrentPage(1);
                    }}
                />
                <CustomDropdown
                    value={itemsPerPage}
                    onChange={(val: number) => {
                        setItemsPerPage(val);
                        setCurrentPage(1);
                    }}
                    options={[
                        { label: "10 / page", value: 10 },
                        { label: "25 / page", value: 25 },
                        { label: "50 / page", value: 50 }
                    ]}
                    className="w-full md:w-32"
                />
            </div>

            {/* Table */}
            <div className="bg-[#21222D] rounded-2xl overflow-hidden border border-[#2C2D33]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#2B2B36]">
                            <tr>
                                <th className="text-left px-6 py-4 text-white font-semibold text-sm">Log ID</th>
                                <th className="text-left px-6 py-4 text-white font-semibold text-sm">Bus</th>
                                <th className="text-left px-6 py-4 text-white font-semibold text-sm">Coordinates</th>
                                <th className="text-left px-6 py-4 text-white font-semibold text-sm">Speed</th>
                                <th className="text-left px-6 py-4 text-white font-semibold text-sm">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-10 text-[#87888C]">Loading GPS logs...</td></tr>
                            ) : paginatedLogs.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-[#87888C]">No location data found.</td></tr>
                            ) : (
                                paginatedLogs.map((log, i) => (
                                    <tr key={log.id} className={`border-t border-[#2C2D33] ${i % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"}`}>
                                        <td className="px-6 py-4 text-white text-sm">#{log.id}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="text-white font-medium">{log.bus?.busName || "Unknown"}</div>
                                            <div className="text-[#87888C] text-xs">{log.bus?.licensePlate || "N/A"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-[#96DDFF] font-mono text-sm">
                                            {log.latitude}, {log.longitude}
                                        </td>
                                        <td className="px-6 py-4 text-[#87888C] text-sm">
                                            {log.speed ? `${log.speed} km/h` : "0 km/h"}
                                        </td>
                                        <td className="px-6 py-4 text-[#87888C] text-sm">
                                            {new Date(log.recordedAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-[#2C2D33]">
                    <span className="text-[#87888C] text-xs">
                        Showing {logs.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, logs.length)} of {logs.length} entries
                    </span>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-sm text-[#87888C] hover:text-white disabled:opacity-30">Prev</button>
                        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-sm text-[#87888C] hover:text-white disabled:opacity-30">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}