// user-app/components/NotificationPopup.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type NotificationPopupType = {
  id: string;
  title: string;
  message: string;
  type?: string;
};

export default function NotificationPopup() {
  const [notifications, setNotifications] = useState<NotificationPopupType[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const addNotification = (newNotif: NotificationPopupType, duration = 5000) => {
      setNotifications((prev) => [newNotif, ...prev].slice(0, 3));
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
      }, duration);
    };

    const handleNewNotification = (event: CustomEvent<NotificationPopupType>) => {
      addNotification(event.detail, 5000);
    };

    window.addEventListener("new-notification" as any, handleNewNotification);

    return () => {
      window.removeEventListener("new-notification" as any, handleNewNotification);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!mounted || notifications.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
      {notifications.map((notif) => {
        const isBreakdown = notif.type === "Breakdown";
        const isDelay = notif.type === "Delayed";

        const bgClass = isBreakdown
          ? "bg-red-900/90 border border-red-500/60"
          : isDelay
            ? "bg-amber-900/90 border border-amber-500/60"
            : "bg-white/10 border border-white/20";

        return (
          <div
            key={notif.id}
            className={`relative backdrop-blur-md rounded-2xl shadow-lg pointer-events-auto p-4 ${bgClass}`}
          >
            <button
              onClick={() => removeNotification(notif.id)}
              className="absolute top-2 right-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
            <h4 className="text-white font-semibold pr-5">{notif.title}</h4>
            <p className="text-white/80 text-sm mt-0.5">{notif.message}</p>

          </div>
        );
      })}
    </div>,
    document.body
  );
}
