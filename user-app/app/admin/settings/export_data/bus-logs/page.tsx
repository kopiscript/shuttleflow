// app/admin/settings/export_data/bus-logs/page.tsx
"use client";

import Link from "next/link";

export default function BusLogsExportPage() {
    return (
        <div>
            <div className="flex items-center gap-3 mb-8">
                <Link href="/admin/settings/export_data" className="text-white hover:text-[#96DDFF] transition">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
                        Bus Logs Export
                    </h1>
                    <p className="text-[#87888C] mt-1 font-['Inter'] text-sm">
                        Download bus location history and route data
                    </p>
                </div>
            </div>
            <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
                <p className="text-[#87888C] font-['Inter'] text-sm">
                    Bus logs export content coming soon...
                </p>
            </div>
        </div>
    );
}