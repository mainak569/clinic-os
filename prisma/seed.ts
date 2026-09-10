import { PrismaClient, Role, AppointmentStatus, DayOfWeek, AppointmentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================================
  // USERS & AUTHENTICATION
  // ============================================================================
  
  console.log('👤 Creating users...');
  
  // Front desk user
  await prisma.user.create({
    data: {
      email: 'frontdesk@clinicos.com',
      passwordHash: await bcrypt.hash('FrontDesk123!', 12),
      role: Role.FRONT_DESK,
      lastLogin: new Date(),
    },
  });

  // Provider users
  const drSmithUser = await prisma.user.create({
    data: {
      email: 'dr.smith@clinicos.com',
      passwordHash: await bcrypt.hash('DrSmith123!', 12),
      role: Role.PROVIDER,
      lastLogin: new Date(),
    },
  });

  const drJohnsonUser = await prisma.user.create({
    data: {
      email: 'dr.johnson@clinicos.com',
      passwordHash: await bcrypt.hash('DrJohnson123!', 12),
      role: Role.PROVIDER,
      lastLogin: new Date(),
    },
  });

  console.log(`✅ Created ${3} users`);

  // ============================================================================
  // PROVIDERS & PROFILES
  // ============================================================================
  
  console.log('👩‍⚕️ Creating providers...');

  // Dr. Sarah Smith - Family Medicine
  const drSmith = await prisma.provider.create({
    data: {
      userId: drSmithUser.id,
      firstName: 'Sarah',
      lastName: 'Smith',
      title: 'Dr.',
      profile: {
        create: {
          specialization: 'Family Medicine',
          licenseNumber: 'MD12345',
          phone: '(555) 123-4567',
          officeLocation: 'Room 101',
          bio: 'Dr. Sarah Smith is a board-certified family medicine physician with over 10 years of experience providing comprehensive healthcare to patients of all ages.',
          appointmentLength: 30,
          bufferTime: 15,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  // Dr. Michael Johnson - Internal Medicine
  const drJohnson = await prisma.provider.create({
    data: {
      userId: drJohnsonUser.id,
      firstName: 'Michael',
      lastName: 'Johnson',
      title: 'Dr.',
      profile: {
        create: {
          specialization: 'Internal Medicine',
          licenseNumber: 'MD67890',
          phone: '(555) 234-5678',
          officeLocation: 'Room 102',
          bio: 'Dr. Michael Johnson specializes in internal medicine with a focus on preventive care and chronic disease management.',
          appointmentLength: 45,
          bufferTime: 15,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  console.log(`✅ Created ${2} providers`);

  // ============================================================================
  // AVAILABILITY SLOTS
  // ============================================================================
  
  console.log('📅 Creating availability slots...');

  // Dr. Smith's availability - Monday to Friday, 9 AM to 5 PM
  const drSmithSlots = [];
  const weekdays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
  
  for (const day of weekdays) {
    // Morning session: 9:00 AM - 12:00 PM
    drSmithSlots.push({
      providerId: drSmith.id,
      dayOfWeek: day,
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T12:00:00Z'),
    });
    
    // Afternoon session: 1:00 PM - 5:00 PM
    drSmithSlots.push({
      providerId: drSmith.id,
      dayOfWeek: day,
      startTime: new Date('2024-01-01T13:00:00Z'),
      endTime: new Date('2024-01-01T17:00:00Z'),
    });
  }

  await prisma.availabilitySlot.createMany({
    data: drSmithSlots,
  });

  // Dr. Johnson's availability - Monday to Thursday, 8 AM to 4 PM
  const drJohnsonSlots = [];
  const drJohnsonDays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY];
  
  for (const day of drJohnsonDays) {
    // Morning session: 8:00 AM - 12:00 PM
    drJohnsonSlots.push({
      providerId: drJohnson.id,
      dayOfWeek: day,
      startTime: new Date('2024-01-01T08:00:00Z'),
      endTime: new Date('2024-01-01T12:00:00Z'),
    });
    
    // Afternoon session: 1:00 PM - 4:00 PM
    drJohnsonSlots.push({
      providerId: drJohnson.id,
      dayOfWeek: day,
      startTime: new Date('2024-01-01T13:00:00Z'),
      endTime: new Date('2024-01-01T16:00:00Z'),
    });
  }

  await prisma.availabilitySlot.createMany({
    data: drJohnsonSlots,
  });

  console.log(`✅ Created ${drSmithSlots.length + drJohnsonSlots.length} availability slots`);

  // ============================================================================
  // SAMPLE PATIENTS
  // ============================================================================
  
  console.log('🏥 Creating sample patients...');

  const patients = await prisma.patient.createMany({
    data: [
      {
        firstName: 'John',
        lastName: 'Davis',
        email: 'john.davis@email.com',
        phone: '(555) 111-2222',
        dateOfBirth: new Date('1985-03-15'),
        address: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        emergencyContactName: 'Jane Davis',
        emergencyContactPhone: '(555) 111-3333',
        insuranceProvider: 'Blue Cross Blue Shield',
        insuranceId: 'BC123456789',
        allergies: 'Penicillin',
        medications: 'Lisinopril 10mg daily',
        medicalHistory: 'Hypertension, Type 2 Diabetes',
      },
      {
        firstName: 'Mary',
        lastName: 'Wilson',
        email: 'mary.wilson@email.com',
        phone: '(555) 222-3333',
        dateOfBirth: new Date('1992-07-22'),
        address: '456 Oak Avenue',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702',
        emergencyContactName: 'Robert Wilson',
        emergencyContactPhone: '(555) 222-4444',
        insuranceProvider: 'Aetna',
        insuranceId: 'AET987654321',
        allergies: 'None known',
        medications: 'Birth control pill',
        medicalHistory: 'Annual wellness visits',
      },
      {
        firstName: 'Robert',
        lastName: 'Brown',
        email: 'robert.brown@email.com',
        phone: '(555) 333-4444',
        dateOfBirth: new Date('1960-12-08'),
        address: '789 Pine Street',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62703',
        emergencyContactName: 'Susan Brown',
        emergencyContactPhone: '(555) 333-5555',
        insuranceProvider: 'Medicare',
        insuranceId: 'MED456789123',
        allergies: 'Sulfa drugs',
        medications: 'Metformin 500mg twice daily, Atorvastatin 20mg daily',
        medicalHistory: 'Type 2 Diabetes, Hyperlipidemia, History of MI',
      },
      {
        firstName: 'Emily',
        lastName: 'Chen',
        email: 'emily.chen@email.com',
        phone: '(555) 444-5555',
        dateOfBirth: new Date('1988-09-30'),
        address: '321 Elm Drive',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
        emergencyContactName: 'David Chen',
        emergencyContactPhone: '(555) 444-6666',
        insuranceProvider: 'United Healthcare',
        insuranceId: 'UHC789123456',
        allergies: 'Shellfish',
        medications: 'None',
        medicalHistory: 'Seasonal allergies',
      },
      {
        firstName: 'James',
        lastName: 'Garcia',
        email: 'james.garcia@email.com',
        phone: '(555) 555-6666',
        dateOfBirth: new Date('1995-04-12'),
        address: '654 Maple Lane',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62705',
        emergencyContactName: 'Maria Garcia',
        emergencyContactPhone: '(555) 555-7777',
        insuranceProvider: 'Cigna',
        insuranceId: 'CIG123789456',
        allergies: 'None known',
        medications: 'None',
        medicalHistory: 'Healthy young adult',
      },
    ],
  });

  console.log(`✅ Created ${patients.count} patients`);

  // Get created patients for appointments
  const createdPatients = await prisma.patient.findMany({
    take: 5,
  });

  // ============================================================================
  // SAMPLE APPOINTMENTS
  // ============================================================================
  
  console.log('📋 Creating sample appointments...');

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const appointments = await prisma.appointment.createMany({
    data: [
      // Today's appointments
      {
        patientId: createdPatients[0].id,
        providerId: drSmith.id,
        scheduledAt: new Date(now.setHours(10, 0, 0, 0)),
        duration: 30,
        type: AppointmentType.FOLLOW_UP,
        status: AppointmentStatus.CONFIRMED,
        reason: 'Diabetes follow-up',
        notes: 'Check blood sugar levels and medication adjustment',
        cost: 150.00,
      },
      {
        patientId: createdPatients[1].id,
        providerId: drJohnson.id,
        scheduledAt: new Date(now.setHours(11, 0, 0, 0)),
        duration: 45,
        type: AppointmentType.NEW_PATIENT,
        status: AppointmentStatus.CHECKED_IN,
        reason: 'Annual physical',
        notes: 'New patient annual wellness visit',
        cost: 250.00,
        checkedInAt: new Date(),
      },
      
      // Tomorrow's appointments
      {
        patientId: createdPatients[2].id,
        providerId: drSmith.id,
        scheduledAt: new Date(tomorrow.setHours(9, 30, 0, 0)),
        duration: 30,
        type: AppointmentType.FOLLOW_UP,
        status: AppointmentStatus.CONFIRMED,
        reason: 'Medication review',
        notes: 'Review current medications and side effects',
        cost: 125.00,
      },
      {
        patientId: createdPatients[3].id,
        providerId: drJohnson.id,
        scheduledAt: new Date(tomorrow.setHours(14, 0, 0, 0)),
        duration: 30,
        type: AppointmentType.CONSULTATION,
        status: AppointmentStatus.REQUESTED,
        reason: 'Allergy consultation',
        notes: 'Patient experiencing seasonal allergies',
        cost: 175.00,
      },
      
      // Next week's appointment
      {
        patientId: createdPatients[4].id,
        providerId: drSmith.id,
        scheduledAt: new Date(nextWeek.setHours(15, 0, 0, 0)),
        duration: 30,
        type: AppointmentType.NEW_PATIENT,
        status: AppointmentStatus.CONFIRMED,
        reason: 'Wellness visit',
        notes: 'First-time visit for healthy young adult',
        cost: 200.00,
      },
    ],
  });

  console.log(`✅ Created ${appointments.count} appointments`);

  // ============================================================================
  // SAMPLE VISIT NOTES
  // ============================================================================
  
  console.log('📝 Creating sample visit notes...');

  const completedAppointments = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.CHECKED_IN,
    },
    take: 1,
  });

  if (completedAppointments.length > 0) {
    // Get provider from the completed appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: completedAppointments[0].id },
      include: { provider: true },
    });
    
    if (appointment) {
      await prisma.visitNote.create({
        data: {
          appointmentId: completedAppointments[0].id,
          authorId: appointment.provider.userId,
          chiefComplaint: 'Annual physical examination',
          historyOfPresent: 'Patient reports feeling well overall. No acute concerns.',
          physicalExam: 'Well-appearing adult. HEENT normal, CV regular rate and rhythm, lungs clear, abdomen soft.',
          assessment: 'Healthy adult female, age 31',
          plan: 'Continue current lifestyle. Return in 1 year for annual physical.',
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 98.6,
          respiratoryRate: 16,
          oxygenSaturation: 99,
          weight: 135.5,
          height: 65.0,
          followUpInstructions: 'Continue healthy diet and exercise. Schedule mammogram.',
          nextVisitDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        },
      });

      console.log('✅ Created 1 visit note');
    }
  }

  // ============================================================================
  // SAMPLE ALERTS
  // ============================================================================
  
  console.log('🔔 Creating sample alerts...');

  await prisma.alert.createMany({
    data: [
      {
        providerId: drSmith.id,
        type: 'APPOINTMENT_REMINDER',
        priority: 'MEDIUM',
        title: 'Upcoming Appointment',
        message: 'John Davis has an appointment in 30 minutes (10:00 AM)',
      },
      {
        providerId: drJohnson.id,
        type: 'LAB_RESULTS',
        priority: 'HIGH',
        title: 'Lab Results Available',
        message: 'Blood work results are ready for Mary Wilson',
      },
      {
        type: 'SYSTEM_MESSAGE',
        priority: 'LOW',
        title: 'System Maintenance',
        message: 'Scheduled maintenance tonight from 11 PM - 1 AM EST',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    ],
  });

  console.log('✅ Created 3 alerts');

  console.log('🎉 Database seeding completed successfully!');
  
  // Print summary
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.provider.count(),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.visitNote.count(),
    prisma.alert.count(),
    prisma.availabilitySlot.count(),
  ]);

  console.log('\n📊 Seeding Summary:');
  console.log(`   Users: ${counts[0]}`);
  console.log(`   Providers: ${counts[1]}`);
  console.log(`   Patients: ${counts[2]}`);
  console.log(`   Appointments: ${counts[3]}`);
  console.log(`   Visit Notes: ${counts[4]}`);
  console.log(`   Alerts: ${counts[5]}`);
  console.log(`   Availability Slots: ${counts[6]}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });