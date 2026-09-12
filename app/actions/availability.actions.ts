"use server";

import { requireAuth, canAccessProviderData } from "@/lib/auth-helpers";
import { availabilityService } from "@/lib/services/availability.service";
import { DayOfWeek } from "@prisma/client";
import {
  createAvailabilitySlotSchema,
  updateAvailabilitySlotSchema,
  archiveAvailabilitySlotSchema,
  restoreAvailabilitySlotSchema,
  type CreateAvailabilitySlotInput,
  type UpdateAvailabilitySlotInput,
  type ArchiveAvailabilitySlotInput,
  type RestoreAvailabilitySlotInput,
} from "@/lib/validations/availability";
import { UnauthorizedAvailabilityAccessError } from "@/lib/errors/appointment-errors";
import { prisma } from "@/lib/prisma";
import { timeStringToSlotDate } from "@/lib/clinic-time";
import { revalidateDashboard } from "@/lib/revalidate";
import { actionErrorMessage } from "@/lib/action-error";

/**
 * Availability Server Actions
 *
 * Handles authorization and delegates business logic to service layer.
 * Slot times arrive as "HH:MM" strings and are converted to the canonical
 * slot encoding here, so the browser's timezone never reaches the database.
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Create a new availability slot
 */
export async function createAvailabilitySlot(
  input: CreateAvailabilitySlotInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();

    const validatedInput = createAvailabilitySlotSchema.parse(input);

    const canAccess = await canAccessProviderData(validatedInput.providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError();
    }

    const slot = await availabilityService.createSlot({
      providerId: validatedInput.providerId,
      dayOfWeek: validatedInput.dayOfWeek,
      startTime: timeStringToSlotDate(validatedInput.startTime),
      endTime: timeStringToSlotDate(validatedInput.endTime),
    });

    revalidateDashboard();

    return { success: true, data: { id: slot.id } };
  } catch (error) {
    console.error("createAvailabilitySlot error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to create availability slot"),
    };
  }
}

/**
 * Update an existing availability slot
 */
export async function updateAvailabilitySlot(
  input: UpdateAvailabilitySlotInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();

    const validatedInput = updateAvailabilitySlotSchema.parse(input);

    const existingSlot = await availabilityService.getSlotById(validatedInput.slotId);
    if (!existingSlot) {
      return { success: false, error: "Availability slot not found" };
    }

    const canAccess = await canAccessProviderData(existingSlot.providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError();
    }

    const updateData: {
      dayOfWeek?: DayOfWeek;
      startTime?: Date;
      endTime?: Date;
    } = {};

    if (validatedInput.dayOfWeek !== undefined) {
      updateData.dayOfWeek = validatedInput.dayOfWeek;
    }
    if (validatedInput.startTime !== undefined) {
      updateData.startTime = timeStringToSlotDate(validatedInput.startTime);
    }
    if (validatedInput.endTime !== undefined) {
      updateData.endTime = timeStringToSlotDate(validatedInput.endTime);
    }

    const slot = await availabilityService.updateSlot(validatedInput.slotId, updateData);

    revalidateDashboard();

    return { success: true, data: { id: slot.id } };
  } catch (error) {
    console.error("updateAvailabilitySlot error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to update availability slot"),
    };
  }
}

/**
 * Delete (permanently remove) an availability slot
 *
 * WARNING: This permanently deletes the slot from the database.
 * Use archive instead for normal operations.
 */
export async function deleteAvailabilitySlot(
  input: ArchiveAvailabilitySlotInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();

    const validatedInput = archiveAvailabilitySlotSchema.parse(input);

    const existingSlot = await availabilityService.getSlotById(validatedInput.slotId);
    if (!existingSlot) {
      return { success: false, error: "Availability slot not found" };
    }

    const canAccess = await canAccessProviderData(existingSlot.providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError();
    }

    await prisma.availabilitySlot.delete({
      where: { id: validatedInput.slotId },
    });

    revalidateDashboard();

    return { success: true, data: { id: validatedInput.slotId } };
  } catch (error) {
    console.error("deleteAvailabilitySlot error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to delete availability slot"),
    };
  }
}

/**
 * Archive (soft delete) an availability slot
 */
export async function archiveAvailabilitySlot(
  input: ArchiveAvailabilitySlotInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();

    const validatedInput = archiveAvailabilitySlotSchema.parse(input);

    const existingSlot = await availabilityService.getSlotById(validatedInput.slotId);
    if (!existingSlot) {
      return { success: false, error: "Availability slot not found" };
    }

    const canAccess = await canAccessProviderData(existingSlot.providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError();
    }

    const slot = await availabilityService.archiveSlot(validatedInput.slotId);

    revalidateDashboard();

    return { success: true, data: { id: slot.id } };
  } catch (error) {
    console.error("archiveAvailabilitySlot error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to archive availability slot"),
    };
  }
}

/**
 * Restore an archived availability slot
 */
export async function restoreAvailabilitySlot(
  input: RestoreAvailabilitySlotInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();

    const validatedInput = restoreAvailabilitySlotSchema.parse(input);

    const existingSlot = await availabilityService.getSlotById(validatedInput.slotId);
    if (!existingSlot) {
      return { success: false, error: "Availability slot not found" };
    }

    const canAccess = await canAccessProviderData(existingSlot.providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError();
    }

    const slot = await availabilityService.restoreSlot(validatedInput.slotId);

    revalidateDashboard();

    return { success: true, data: { id: slot.id } };
  } catch (error) {
    console.error("restoreAvailabilitySlot error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to restore availability slot"),
    };
  }
}

/**
 * Get availability slots for a provider
 */
export async function getProviderAvailability(
  providerId: string,
  includeInactive = false
): Promise<ActionResult<any[]>> {
  try {
    await requireAuth();

    const canAccess = await canAccessProviderData(providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError(
        "You are not authorized to view this provider's availability"
      );
    }

    const slots = await availabilityService.getProviderSlots(providerId, includeInactive);

    return { success: true, data: slots };
  } catch (error) {
    console.error("getProviderAvailability error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to get provider availability"),
    };
  }
}
