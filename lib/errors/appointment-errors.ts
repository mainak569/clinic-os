/**
 * Custom Error Classes for Appointment Domain
 * 
 * Provides type-safe error handling with descriptive messages
 */

export class AppointmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentError";
  }
}

export class InvalidTransitionError extends AppointmentError {
  constructor(from: string, to: string) {
    super(`Invalid appointment status transition from ${from} to ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export class AppointmentNotFoundError extends AppointmentError {
  constructor(appointmentId: string) {
    super(`Appointment not found: ${appointmentId}`);
    this.name = "AppointmentNotFoundError";
  }
}

export class UnauthorizedAppointmentAccessError extends AppointmentError {
  constructor(message = "You are not authorized to access this appointment") {
    super(message);
    this.name = "UnauthorizedAppointmentAccessError";
  }
}

export class AvailabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailabilityError";
  }
}

export class AvailabilitySlotNotFoundError extends AvailabilityError {
  constructor(slotId: string) {
    super(`Availability slot not found: ${slotId}`);
    this.name = "AvailabilitySlotNotFoundError";
  }
}

export class UnauthorizedAvailabilityAccessError extends AvailabilityError {
  constructor(message = "You are not authorized to modify this availability slot") {
    super(message);
    this.name = "UnauthorizedAvailabilityAccessError";
  }
}

export class OverlappingSlotError extends AvailabilityError {
  constructor() {
    super("This time slot overlaps with an existing availability slot");
    this.name = "OverlappingSlotError";
  }
}

export class SlotHasBookingsError extends AvailabilityError {
  constructor(count: number) {
    super(
      count === 1
        ? "This slot has an upcoming booked appointment. Reschedule or cancel it before changing the slot."
        : `This slot has ${count} upcoming booked appointments. Reschedule or cancel them before changing the slot.`
    );
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
