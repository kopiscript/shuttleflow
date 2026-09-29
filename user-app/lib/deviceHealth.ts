// lib/deviceHealth.ts
export type DeviceHealthStatus = "Online" | "Warning" | "Offline" | "Never Connected";
export function getDeviceHealth(lastSeen: Date | string | null) {
    if (!lastSeen) {
        return {
            status: "Never Connected" as DeviceHealthStatus,
            minutesSinceLastPing: null,
        };
    }
    const lastSeenTime = new Date(lastSeen).getTime();
    const now = Date.now();
    const diffMs = now - lastSeenTime;
    const minutesSinceLastPing = Math.floor(diffMs / 60000);
    let status: DeviceHealthStatus;
    if (minutesSinceLastPing <= 2) {
        status = "Online";
    } else if (minutesSinceLastPing <= 5) {
        status = "Warning";
    } else {
        status = "Offline";
    }
    return {
        status,
        minutesSinceLastPing,
    };
}
export function formatLastPing(lastSeen: Date | string | null) {
    if (!lastSeen) return "Never";
    const diffMs = Date.now() - new Date(lastSeen).getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (seconds < 60) return `${seconds} sec ago`;
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
    return `${days} day${days === 1 ? "" : "s"} ago`;
}