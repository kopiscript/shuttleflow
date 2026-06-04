// lib/popup.ts

// Helper function to check if system notifications are enabled
const areSystemNotificationsEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;

  const savedSettings = localStorage.getItem('shuttleflow_settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      return settings.systemNotifications ?? true;
    } catch {
      return true;
    }
  }
  return true;
};

export const triggerNotificationPopup = (title: string, message: string, type?: string) => {
  console.log("🎯 triggerNotificationPopup STARTED", { title, message, type });

  if (typeof window !== 'undefined') {
    console.log("🎯 Window exists");

    // Check if system notifications are enabled
    const enabled = areSystemNotificationsEnabled();
    console.log("🎯 System notifications enabled:", enabled);

    if (!enabled) {
      console.log("🔕 System notifications disabled - popup suppressed:", title);
      return;
    }

    // Only dispatch if enabled
    const event = new CustomEvent('new-notification', {
      detail: {
        id: Date.now().toString(),
        title,
        message,
        type
      }
    });
    window.dispatchEvent(event);
    console.log("🔔 Popup triggered:", title);
  } else {
    console.log("🎯 No window object");
  }
};