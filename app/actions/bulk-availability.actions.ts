"use server";

import { revalidateDashboard } from "@/lib/revalidate";
import { actionErrorMessage } from "@/lib/action-error";
import { timeStringToSlotDate } from "@/lib/clinic-time";
import { prisma } from "@/lib/prisma";
import { requireAuth, canAccessProviderData } from "@/lib/auth-helpers";
import { bulkAvailabilityService } from "@/lib/services/bulk-availability.service";
import {
  bulkCreateAvailabilitySchema,
  exportScheduleSchema,
  deleteBulkAvailabilitySchema,
  type BulkCreateAvailabilityInput,
  type ExportScheduleInput,
  type DeleteBulkAvailabilityInput,
} from "@/lib/validations/bulk-availability";

/**
 * Bulk Availability Server Actions
 * 
 * Handles bulk creation, export, and management of availability slots
 * 
 * Authorization:
 * - FRONT_DESK: Can manage all providers' availability
 * - PROVIDER: Can manage own availability only
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Bulk create recurring availability slots
 * 
 * Creates slots for specified days of week within date range
 * Handles collisions and provides detailed reporting
 */
export async function bulkCreateAvailability(
  input: BulkCreateAvailabilityInput
): Promise<
  ActionResult<{
    created: any[];
    skipped: any[];
    summary: {
      totalAttempted: number;
      successfullyCreated: number;
      skipped: number;
      errors: number;
    };
  }>
> {
  try {
    await requireAuth();

    // Validate input
    const validatedInput = bulkCreateAvailabilitySchema.parse(input);

    // Authorization: check if user can manage this provider's availability
    const canAccess = await canAccessProviderData(validatedInput.providerId);
    if (!canAccess) {
      return {
        success: false,
        error: "You can only manage your own availability",
      };
    }

    // Business logic
    const result = await bulkAvailabilityService.bulkCreateAvailability({
      providerId: validatedInput.providerId,
      daysOfWeek: validatedInput.daysOfWeek,
      startTime: timeStringToSlotDate(validatedInput.startTime),
      endTime: timeStringToSlotDate(validatedInput.endTime),
      skipCollisions: validatedInput.skipCollisions,
      overwriteExisting: validatedInput.overwriteExisting,
    });

    revalidateDashboard();

    return {
      success: true,
      data: {
        created: result.created,
        skipped: result.skipped,
        summary: result.summary,
      },
    };
  } catch (error) {
    console.error("bulkCreateAvailability error:", error);

    return { success: false, error: actionErrorMessage(error, "Failed to create availability slots") };
  }
}

/**
 * Export provider schedule to CSV
 * 
 * Returns CSV string with daily schedule
 */
export async function exportScheduleToCSV(
  input: ExportScheduleInput
): Promise<ActionResult<{ csv: string; filename: string }>> {
  try {
    await requireAuth();

    // Validate input
    const validatedInput = exportScheduleSchema.parse(input);

    // Authorization: check if user can access this provider's schedule
    const canAccess = await canAccessProviderData(validatedInput.providerId);
    if (!canAccess) {
      return {
        success: false,
        error: "You do not have permission to export this schedule",
      };
    }

    // Get provider info for filename
    const provider = await prisma.provider.findUnique({
      where: { id: validatedInput.providerId },
      select: { firstName: true, lastName: true },
    });

    // Generate CSV
    const csv = await bulkAvailabilityService.exportScheduleToCSV(
      validatedInput.providerId,
      validatedInput.startDate,
      validatedInput.endDate
    );

    // Generate filename
    const startDateStr = validatedInput.startDate.toISOString().split("T")[0];
    const endDateStr = validatedInput.endDate.toISOString().split("T")[0];
    const providerName = provider
      ? `${provider.firstName}_${provider.lastName}`
      : validatedInput.providerId;
    const filename = `schedule_${providerName}_${startDateStr}_to_${endDateStr}.csv`;

    return {
      success: true,
      data: { csv, filename },
    };
  } catch (error) {
    console.error("exportScheduleToCSV error:", error);

    return { success: false, error: actionErrorMessage(error, "Failed to export schedule") };
  }
}

/**
 * Export provider schedule to JSON
 * 
 * Returns JSON string with daily schedule
 */
export async function exportScheduleToJSON(
  input: ExportScheduleInput
): Promise<ActionResult<{ json: string; filename: string }>> {
  try {
    await requireAuth();

    // Validate input
    const validatedInput = exportScheduleSchema.parse(input);

    // Authorization: check if user can access this provider's schedule
    const canAccess = await canAccessProviderData(validatedInput.providerId);
    if (!canAccess) {
      return {
        success: false,
        error: "You do not have permission to export this schedule",
      };
    }

    // Get provider info for filename
    const provider = await prisma.provider.findUnique({
      where: { id: validatedInput.providerId },
      select: { firstName: true, lastName: true },
    });

    // Generate JSON
    const json = await bulkAvailabilityService.exportScheduleToJSON(
      validatedInput.providerId,
      validatedInput.startDate,
      validatedInput.endDate
    );

    // Generate filename
    const startDateStr = validatedInput.startDate.toISOString().split("T")[0];
    const endDateStr = validatedInput.endDate.toISOString().split("T")[0];
    const providerName = provider
      ? `${provider.firstName}_${provider.lastName}`
      : validatedInput.providerId;
    const filename = `schedule_${providerName}_${startDateStr}_to_${endDateStr}.json`;

    return {
      success: true,
      data: { json, filename },
    };
  } catch (error) {
    console.error("exportScheduleToJSON error:", error);

    return { success: false, error: actionErrorMessage(error, "Failed to export schedule") };
  }
}

/**
 * Get daily schedule (for preview)
 * 
 * Returns schedule data without exporting
 */
export async function getDailySchedule(input: {
  providerId: string;
  startDate: Date;
  endDate: Date;
}): Promise<ActionResult<any[]>> {
  try {
    await requireAuth();

    // Authorization: check if user can access this provider's schedule
    const canAccess = await canAccessProviderData(input.providerId);
    if (!canAccess) {
      return {
        success: false,
        error: "You do not have permission to view this schedule",
      };
    }

    // Get schedule
    const schedule = await bulkAvailabilityService.getDailySchedule(
      input.providerId,
      input.startDate,
      input.endDate
    );

    return {
      success: true,
      data: schedule,
    };
  } catch (error) {
    console.error("getDailySchedule error:", error);

    return { success: false, error: actionErrorMessage(error, "Failed to get schedule") };
  }
}

/**
 * Delete bulk availability slots
 * 
 * Archives all slots matching criteria
 */
export async function deleteBulkAvailability(
  input: DeleteBulkAvailabilityInput
): Promise<ActionResult<{ archived: number }>> {
  try {
    await requireAuth();

    // Validate input
    const validatedInput = deleteBulkAvailabilitySchema.parse(input);

    // Authorization: check if user can manage this provider's availability
    const canAccess = await canAccessProviderData(validatedInput.providerId);
    if (!canAccess) {
      return {
        success: false,
        error: "You can only manage your own availability",
      };
    }

    // Business logic
    const result = await bulkAvailabilityService.deleteBulkAvailability({
      providerId: validatedInput.providerId,
      daysOfWeek: validatedInput.daysOfWeek,
    });

    revalidateDashboard();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("deleteBulkAvailability error:", error);

    return { success: false, error: actionErrorMessage(error, "Failed to delete availability slots") };
  }
}

