// app/admin/(dashboard)/components/FindOnMapButton.tsx
"use client";

import { useState } from "react";

type Props = {
  address: string;
  onResolved: (lat: number, lng: number, formattedAddress: string) => void;
  label?: string;
};

export default function FindOnMapButton({
  address,
  onResolved,
  label = "Find on Map",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);

    if (!address || address.trim().length < 3) {
      setError("Enter an address first (at least 3 characters)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/geocode?address=${encodeURIComponent(address.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not find that address");
        return;
      }

      onResolved(data.lat, data.lng, data.formattedAddress);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center gap-1.5 self-start rounded-md border border-[#2C2D33] bg-[#171821] px-3 py-1.5 text-xs font-medium font-['Inter'] text-[#96DDFF] transition hover:bg-[#2C2D33] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Finding…
          </>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
            {label}
          </>
        )}
      </button>
      {error && (
        <p className="text-[#EA1701] font-['Inter'] text-xs">{error}</p>
      )}
    </div>
  );
}