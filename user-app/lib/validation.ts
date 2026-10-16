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

export function hasErrors(errors: BusValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}