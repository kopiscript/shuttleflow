// lib/validation.ts

// ─── Centralized error messages ────────────────────────────────────────────
export const FORM_ERRORS = {
  required: (field: string) => `${field} is required`,
  minLength: (field: string, min: number) =>
    `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) =>
    `${field} must be at most ${max} characters`,
  invalidFormat: (field: string) => `Enter a valid ${field.toLowerCase()}`,
  mustBeNumber: (field: string) => `${field} must be a number`,
  mustBeAtLeast: (field: string, min: number) =>
    `${field} must be at least ${min}`,
  mustBeAtMost: (field: string, max: number) =>
    `${field} must be at most ${max}`,
  coordinates: (field: string) =>
    `${field} must be a valid number between ${field === "Latitude" ? "-90 and 90" : "-180 and 180"}`,
  bothCoordinatesRequired: (lat: string, lng: string) =>
    `Both ${lat} and ${lng} must be provided together`,
};

// Bus validation
export interface BusValidationErrors {
  licensePlate?: string;
  busName?: string;
  capacity?: string;
  driverName?: string;
  driverPhone?: string;
}

export function validateBusFields(fields: {
  licensePlate: string;
  busName: string;
  capacity: string;
  driverName?: string;
  driverPhone?: string;
}): BusValidationErrors {
  const errors: BusValidationErrors = {};

  // License Plate — required, unique (checked server-side), 3-12 chars, alphanumeric
  const plate = fields.licensePlate.trim().toUpperCase();
  if (!plate) {
    errors.licensePlate = "License plate is required";
  } else if (plate.length < 3) {
    errors.licensePlate = "License plate must be at least 3 characters";
  } else if (plate.length > 12) {
    errors.licensePlate = "License plate must be at most 12 characters";
  } else if (!/^[A-Z0-9]+$/.test(plate)) {
    errors.licensePlate =
      "License plate can only contain letters and numbers (e.g., VJL3738)";
  }

  // Bus Model — required, 2-50 chars (NOT unique)
  const model = fields.busName.trim();
  if (!model) {
    errors.busName = "Bus model is required";
  } else if (model.length < 2) {
    errors.busName = "Bus model must be at least 2 characters";
  } else if (model.length > 50) {
    errors.busName = "Bus model must be at most 50 characters";
  }

  // Capacity — required, integer 1-100
  const capStr = fields.capacity.trim();
  if (!capStr) {
    errors.capacity = "Capacity is required";
  } else {
    const cap = parseInt(capStr, 10);
    if (isNaN(cap)) {
      errors.capacity = "Capacity must be a number";
    } else if (cap < 1) {
      errors.capacity = "Capacity must be at least 1";
    } else if (cap > 100) {
      errors.capacity = "Capacity must be at most 100";
    }
  }

  // Driver Name — optional, 2-50 chars if provided
  const driverName = (fields.driverName ?? "").trim();
  if (driverName.length > 0) {
    if (driverName.length < 2) {
      errors.driverName = "Driver name must be at least 2 characters";
    } else if (driverName.length > 50) {
      errors.driverName = "Driver name must be at most 50 characters";
    }
  }

  // Driver Phone — optional, valid phone format if provided
  const driverPhone = (fields.driverPhone ?? "").trim();
  if (driverPhone.length > 0) {
    // Allows optional leading +, digits, spaces, dashes, parentheses
    // Total length between 7 and 20 characters
    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    if (!phoneRegex.test(driverPhone)) {
      errors.driverPhone = "Enter a valid phone number (e.g., 012-3456789)";
    }
  }

  return errors;
}

// Route validation
export interface RouteValidationErrors {
  routeName?: string;
  pickupStop?: string;
  pickupLat?: string;
  pickupLng?: string;
  dropoffStop?: string;
  dropoffLat?: string;
  dropoffLng?: string;
  intermediateStops?: string;
}

export function validateRouteFields(fields: {
  routeName: string;
  pickupStop: string;
  pickupLat?: string;
  pickupLng?: string;
  dropoffStop: string;
  dropoffLat?: string;
  dropoffLng?: string;
  intermediateStops?: string;
}): RouteValidationErrors {
  const errors: RouteValidationErrors = {};

  // Route Name — required, 2–100 chars
  const name = fields.routeName.trim();
  if (!name) {
    errors.routeName = FORM_ERRORS.required("Route name");
  } else if (name.length < 2) {
    errors.routeName = FORM_ERRORS.minLength("Route name", 2);
  } else if (name.length > 100) {
    errors.routeName = FORM_ERRORS.maxLength("Route name", 100);
  }

  // Pickup Stop — required
  const pickupStop = fields.pickupStop.trim();
  if (!pickupStop) {
    errors.pickupStop = FORM_ERRORS.required("Pickup stop");
  } else if (pickupStop.length < 2) {
    errors.pickupStop = FORM_ERRORS.minLength("Pickup stop", 2);
  } else if (pickupStop.length > 120) {
    errors.pickupStop = FORM_ERRORS.maxLength("Pickup stop", 120);
  }

  // Drop-off Stop — required
  const dropoffStop = fields.dropoffStop.trim();
  if (!dropoffStop) {
    errors.dropoffStop = FORM_ERRORS.required("Drop-off stop");
  } else if (dropoffStop.length < 2) {
    errors.dropoffStop = FORM_ERRORS.minLength("Drop-off stop", 2);
  } else if (dropoffStop.length > 120) {
    errors.dropoffStop = FORM_ERRORS.maxLength("Drop-off stop", 120);
  }

  // Pickup Coordinates — must be provided together, in valid range
  const pickupLatStr = (fields.pickupLat ?? "").trim();
  const pickupLngStr = (fields.pickupLng ?? "").trim();

  const hasPickupLat = pickupLatStr.length > 0;
  const hasPickupLng = pickupLngStr.length > 0;

  if (hasPickupLat !== hasPickupLng) {
    // One is filled, the other isn't
    if (!hasPickupLat) {
      errors.pickupLat = FORM_ERRORS.required("Pickup latitude");
    }
    if (!hasPickupLng) {
      errors.pickupLng = FORM_ERRORS.required("Pickup longitude");
    }
  } else if (hasPickupLat && hasPickupLng) {
    const lat = parseFloat(pickupLatStr);
    const lng = parseFloat(pickupLngStr);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.pickupLat = FORM_ERRORS.coordinates("Latitude");
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.pickupLng = FORM_ERRORS.coordinates("Longitude");
    }
  }
  // If both are empty → skip (server-side handles the "route needs coordinates" case)
  // Drop-off Coordinates
  const dropoffLatStr = (fields.dropoffLat ?? "").trim();
  const dropoffLngStr = (fields.dropoffLng ?? "").trim();

  const hasDropoffLat = dropoffLatStr.length > 0;
  const hasDropoffLng = dropoffLngStr.length > 0;

  if (hasDropoffLat !== hasDropoffLng) {
    if (!hasDropoffLat) {
      errors.dropoffLat = FORM_ERRORS.required("Drop-off latitude");
    }
    if (!hasDropoffLng) {
      errors.dropoffLng = FORM_ERRORS.required("Drop-off longitude");
    }
  } else if (hasDropoffLat && hasDropoffLng) {
    const lat = parseFloat(dropoffLatStr);
    const lng = parseFloat(dropoffLngStr);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.dropoffLat = FORM_ERRORS.coordinates("Latitude");
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.dropoffLng = FORM_ERRORS.coordinates("Longitude");
    }
  }

  // Intermediate Stops — optional, comma-separated list
  // Only validate length limits, not format. Malformed entries are silently
  // trimmed by the caller
  const intermediate = (fields.intermediateStops ?? "").trim();
  if (intermediate.length > 500) {
    errors.intermediateStops = FORM_ERRORS.maxLength(
      "Intermediate stops",
      500,
    );
  }

  return errors;
}

// Generic helpers

export function hasErrors(
  errors: BusValidationErrors | RouteValidationErrors,
): boolean {
  return Object.keys(errors).length > 0;
}