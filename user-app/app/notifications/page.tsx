"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaCircleInfo, FaClock, FaTriangleExclamation, FaBullhorn } from "react-icons/fa6";
import { useLanguage } from "../../context/LanguageContext";

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
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<number[]>([]);

  // Load read IDs from localStorage when page loads
  useEffect(() => {
    const stored = localStorage.getItem('readNotifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      setReadIds(parsed);
    }
  }, []);

  // Save read IDs to localStorage whenever they change
  useEffect(() => {
    if (readIds.length > 0) {
      localStorage.setItem('readNotifications', JSON.stringify(readIds));
    }
  }, [readIds]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      const data = await response.json();

      if (data.success) {
        const notificationsWithReadStatus = data.notifications.map((n: Notification) => ({
          ...n,
          isRead: readIds.includes(n.id)
        }));

        setNotifications(notificationsWithReadStatus);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(t("notifications.error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [readIds, t]);

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

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "delay":
        return <FaClock className="text-[#DEDFE8] text-xl sm:text-2xl flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />;
      case "alert":
        return <FaTriangleExclamation className="text-[#DEDFE8] text-xl sm:text-2xl flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />;
      case "announcement":
        return <FaBullhorn className="text-[#DEDFE8] text-xl sm:text-2xl flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />;
      default:
        return <FaCircleInfo className="text-[#DEDFE8] text-xl sm:text-2xl flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Handle back button click
  const handleBack = () => {
    router.back();
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="relative flex flex-col h-screen bg-[#2B261B] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#99121A] mx-auto"></div>
          <p className="mt-4 text-[#DEDFE8] font-['Inter']">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-[#2B261B] overflow-hidden">
      <div className="relative z-10 px-6 pt-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="w-5 h-5 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="bg-[#99121A] text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#7a0e14] transition shadow-md whitespace-nowrap font-['Inter']"
            >
              {t("notifications.markAllRead")}
            </button>
          ) : (
            <div className="w-20" />
          )}
        </div>

        {/* Title with Bai Jamjuree font - Dark mode color #DEDFE8 */}
        <h1 className="text-center text-[#DEDFE8] text-3xl font-bold mt-6 font-['Bai_Jamjuree']">
          {t("notifications.title")}
        </h1>

        {/* Subtitle - Dark mode color #DEDFE8 with opacity */}
        <p className="text-center text-[#DEDFE8] text-base font-medium mt-2 px-4 font-['Bai_Jamjuree'] opacity-80">
          {t("notifications.subtitle")}
        </p>
      </div>

      {/* Notifications List */}
      <div className="relative flex-1 mt-4 min-h-0 overflow-y-auto">
        <div className="px-4 pb-6">
          <div className="space-y-0 max-w-2xl mx-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-red-600 text-sm font-['Inter']">{error}</p>
                <button onClick={fetchNotifications} className="mt-2 text-red-600 text-sm underline font-['Inter']">
                  {t("common.retry")}
                </button>
              </div>
            )}

            {!error && notifications.length === 0 && (
              <div className="bg-[#3D3627] rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3">🔔</div>
                <p className="text-[#DEDFE8] font-medium font-['Inter']">{t("notifications.noNotifications")}</p>
                <p className="text-[#DEDFE8] text-sm mt-1 opacity-60 font-['Inter']">{t("notifications.allCaughtUp")}</p>
              </div>
            )}

            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <div className="py-5">
                  <div className="flex gap-3 sm:gap-8">
                    {/* Icon container */}
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-2">
                        {/* Title - Unread: #FFFFFF, Read: #DEDFE8 with opacity */}
                        <h3 className={`font-['Inter'] font-semibold text-sm sm:text-base ${!notification.isRead ? "text-white" : "text-[#DEDFE8] opacity-70"}`}>
                          {notification.title}
                        </h3>
                        {/* Date - #DEDFE8 with opacity */}
                        <span className="text-xs text-[#DEDFE8] opacity-50 font-['Inter']">
                          {formatDateTime(notification.createdAt)}
                        </span>
                      </div>

                      {/* Message - #FFFFFF */}
                      <p className="text-white text-sm sm:text-base leading-relaxed font-['Inter'] opacity-80">
                        {notification.message}
                      </p>
                    </div>

                    {/* Mark as read button */}
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-[#99121A] text-white hover:bg-[#7a0e14] transition shadow-sm flex items-center justify-center"
                        title={t("notifications.markAsRead")}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}

                    {/* Read icon */}
                    {notification.isRead && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4D4532] text-[#DEDFE8] flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Separator Line - White with 20% opacity */}
                {index < notifications.length - 1 && (
                  <div className="border-t border-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}