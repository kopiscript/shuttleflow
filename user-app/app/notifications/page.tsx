"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<number[]>([]);

  // Load read IDs from localStorage when page loads
  useEffect(() => {
    const stored = localStorage.getItem('readNotifications');
    console.log("📦 Loading read IDs from localStorage:", stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      setReadIds(parsed);
      console.log("✅ Loaded read IDs:", parsed);
    } else {
      console.log("ℹ️ No read IDs found in localStorage");
    }
  }, []);

  // Save read IDs to localStorage whenever they change
  useEffect(() => {
    if (readIds.length > 0) {
      localStorage.setItem('readNotifications', JSON.stringify(readIds));
      console.log("💾 Saved read IDs to localStorage:", readIds);
    }
  }, [readIds]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      const data = await response.json();

      if (data.success) {
        console.log("📋 Fetched notifications:", data.notifications.length);
        console.log("📌 Current read IDs:", readIds);

        const notificationsWithReadStatus = data.notifications.map((n: Notification) => ({
          ...n,
          isRead: readIds.includes(n.id)
        }));

        const unreadCount = notificationsWithReadStatus.filter((n: Notification) => !n.isRead).length;
        console.log(`🔔 Unread count: ${unreadCount} / ${notificationsWithReadStatus.length}`);

        setNotifications(notificationsWithReadStatus);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [readIds]);

  // Fetch when component mounts AND when readIds changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Also refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark single notification as read
  const markAsRead = (id: number) => {
    console.log("✏️ Marking as read:", id);
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      setReadIds(newReadIds);

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    console.log("✏️ Marking all as read");
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);

    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Handle back button click
  const handleBack = () => {
    router.back();
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="relative flex flex-col h-screen bg-[#EEEBE4] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#99121A] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-[#EEEBE4] overflow-hidden">
      <div className="relative z-10 px-6 pt-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Back Button - NOW USES router.back() */}
          <button
            onClick={handleBack}
            className="w-5 h-5 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-[#171821]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <Image
            src="/logo.png"
            alt="Logo"
            width={148}
            height={34}
            className="object-contain"
          />

          {/* Mark all read button */}
          {unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="bg-[#99121A] text-white text-xs px-3 py-1.5 rounded-full hover:bg-[#7a0e14] transition font-medium"
            >
              Mark all as READ
            </button>
          ) : (
            <div className="w-20" />
          )}
        </div>

        <h1 className="text-center text-[#171821] text-2xl font-bold mt-6">
          Notifications
        </h1>

        <p className="text-center text-[#6E6E6E] text-base font-medium mt-2 px-4">
          Stay updated with shuttle alerts and announcements
        </p>
      </div>

      {/* Notifications List */}
      <div className="relative flex-1 mt-4 min-h-0 overflow-y-auto">
        <div className="px-4 pb-6">
          <div className="space-y-0 max-w-2xl mx-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-red-600 text-sm">{error}</p>
                <button onClick={fetchNotifications} className="mt-2 text-red-600 text-sm underline">Try again</button>
              </div>
            )}

            {!error && notifications.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3">🔔</div>
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
              </div>
            )}

            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <div className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                        <h3 className={`font-semibold text-sm sm:text-base ${!notification.isRead ? "text-[#171821]" : "text-[#6E6E6E]"}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-[#6E6E6E] opacity-70">
                          {formatDateTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="text-[#6E6E6E] text-sm sm:text-base leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    {/* Mark as read button */}
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="self-start sm:self-center flex-shrink-0 w-8 h-8 rounded-full bg-[#99121A] text-white hover:bg-[#7a0e14] transition shadow-sm flex items-center justify-center"
                        title="Mark as read"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}

                    {/* Read icon */}
                    {notification.isRead && (
                      <div className="self-start sm:self-center flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-[#6E6E6E] flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {index < notifications.length - 1 && (
                  <div className="border-t border-[#6E6E6E] opacity-30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}