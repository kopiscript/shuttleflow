"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type NotificationPopupType = {
  id: string;
  title: string;
  message: string;
  type?: "info" | "delay" | "alert" | "announcement";
};

export default function NotificationPopup() {
  const [notifications, setNotifications] = useState<NotificationPopupType[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Listen for new notifications
    const handleNewNotification = (event: CustomEvent<NotificationPopupType>) => {
      // Check if system notifications are enabled in settings
      const savedSettings = localStorage.getItem('shuttleflow_settings');
      let systemNotificationsEnabled = true;

      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          systemNotificationsEnabled = settings.systemNotifications ?? true;
        } catch (error) {
          console.error("Error reading settings:", error);
        }
      }

      // Don't show popup if disabled
      if (!systemNotificationsEnabled) {
        console.log("🔕 System notifications disabled - popup suppressed:", event.detail.title);
        return;
      }

      const newNotif = event.detail;
      console.log("📢 Popup triggered:", newNotif.title);

      setNotifications(prev => [newNotif, ...prev].slice(0, 3));

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      }, 5000);
    };

    window.addEventListener('new-notification' as any, handleNewNotification);
    return () => window.removeEventListener('new-notification' as any, handleNewNotification);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!mounted || notifications.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-[90vw] sm:max-w-[380px] pointer-events-none">
      {notifications.map((notif, index) => (
        <div
          key={notif.id}
          className="relative w-full bg-white/10 backdrop-blur-md rounded-[15px] shadow-lg pointer-events-auto mx-auto"
          style={{
            background: "rgba(255, 255, 255, 0.07)",
            boxShadow: "0px 8px 40px rgba(0, 0, 0, 0.2)",
            animation: `slideDown 0.3s ease-out forwards`,
            animationDelay: `${index * 0.1}s`,
          }}
        >
          {/* Close button */}
          <button
            onClick={() => removeNotification(notif.id)}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon based on type */}
          <div className="absolute left-3 top-3 text-xl">
            {notif.type === "delay" && "🚌"}
            {notif.type === "alert" && "⚠️"}
            {notif.type === "announcement" && "📢"}
            {(!notif.type || notif.type === "info") && "🔔"}
          </div>

          {/* Content */}
          <div className="p-3 pl-12 pr-8">
            <h3 className="font-semibold text-[14px] sm:text-[15px] text-white mb-1">
              {notif.title}
            </h3>
            <p className="text-[12px] sm:text-[14px] text-white/90">
              {notif.message}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/20 rounded-b-[15px] overflow-hidden">
            <div
              className="h-full bg-white/50"
              style={{
                animation: `shrink 5s linear forwards`,
              }}
            />
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}