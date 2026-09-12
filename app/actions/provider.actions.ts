"use server";

import { headers } from "next/headers";
import { requireAuth, requireRole, canAccessProviderData } from "@/lib/auth-helpers";
import { providerService } from "@/lib/services/provider.service";
import { auditService } from "@/lib/services/audit.service";
import { revalidateDashboard } from "@/lib/revalidate";
import { actionErrorMessage } from "@/lib/action-error";
import {
  createProviderSchema,
  updateProviderSchema,
  setProviderActiveSchema,
  type CreateProviderInput,
  type UpdateProviderInput,
  type SetProviderActiveInput,
} from "@/lib/validations/provider";

/**
 * Provider Server Actions
 *
 * Authorization:
 * - FRONT_DESK: list, add, edit and (de)activate any provider
 * - PROVIDER:   edit their own details only
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function audit(
  userId: string,
  action: "CREATE" | "UPDATE",
  resourceId: string,
  details: Record<string, unknown>
) {
  const headersList = await headers();
  await auditService.log({
    userId,
    action,
    resource: "PROVIDER",
    resourceId,
    details,
    ipAddress: headersList.get("x-forwarded-for") ?? null,
    userAgent: headersList.get("user-agent") ?? null,
  });
}

export async function listProviders(input?: {
  includeInactive?: boolean;
}): Promise<ActionResult<any[]>> {
  try {
    await requireRole("FRONT_DESK");
    const providers = await providerService.listProviders({
      includeInactive: Boolean(input?.includeInactive),
    });
    return { success: true, data: providers };
  } catch (error) {
    console.error("listProviders error:", error);
    return { success: false, error: actionErrorMessage(error, "Failed to load providers") };
  }
}

export async function createProvider(
  input: CreateProviderInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireRole("FRONT_DESK");
    const validatedInput = createProviderSchema.parse(input);

    const provider = await providerService.createProvider(validatedInput);

    // Never log the password.
    await audit(session.user.id, "CREATE", provider.id, {
      email: validatedInput.email,
      firstName: validatedInput.firstName,
      lastName: validatedInput.lastName,
    });

    revalidateDashboard();
    return { success: true, data: { id: provider.id } };
  } catch (error) {
    console.error("createProvider error:", error);
    return { success: false, error: actionErrorMessage(error, "Failed to add provider") };
  }
}

export async function updateProvider(
  input: UpdateProviderInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const validatedInput = updateProviderSchema.parse(input);

    if (!(await canAccessProviderData(validatedInput.id))) {
      return { success: false, error: "You can only update your own provider details" };
    }

    const provider = await providerService.updateProvider(validatedInput);

    await audit(session.user.id, "UPDATE", provider.id, {
      email: validatedInput.email,
      passwordChanged: Boolean(validatedInput.password),
    });

    revalidateDashboard();
    return { success: true, data: { id: provider.id } };
  } catch (error) {
    console.error("updateProvider error:", error);
    return { success: false, error: actionErrorMessage(error, "Failed to update provider") };
  }
}

export async function setProviderActive(
  input: SetProviderActiveInput
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  try {
    const session = await requireRole("FRONT_DESK");
    const validatedInput = setProviderActiveSchema.parse(input);

    const provider = await providerService.setProviderActive(
      validatedInput.id,
      validatedInput.isActive
    );

    await audit(session.user.id, "UPDATE", provider.id, {
      isActive: validatedInput.isActive,
    });

    revalidateDashboard();
    return { success: true, data: { id: provider.id, isActive: provider.isActive } };
  } catch (error) {
    console.error("setProviderActive error:", error);
    return {
      success: false,
      error: actionErrorMessage(
        error,
        input?.isActive ? "Failed to reactivate provider" : "Failed to deactivate provider"
      ),
    };
  }
}
