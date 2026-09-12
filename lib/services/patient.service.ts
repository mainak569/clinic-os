import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Patient, Appointment } from "@prisma/client";

/**
 * Patient Service Layer
 *
 * Handles all business logic for patient management.
 * Separated from authorization - call with pre-authorized data.
 *
 * Consistency rules enforced here:
 *  - Email is stored trimmed and lower-cased, so "John@X.com" and "john@x.com"
 *    are the same patient (the database unique index is case-sensitive).
 *  - Deleting a patient is a soft delete that keeps their email and phone,
 *    and those columns are unique. Registering the same person again used to
 *    pass the service check and then fail with a raw database error. Now the
 *    archived record is restored with the new details, keeping their history.
 */

type PatientFields = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  insuranceProvider?: string | null;
  insuranceId?: string | null;
  allergies?: string | null;
  medications?: string | null;
  medicalHistory?: string | null;
};

const OPEN_STATUSES = ["REQUESTED", "CONFIRMED", "CHECKED_IN"] as const;

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value: string | null | undefined): string | null {
  return clean(value)?.toLowerCase() ?? null;
}

function toData(input: PatientFields) {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizeEmail(input.email),
    phone: clean(input.phone),
    dateOfBirth: input.dateOfBirth || null,
    address: clean(input.address),
    city: clean(input.city),
    state: clean(input.state)?.toUpperCase() ?? null,
    zipCode: clean(input.zipCode),
    emergencyContactName: clean(input.emergencyContactName),
    emergencyContactPhone: clean(input.emergencyContactPhone),
    insuranceProvider: clean(input.insuranceProvider),
    insuranceId: clean(input.insuranceId),
    allergies: clean(input.allergies),
    medications: clean(input.medications),
    medicalHistory: clean(input.medicalHistory),
  };
}

/** Turn a unique-constraint violation into a message a person can act on. */
function friendlyWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = String((error.meta as { target?: unknown })?.target ?? "");
    if (target.includes("email")) {
      throw new Error("A patient with this email already exists. Please use a different email address.");
    }
    if (target.includes("phone")) {
      throw new Error("A patient with this phone number already exists. Please use a different phone number.");
    }
    throw new Error("A patient with these details already exists.");
  }
  throw error;
}

export class PatientService {
  /**
   * Create a new patient.
   *
   * If the email or phone belongs to an archived patient, that record is
   * restored with the submitted details instead of failing on the unique index.
   *
   * @returns the patient, and whether an archived record was restored
   */
  async createPatient(input: PatientFields): Promise<Patient & { restored?: boolean }> {
    const data = toData(input);

    const [byEmail, byPhone] = await Promise.all([
      data.email ? prisma.patient.findUnique({ where: { email: data.email } }) : null,
      data.phone ? prisma.patient.findUnique({ where: { phone: data.phone } }) : null,
    ]);

    if (byEmail?.isActive) {
      throw new Error("A patient with this email already exists. Please use a different email address.");
    }
    if (byPhone?.isActive) {
      throw new Error("A patient with this phone number already exists. Please use a different phone number.");
    }

    const archived = byEmail ?? byPhone;
    if (byEmail && byPhone && byEmail.id !== byPhone.id) {
      throw new Error(
        "This email and phone number belong to two different archived patient records. Use a different email or phone."
      );
    }

    try {
      if (archived) {
        const restored = await prisma.patient.update({
          where: { id: archived.id },
          data: { ...data, isActive: true, deletedAt: null },
        });
        return { ...restored, restored: true };
      }

      return await prisma.patient.create({
        data: { ...data, isActive: true },
      });
    } catch (error) {
      friendlyWriteError(error);
    }
  }

  /**
   * Update an existing patient
   */
  async updatePatient(patientId: string, input: PatientFields): Promise<Patient> {
    const existingPatient = await this.getPatientById(patientId);
    if (!existingPatient) {
      throw new Error("Patient not found");
    }

    const data = toData(input);

    // The unique index covers archived records too, so check every other row.
    if (data.email && data.email !== existingPatient.email) {
      const duplicate = await prisma.patient.findUnique({ where: { email: data.email } });
      if (duplicate && duplicate.id !== patientId) {
        throw new Error(
          duplicate.isActive
            ? "A patient with this email already exists. Please use a different email address."
            : "This email belongs to an archived patient record. Please use a different email address."
        );
      }
    }

    if (data.phone && data.phone !== existingPatient.phone) {
      const duplicate = await prisma.patient.findUnique({ where: { phone: data.phone } });
      if (duplicate && duplicate.id !== patientId) {
        throw new Error(
          duplicate.isActive
            ? "A patient with this phone number already exists. Please use a different phone number."
            : "This phone number belongs to an archived patient record. Please use a different phone number."
        );
      }
    }

    try {
      return await prisma.patient.update({
        where: { id: patientId },
        data,
      });
    } catch (error) {
      friendlyWriteError(error);
    }
  }

  /**
   * Soft delete a patient (set isActive to false)
   *
   * Blocked while the patient has any open appointment - including one whose
   * start time has already passed, such as a patient who is checked in now.
   */
  async deletePatient(patientId: string): Promise<Patient> {
    const patient = await this.getPatientById(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }
    if (!patient.isActive) {
      throw new Error("This patient has already been deleted.");
    }

    const openAppointments = await prisma.appointment.count({
      where: {
        patientId,
        status: { in: [...OPEN_STATUSES] },
      },
    });

    if (openAppointments > 0) {
      throw new Error(
        `Cannot delete patient with ${openAppointments} open appointment(s). Please cancel or complete the appointments first.`
      );
    }

    return prisma.patient.update({
      where: { id: patientId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string): Promise<Patient | null> {
    return prisma.patient.findUnique({
      where: { id: patientId },
    });
  }

  /**
   * Get patient by ID with appointments
   */
  async getPatientWithAppointments(
    patientId: string
  ): Promise<(Patient & { appointments: Appointment[] }) | null> {
    return prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          include: {
            provider: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
          orderBy: {
            scheduledAt: "desc",
          },
        },
      },
    });
  }

  /**
   * Search patients with pagination.
   *
   * `providerId` limits results to patients who have an appointment with that
   * provider. The filter runs in the database: it previously fetched one page
   * of *all* patients and then filtered it in memory, so a provider saw a
   * partial first page, wrong totals, and could never reach later patients.
   */
  async searchPatients(params: {
    query?: string;
    page?: number;
    pageSize?: number;
    includeInactive?: boolean;
    providerId?: string;
  }): Promise<{
    patients: Patient[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const whereClause: Prisma.PatientWhereInput = {};

    if (!params.includeInactive) {
      whereClause.isActive = true;
    }

    if (params.providerId) {
      whereClause.appointments = { some: { providerId: params.providerId } };
    }

    const query = params.query?.trim();
    if (query) {
      whereClause.OR = [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.patient.count({ where: whereClause }),
    ]);

    return {
      patients,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get patient appointment count
   */
  async getPatientAppointmentCount(patientId: string): Promise<number> {
    return prisma.appointment.count({
      where: { patientId },
    });
  }
}

export const patientService = new PatientService();
