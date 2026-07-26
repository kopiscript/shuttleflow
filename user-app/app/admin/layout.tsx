// user-app/app/admin/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Shuttle Management", href: "/admin/buses", icon: "🚌" },
    { name: "Route Management", href: "/admin/routes", icon: "🗺️" },
    { name: "Device Management", href: "/admin/devices", icon: "📡" },
    { name: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-[#171821] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] flex flex-col bg-[#1D1E27] border-r border-[#2C2D33] flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center px-4 py-4 border-b border-[#2C2D33]">
          <Image src="/logo.png" alt="Logo" width={120} height={30} className="object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-[#96DDFF] text-[#171821]"
                    : "text-[#87888C] hover:bg-[#2C2D33] hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Admin Profile */}
        <div className="border-t border-[#2C2D33] p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2C2D33] flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-[#87888C]">admin@shuttleflow.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="h-[74px] bg-[#1D1E27] border-b border-[#2C2D33] flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-white text-lg font-semibold font-['Bai_Jamjuree']">
            Admin Panel
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2C2D33] flex items-center justify-center text-white text-sm font-medium">
                A
              </div>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}