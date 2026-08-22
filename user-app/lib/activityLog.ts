// lib/activityLog.ts
import { prisma } from "./prisma";

type EventType =
  | "bus_created"
  | "bus_updated"
  | "status_changed"
  | "route_assigned"
  | "device_assigned"
  | "bus_deleted";

export async function logActivity(
  busId: number,
  eventType: EventType,
  description: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        busId,
        eventType,
        description,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}