// components/DeleteConfirmModal.tsx
"use client";

import { useEffect } from "react";

type Variant = "danger" | "warning";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Modal header title, e.g. "Delete Bus" */
  title: string;
  /** Main confirmation line, e.g. "Are you sure you want to delete" */
  message?: string;
  /** Highlighted item shown in red, e.g. "Bus B001 (WXY 1234)" */
  itemName?: string;
  /** Secondary description under the item name */
  description?: string;
  loading?: boolean;
  /** Label for the confirm button (default: "Delete") */
  confirmLabel?: string;
  /** Label while loading (default: "Deleting...") */
  loadingLabel?: string;
  /** Visual style: danger (red, trash icon) or warning (amber, unlink icon) */
  variant?: Variant;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message = "Are you sure you want to delete",
  itemName,
  description = "This action cannot be undone. All data associated with this item will be permanently removed.",
  loading = false,
  confirmLabel = "Delete",
  loadingLabel = "Deleting...",
  variant = "danger",
}: DeleteConfirmModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, loading]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Variant-specific styles
  const isWarning = variant === "warning";
  const accentColor = isWarning ? "#F5A623" : "#CD0000";
  const hoverBg = isWarning ? "#d99418" : "#b30000";
  const iconBg = isWarning ? "bg-[#F5A623]/20" : "bg-[#CD0000]/20";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white font-['Bai_Jamjuree']">
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#87888C] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center`}>
              {isWarning ? (
                // Unlink icon for "warning" variant
                <svg
                  className="w-8 h-8"
                  style={{ color: accentColor }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              ) : (
                // Trash icon for "danger" variant
                <svg
                  className="w-8 h-8"
                  style={{ color: accentColor }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </div>
          </div>

          <p className="text-white text-center font-['Inter'] text-base">
            {message} <br />
            {itemName && (
              <span className="font-bold" style={{ color: accentColor }}>
                {itemName}
              </span>
            )}
            ?
          </p>

          <p className="text-[#87888C] text-center font-['Inter'] text-sm mt-2">
            {description}
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 bg-[#2C2D33] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#3C3D44] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2.5 text-white rounded-lg font-semibold font-['Inter'] text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: accentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          >
            {isWarning ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}