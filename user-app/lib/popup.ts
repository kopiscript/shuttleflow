// lib/popup.ts
export const triggerNotificationPopup = (title: string, message: string, type?: string) => {
  if (typeof window !== 'undefined') {
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
  }
};