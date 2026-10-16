// user-app/components/NotificationPopup.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Pusher from "pusher-js";

type NotificationPopupType = {
  id: string;
  title: string;
  message: string;
  type?: string;
  driverName?: string | null;
  driverPhone?: string | null;
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

    // Subscribe to Pusher for real-time ESP32 hardware alerts
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    let pusher: Pusher | null = null;

    if (pusherKey && pusherCluster) {
      pusher = new Pusher(pusherKey, { cluster: pusherCluster });
      const alertChannel = pusher.subscribe("fleet-alerts");

      alertChannel.bind("bus-status-change", (data: any) => {
        addNotification(
          {
            id: `${data.busId}-${Date.now()}`,
            title: data.title || `Bus Status: ${data.status}`,
            message: data.message,
            type: data.status, // "Breakdown" | "Delayed" | "Active"
            driverName: data.driverName,
            driverPhone: data.driverPhone,
          },
          8000
        );
      });
    }

    return () => {
      window.removeEventListener("new-notification" as any, handleNewNotification);
      if (pusher) pusher.unsubscribe("fleet-alerts");
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

            {(notif.driverName || notif.driverPhone) && (
              <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-xs">
                <span className="text-white/80">
                  Driver: <strong className="text-white">{notif.driverName || "Assigned"}</strong>
                </span>
                {notif.driverPhone && (
                  <a
                    href={`tel:${notif.driverPhone}`}
                    className="text-[#96DDFF] hover:underline font-mono font-semibold"
                  >
                    📞 {notif.driverPhone}
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>,
    document.body
  );
}