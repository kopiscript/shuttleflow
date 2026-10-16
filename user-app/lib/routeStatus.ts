// lib/routeStatus.ts

// Rule: A route is Active if it has at least one BusRouteAssignment with:
//   - endedAt: null              (assignment not closed)
//   - bus.status is operational ("Active", "Delayed", or "Breakdown")
//   - that bus also has at least one BusDeviceAssignment with endedAt: null
//     (a GPS device is currently assigned to the bus)
//
// If the bus is deactivated (status === "Inactive"), or the bus has no device
// currently assigned, the route is treated as Inactive and hidden from the
// user-facing app — even if the `routes.status` column says "Active".
// The `status` column is NOT read anywhere; status is always derived live.

const OPERATIONAL_BUS_STATUSES = ["active", "delayed", "breakdown"];

export type BusAssignmentForStatus = {
  endedAt: Date | null;
  startedAt?: Date;
  bus: {
    status: string;
    deviceAssignments?: { endedAt: Date | null }[];
  };
};

export function deriveRouteStatus(
  busAssignments: BusAssignmentForStatus[]
): "Active" | "Inactive" {
  const hasActiveBusWithDevice = busAssignments.some((a) => {
    // Assignment must currently be open
    if (a.endedAt !== null) return false;

    // Bus itself must be operational (Active, Delayed, or Breakdown)
    const busStatus = a.bus?.status;
    if (
      typeof busStatus !== "string" ||
      !OPERATIONAL_BUS_STATUSES.includes(busStatus.trim().toLowerCase())
    ) {
      return false;
    }

    // Bus must have a currently-assigned device (endedAt: null)
    const deviceAssignments = a.bus.deviceAssignments ?? [];
    const hasDevice = deviceAssignments.some((d) => d.endedAt === null);

    return hasDevice;
  });

  return hasActiveBusWithDevice ? "Active" : "Inactive";
}

/**
 * Prisma `include` shape needed for deriveRouteStatus to work.
 * Spread into any `prisma.route.findMany/findUnique` call.
 *
 * Includes the bus's currently-open device assignments so deriveRouteStatus
 * can check whether a device is attached, not just whether the bus is Active.
 */
export const routeStatusInclude = {
  busAssignments: {
    include: {
      bus: {
        select: {
          id: true,
          busName: true,
          licensePlate: true,
          status: true,
          driverName: true,
          driverPhone: true,
          deviceAssignments: {
            where: { endedAt: null },
            select: {
              id: true,
              endedAt: true,
              device: {
                select: {
                  id: true,
                  deviceName: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;