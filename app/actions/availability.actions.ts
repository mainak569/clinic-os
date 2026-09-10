"use server";

import { revalidatePath } from "next/cache";
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
import {
  UnauthorizedAvailabilityAccessError,
} from "@/lib/errors/appointment-errors";

/**
 * Availability Server Actions
 * 
 * Handles authorization and delegates business logic to service layer
 * Returns { success, data?, error? } for client consumption
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

    // Validate input
    const validatedInput = createAvailabilitySlotSchema.parse(input);

    // Authorization: check if user can modify this provider's availability
    const canAccess = await canAccessProviderData(validatedInput.providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError();
    }

    // Business logic
    const slot = await availabilityService.createSlot(validatedInput);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/providers/${validatedInput.providerId}`);

    return { success: true, data: { id: slot.id } };
  } catch (error) {
    console.error("createAvailabilitySlot error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to create availability slot" };
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

    // Validate input
    const validatedInput = updateAvailabilitySlotSchema.parse(input);

    // Get the slot to check provider ownership
    const existingSlot = await availabilityService.getSlotById(
      validatedInput.slotId
    );
    if (!existingSlot) {
      return { success: false, error: "Availability slot not found" };
    }

    // Authorization: check if user can modify this provider's availability
    const canAccess = await canAccessProviderData(existingSlot.providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError();
    }

    // Business logic
    const updateData: {
      dayOfWeek?: DayOfWeek;
      startTime?: Date;
      endTime?: Date;
    } = {};
    
    if (validatedInput.dayOfWeek !== undefined) {
      updateData.dayOfWeek = validatedInput.dayOfWeek;
    }
    if (validatedInput.startTime !== undefined) {
      updateData.startTime = validatedInput.startTime;
    }
    if (validatedInput.endTime !== undefined) {
      updateData.endTime = validatedInput.endTime;
    }

    const slot = await availabilityService.updateSlot(
      validatedInput.slotId,
      updateData
    );

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/providers/${existingSlot.providerId}`);

    return { success: true, data: { id: slot.id } };
  } catch (error) {
    console.error("updateAvailabilitySlot error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to update availability slot" };
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

    // Validate input
    const validatedInput = archiveAvailabilitySlotSchema.parse(input);

    // Get the slot to check provider ownership
    const existingSlot = await availabilityService.getSlotById(
      validatedInput.slotId
    );
    if (!existingSlot) {
      return { success: false, error: "Availability slot not found" };
    }

    // Authorization: check if user can modify this provider's availability
    const canAccess = await canAccessProviderData(existingSlot.providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError();
    }

    // Business logic
    const slot = await availabilityService.archiveSlot(validatedInput.slotId);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/providers/${existingSlot.providerId}`);

    return { success: true, data: { id: slot.id } };
  } catch (error) {
    console.error("archiveAvailabilitySlot error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to archive availability slot" };
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

    // Validate input
    const validatedInput = restoreAvailabilitySlotSchema.parse(input);

    // Get the slot to check provider ownership
    const existingSlot = await availabilityService.getSlotById(
      validatedInput.slotId
    );
    if (!existingSlot) {
      return { success: false, error: "Availability slot not found" };
    }

    // Authorization: check if user can modify this provider's availability
    const canAccess = await canAccessProviderData(existingSlot.providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError();
    }

    // Business logic
    const slot = await availabilityService.restoreSlot(validatedInput.slotId);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/providers/${existingSlot.providerId}`);

    return { success: true, data: { id: slot.id } };
  } catch (error) {
    console.error("restoreAvailabilitySlot error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to restore availability slot" };
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

    // Authorization: check if user can view this provider's availability
    const canAccess = await canAccessProviderData(providerId);
    if (!canAccess) {
      throw new UnauthorizedAvailabilityAccessError(
        "You are not authorized to view this provider's availability"
      );
    }

    // Business logic
    const slots = await availabilityService.getProviderSlots(
      providerId,
      includeInactive
    );

    return { success: true, data: slots };
  } catch (error) {
    console.error("getProviderAvailability error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to get provider availability" };
  }
}
