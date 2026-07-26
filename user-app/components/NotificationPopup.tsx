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

    const handleNewNotification = (event: CustomEvent<NotificationPopupType>) => {
      const newNotif = event.detail;
      setNotifications((prev) => [newNotif, ...prev].slice(0, 3));
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
      }, 5000);
    };

    window.addEventListener("new-notification" as any, handleNewNotification);
    return () => window.removeEventListener("new-notification" as any, handleNewNotification);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!mounted || notifications.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="relative bg-white/10 backdrop-blur-md rounded-2xl shadow-lg pointer-events-auto p-4"
        >
          <button
            onClick={() => removeNotification(notif.id)}
            className="absolute top-2 right-2 text-white/70 hover:text-white"
          >
            ✕
          </button>
          <h4 className="text-white font-semibold">{notif.title}</h4>
          <p className="text-white/80 text-sm">{notif.message}</p>
        </div>
      ))}
    </div>,
    document.body
  );
}