import { prisma } from "@/lib/prisma";
import type { Patient, Appointment } from "@prisma/client";

/**
 * Patient Service Layer
 * 
 * Handles all business logic for patient management
 * Separated from authorization - call with pre-authorized data
 */

export class PatientService {
  /**
   * Create a new patient
   */
  async createPatient(input: {
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
  }): Promise<Patient> {
    // Check for duplicate email
    if (input.email) {
      const existingByEmail = await prisma.patient.findUnique({
        where: { email: input.email },
      });
      if (existingByEmail && existingByEmail.isActive) {
        throw new Error(
          "A patient with this email already exists. Please use a different email address."
        );
      }
    }

    // Check for duplicate phone
    if (input.phone) {
      const existingByPhone = await prisma.patient.findUnique({
        where: { phone: input.phone },
      });
      if (existingByPhone && existingByPhone.isActive) {
        throw new Error(
          "A patient with this phone number already exists. Please use a different phone number."
        );
      }
    }

    const patient = await prisma.patient.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        dateOfBirth: input.dateOfBirth || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        zipCode: input.zipCode || null,
        emergencyContactName: input.emergencyContactName || null,
        emergencyContactPhone: input.emergencyContactPhone || null,
        insuranceProvider: input.insuranceProvider || null,
        insuranceId: input.insuranceId || null,
        allergies: input.allergies || null,
        medications: input.medications || null,
        medicalHistory: input.medicalHistory || null,
        isActive: true,
      },
    });

    return patient;
  }

  /**
   * Update an existing patient
   */
  async updatePatient(
    patientId: string,
    input: {
      firstName?: string;
      lastName?: string;
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
    }
  ): Promise<Patient> {
    // Verify patient exists
    const existingPatient = await this.getPatientById(patientId);
    if (!existingPatient) {
      throw new Error("Patient not found");
    }

    // Check for duplicate email (excluding current patient)
    if (input.email && input.email !== existingPatient.email) {
      const duplicateEmail = await prisma.patient.findUnique({
        where: { email: input.email },
      });
      if (duplicateEmail && duplicateEmail.id !== patientId && duplicateEmail.isActive) {
        throw new Error(
          "A patient with this email already exists. Please use a different email address."
        );
      }
    }

    // Check for duplicate phone (excluding current patient)
    if (input.phone && input.phone !== existingPatient.phone) {
      const duplicatePhone = await prisma.patient.findUnique({
        where: { phone: input.phone },
      });
      if (duplicatePhone && duplicatePhone.id !== patientId && duplicatePhone.isActive) {
        throw new Error(
          "A patient with this phone number already exists. Please use a different phone number."
        );
      }
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(input.firstName !== undefined && { firstName: input.firstName }),
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.phone !== undefined && { phone: input.phone || null }),
        ...(input.dateOfBirth !== undefined && { dateOfBirth: input.dateOfBirth || null }),
        ...(input.address !== undefined && { address: input.address || null }),
        ...(input.city !== undefined && { city: input.city || null }),
        ...(input.state !== undefined && { state: input.state || null }),
        ...(input.zipCode !== undefined && { zipCode: input.zipCode || null }),
        ...(input.emergencyContactName !== undefined && {
          emergencyContactName: input.emergencyContactName || null,
        }),
        ...(input.emergencyContactPhone !== undefined && {
          emergencyContactPhone: input.emergencyContactPhone || null,
        }),
        ...(input.insuranceProvider !== undefined && {
          insuranceProvider: input.insuranceProvider || null,
        }),
        ...(input.insuranceId !== undefined && { insuranceId: input.insuranceId || null }),
        ...(input.allergies !== undefined && { allergies: input.allergies || null }),
        ...(input.medications !== undefined && { medications: input.medications || null }),
        ...(input.medicalHistory !== undefined && {
          medicalHistory: input.medicalHistory || null,
        }),
      },
    });

    return updated;
  }

  /**
   * Soft delete a patient (set isActive to false)
   */
  async deletePatient(patientId: string): Promise<Patient> {
    const patient = await this.getPatientById(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Check if patient has future appointments
    const futureAppointments = await prisma.appointment.count({
      where: {
        patientId,
        scheduledAt: {
          gte: new Date(),
        },
        status: {
          in: ["REQUESTED", "CONFIRMED", "CHECKED_IN"],
        },
      },
    });

    if (futureAppointments > 0) {
      throw new Error(
        `Cannot delete patient with ${futureAppointments} upcoming appointment(s). Please cancel or complete the appointments first.`
      );
    }

    const deleted = await prisma.patient.update({
      where: { id: patientId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return deleted;
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
   * Search patients with pagination
   */
  async searchPatients(params: {
    query?: string;
    page?: number;
    pageSize?: number;
    includeInactive?: boolean;
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

    const whereClause: any = {};

    // Filter by active status
    if (!params.includeInactive) {
      whereClause.isActive = true;
    }

    // Search query
    if (params.query && params.query.trim()) {
      whereClause.OR = [
        { firstName: { contains: params.query, mode: "insensitive" } },
        { lastName: { contains: params.query, mode: "insensitive" } },
        { email: { contains: params.query, mode: "insensitive" } },
        { phone: { contains: params.query, mode: "insensitive" } },
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

    const totalPages = Math.ceil(total / pageSize);

    return {
      patients,
      total,
      page,
      pageSize,
      totalPages,
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
