// user-app/app/admin/layout.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

interface AdminInfo {
  id: number;
  username: string;
  email: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.6001 11.4147V6.77678C12.6001 6.45411 12.5335 6.13483 12.4042 5.83849C12.2749 5.54216 12.0858 5.27501 11.8483 5.05341L7.4245 0.923958C7.2017 0.715902 6.90671 0.599976 6.6001 0.599976C6.29348 0.599976 5.9985 0.715902 5.7757 0.923958L1.3519 5.05341C1.11443 5.27501 0.925269 5.54216 0.795996 5.83849C0.666724 6.13483 0.600063 6.45411 0.600098 6.77678V11.4147C0.600098 11.7291 0.726526 12.0305 0.95157 12.2528C1.17661 12.4751 1.48184 12.6 1.8001 12.6H11.4001C11.7184 12.6 12.0236 12.4751 12.2486 12.2528C12.4737 12.0305 12.6001 11.7291 12.6001 11.4147Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      name: "Shuttle Management",
      href: "/admin/buses",
      icon: (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.49992 12.25C3.33464 12.25 3.1961 12.1941 3.08429 12.0823C2.97249 11.9704 2.91659 11.8319 2.91659 11.6666V10.4708C2.74159 10.2763 2.60061 10.06 2.49367 9.82183C2.38672 9.58364 2.33325 9.32357 2.33325 9.04163V3.49996C2.33325 2.69301 2.70756 2.10239 3.45617 1.72808C4.20478 1.35378 5.38603 1.16663 6.99992 1.16663C8.67214 1.16663 9.86797 1.34649 10.5874 1.70621C11.3069 2.06593 11.6666 2.66385 11.6666 3.49996V9.04163C11.6666 9.32357 11.6131 9.58364 11.5062 9.82183C11.3992 10.06 11.2583 10.2763 11.0833 10.4708V11.6666C11.0833 11.8319 11.0273 11.9704 10.9155 12.0823C10.8037 12.1941 10.6652 12.25 10.4999 12.25H9.91658C9.75131 12.25 9.61277 12.1941 9.50096 12.0823C9.38915 11.9704 9.33325 11.8319 9.33325 11.6666V11.0833H4.66659V11.6666C4.66659 11.8319 4.61068 11.9704 4.49888 12.0823C4.38707 12.1941 4.24853 12.25 4.08325 12.25H3.49992ZM3.49992 5.83329H10.4999V4.08329H3.49992V5.83329ZM4.95825 9.33329C5.20131 9.33329 5.4079 9.24822 5.57804 9.07808C5.74818 8.90795 5.83325 8.70135 5.83325 8.45829C5.83325 8.21524 5.74818 8.00864 5.57804 7.8385C5.4079 7.66836 5.20131 7.58329 4.95825 7.58329C4.7152 7.58329 4.5086 7.66836 4.33846 7.8385C4.16832 8.00864 4.08325 8.21524 4.08325 8.45829C4.08325 8.70135 4.16832 8.90795 4.33846 9.07808C4.5086 9.24822 4.7152 9.33329 4.95825 9.33329ZM9.04158 9.33329C9.28464 9.33329 9.49124 9.24822 9.66138 9.07808C9.83152 8.90795 9.91658 8.70135 9.91658 8.45829C9.91658 8.21524 9.83152 8.00864 9.66138 7.8385C9.49124 7.66836 9.28464 7.58329 9.04158 7.58329C8.79853 7.58329 8.59193 7.66836 8.42179 7.8385C8.25165 8.00864 8.16658 8.21524 8.16658 8.45829C8.16658 8.70135 8.25165 8.90795 8.42179 9.07808C8.59193 9.24822 8.79853 9.33329 9.04158 9.33329ZM3.76242 2.91663H10.2958C10.1499 2.75135 9.83638 2.61281 9.35513 2.501C8.87388 2.3892 8.09853 2.33329 7.02909 2.33329C5.98881 2.33329 5.22804 2.39406 4.74679 2.51558C4.26554 2.63711 3.93742 2.77079 3.76242 2.91663ZM4.66659 9.91663H9.33325C9.65409 9.91663 9.92874 9.80239 10.1572 9.57392C10.3857 9.34545 10.4999 9.07079 10.4999 8.74996V6.99996H3.49992V8.74996C3.49992 9.07079 3.61415 9.34545 3.84263 9.57392C4.0711 9.80239 4.34575 9.91663 4.66659 9.91663Z" fill="currentColor" />
        </svg>
      )
    },
    {
      name: "Route Management",
      href: "/admin/routes",
      icon: (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.99992 6.99996C7.32075 6.99996 7.5954 6.88572 7.82388 6.65725C8.05235 6.42878 8.16658 6.15413 8.16658 5.83329C8.16658 5.51246 8.05235 5.23781 7.82388 5.00933C7.5954 4.78086 7.32075 4.66663 6.99992 4.66663C6.67909 4.66663 6.40443 4.78086 6.17596 5.00933C5.94749 5.23781 5.83325 5.51246 5.83325 5.83329C5.83325 6.15413 5.94749 6.42878 6.17596 6.65725C6.40443 6.88572 6.67909 6.99996 6.99992 6.99996ZM6.99992 11.2875C8.18603 10.1986 9.06589 9.20933 9.6395 8.31975C10.2131 7.43017 10.4999 6.64024 10.4999 5.94996C10.4999 4.89024 10.1621 4.02253 9.48638 3.34683C8.81068 2.67114 7.98186 2.33329 6.99992 2.33329C6.01797 2.33329 5.18915 2.67114 4.51346 3.34683C3.83777 4.02253 3.49992 4.89024 3.49992 5.94996C3.49992 6.64024 3.78672 7.43017 4.36034 8.31975C4.93395 9.20933 5.81381 10.1986 6.99992 11.2875ZM6.99992 12.8333C5.43464 11.5013 4.26554 10.2642 3.49263 9.12183C2.71971 7.97947 2.33325 6.92218 2.33325 5.94996C2.33325 4.49163 2.80235 3.32982 3.74054 2.46454C4.67874 1.59926 5.7652 1.16663 6.99992 1.16663C8.23464 1.16663 9.3211 1.59926 10.2593 2.46454C11.1975 3.32982 11.6666 4.49163 11.6666 5.94996C11.6666 6.92218 11.2801 7.97947 10.5072 9.12183C9.73429 10.2642 8.5652 11.5013 6.99992 12.8333Z" fill="currentColor" />
        </svg>
      )
    },
    {
      name: "Device Management",
      href: "/admin/devices",
      icon: (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.9075 4.05998L7 7.00582L12.0925 4.05998M7 12.88V6.99998M12.25 9.33332V4.66665C12.2498 4.46206 12.1958 4.26112 12.0934 4.084C11.991 3.90687 11.8438 3.75978 11.6667 3.65748L7.58333 1.32415C7.40598 1.22175 7.20479 1.16785 7 1.16785C6.79521 1.16785 6.59402 1.22175 6.41667 1.32415L2.33333 3.65748C2.15615 3.75978 2.00899 3.90687 1.9066 4.084C1.80422 4.26112 1.75021 4.46206 1.75 4.66665V9.33332C1.75021 9.53791 1.80422 9.73884 1.9066 9.91597C2.00899 10.0931 2.15615 10.2402 2.33333 10.3425L6.41667 12.6758C6.59402 12.7782 6.79521 12.8321 7 12.8321C7.20479 12.8321 7.40598 12.7782 7.58333 12.6758L11.6667 10.3425C11.8438 10.2402 11.991 10.0931 12.0934 9.91597C12.1958 9.73884 12.2498 9.53791 12.25 9.33332Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      name: "Support Tickets",
      href: "/admin/support-tickets",
      icon: (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.8334 3.50004C12.8334 2.85837 12.3084 2.33337 11.6667 2.33337H2.33335C1.69169 2.33337 1.16669 2.85837 1.16669 3.50004M12.8334 3.50004V10.5C12.8334 11.1417 12.3084 11.6667 11.6667 11.6667H2.33335C1.69169 11.6667 1.16669 11.1417 1.16669 10.5V3.50004M12.8334 3.50004L7.00002 7.58337L1.16669 3.50004" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      name: "Audit Logs",
      href: "/admin/audit-logs",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor" />
          <path d="M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z" fill="currentColor" />
        </svg>
      )
    },
  ];

  // Fetch admin info from session
  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAdmin(data.admin);
      })
      .catch(() => { });
  }, [pathname]); // Refetch when route changes (e.g., after profile update)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const getInitial = () => {
    if (!admin?.username) return "A";
    return admin.username.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col h-screen bg-[#171821] overflow-hidden">
      {/* Top Bar - Logo left, Profile right */}
      <header className="h-[74px] bg-[#1D1E27] border-b border-[#2C2D33] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center">
          <Image src="/logo2.png" alt="Logo" width={174} height={44} className="object-contain" loading="eager" priority />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-full bg-[#96DDFF] flex items-center justify-center text-[#171821] text-sm font-semibold">
              {getInitial()}
            </div>
            <svg
              className={`w-4 h-4 text-white transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#21222D] rounded-2xl border border-[#2C2D33] shadow-[0px_8px_40px_rgba(0,0,0,0.4)] overflow-hidden z-50">
              <div className="px-5 py-4 border-b border-[#2C2D33]">
                <p className="text-white font-medium text-sm truncate">
                  {admin?.username || "Admin"}
                </p>
                <p className="text-[#87888C] text-xs truncate mt-0.5">
                  {admin?.email || "admin@shuttleflow.com"}
                </p>
              </div>

              <div className="py-2">
                <Link
                  href="/admin/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-[#D2D2D2] text-sm hover:bg-[#2B2B36] hover:text-white transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </Link>

                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-[#EA1701] text-sm hover:bg-[#2B2B36] transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Body - Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[240px] flex flex-col bg-[#1D1E27] border-r border-[#2C2D33] flex-shrink-0">
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              // ✅ Updated: also match sub-routes so /admin/support-tickets/123
              //    keeps "Support Tickets" highlighted
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href + "/"));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                    ? "bg-[#96DDFF] text-[#171821]"
                    : "text-[#87888C] hover:bg-[#2C2D33] hover:text-white"
                    }`}
                >
                  <span className={`flex-shrink-0 w-5 h-5 ${isActive ? "text-[#171821]" : "text-[#87888C]"}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[#2C2D33] p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#96DDFF] flex items-center justify-center text-[#171821] text-sm font-semibold">
                {getInitial()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {admin?.username || "Admin"}
                </p>
                <p className="text-xs text-[#87888C] truncate">
                  {admin?.email || "admin@shuttleflow.com"}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 bg-[#171821]">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] max-w-md w-full mx-4 p-6 shadow-[0px_8px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FFC0B9]/10 mx-auto mb-4">
              <svg className="w-6 h-6 text-[#EA1701]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>

            <h3 className="text-white font-['Bai_Jamjuree'] text-xl font-bold text-center mb-2">
              Logout
            </h3>

            <p className="text-[#87888C] font-['Inter'] text-sm text-center mb-6">
              Are you sure you want to log out? You will need to sign in again to access the admin dashboard.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="flex-1 px-4 py-2.5 bg-[#2B2B36] text-white rounded-lg font-['Inter'] text-sm font-medium hover:bg-[#2C2D33] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="flex-1 px-4 py-2.5 bg-[#EA1701] text-white rounded-lg font-['Inter'] text-sm font-medium hover:bg-[#c91300] transition disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}