import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateProviderInput,
  ProviderProfileInput,
  UpdateProviderInput,
} from "@/lib/validations/provider";

/**
 * Provider Service Layer
 *
 * A provider spans three tables that must stay in step:
 *   User            - the login (role PROVIDER, isActive gates sign-in)
 *   Provider        - the clinician that appointments and slots belong to
 *   ProviderProfile - optional scheduling and contact details
 *
 * Before this service existed the only way to add a provider was the seed
 * script, so the front desk's "create a provider first" message had no path.
 * Every write here runs in a transaction so the three rows can't drift apart.
 */

const BCRYPT_ROUNDS = 10;
const OPEN_STATUSES = ["REQUESTED", "CONFIRMED", "CHECKED_IN"] as const;

const providerInclude = {
  user: { select: { id: true, email: true, isActive: true, lastLogin: true } },
  profile: true,
  _count: { select: { appointments: true, availabilitySlots: true } },
} satisfies Prisma.ProviderInclude;

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function profileData(profile: ProviderProfileInput) {
  return {
    specialization: clean(profile.specialization),
    licenseNumber: clean(profile.licenseNumber),
    phone: clean(profile.phone),
    officeLocation: clean(profile.officeLocation),
    bio: clean(profile.bio),
    appointmentLength: profile.appointmentLength,
    bufferTime: profile.bufferTime,
  };
}

function friendlyWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new Error("An account with this email already exists. Use a different email address.");
  }
  throw error;
}

export class ProviderService {
  async listProviders({ includeInactive = false }: { includeInactive?: boolean } = {}) {
    return prisma.provider.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: providerInclude,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  async getProvider(id: string) {
    return prisma.provider.findUnique({ where: { id }, include: providerInclude });
  }

  async createProvider(input: CreateProviderInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new Error("An account with this email already exists. Use a different email address.");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    try {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            passwordHash,
            role: "PROVIDER",
            isActive: true,
          },
        });

        return tx.provider.create({
          data: {
            userId: user.id,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            title: clean(input.title),
            isActive: true,
            profile: { create: profileData(input.profile) },
          },
          include: providerInclude,
        });
      });
    } catch (error) {
      friendlyWriteError(error);
    }
  }

  async updateProvider(input: UpdateProviderInput) {
    const existing = await prisma.provider.findUnique({
      where: { id: input.id },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!existing) {
      throw new Error("Provider not found");
    }

    if (input.email !== existing.user.email) {
      const taken = await prisma.user.findUnique({ where: { email: input.email } });
      if (taken && taken.id !== existing.userId) {
        throw new Error("An account with this email already exists. Use a different email address.");
      }
    }

    const passwordHash = input.password
      ? await bcrypt.hash(input.password, BCRYPT_ROUNDS)
      : undefined;

    try {
      return await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            email: input.email,
            ...(passwordHash ? { passwordHash } : {}),
          },
        });

        const data = profileData(input.profile);
        return tx.provider.update({
          where: { id: input.id },
          data: {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            title: clean(input.title),
            profile: { upsert: { create: data, update: data } },
          },
          include: providerInclude,
        });
      });
    } catch (error) {
      friendlyWriteError(error);
    }
  }

  /**
   * Activate or deactivate a provider.
   *
   * Deactivation also disables their login, and is refused while they still
   * have open appointments - those would otherwise be stranded with a provider
   * who can't sign in to see them.
   */
  async setProviderActive(id: string, isActive: boolean) {
    const provider = await prisma.provider.findUnique({ where: { id }, select: { userId: true } });
    if (!provider) {
      throw new Error("Provider not found");
    }

    if (!isActive) {
      const open = await prisma.appointment.count({
        where: { providerId: id, status: { in: [...OPEN_STATUSES] } },
      });
      if (open > 0) {
        throw new Error(
          `This provider has ${open} open appointment(s). Cancel, complete or reassign them before deactivating.`
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: provider.userId },
        data: { isActive, deletedAt: isActive ? null : new Date() },
      });
      return tx.provider.update({
        where: { id },
        data: { isActive, deletedAt: isActive ? null : new Date() },
        include: providerInclude,
      });
    });
  }
}

export const providerService = new ProviderService();
