import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkForeignKeyIntegrity() {
  console.log('Checking foreign key integrity...\n');
  
  // Check AppointmentHistory records
  console.log('1. Checking AppointmentHistory.performedBy references...');
  const historyRecords = await prisma.appointmentHistory.findMany({
    select: {
      id: true,
      performedBy: true,
      appointmentId: true,
      action: true,
      performedAt: true,
    }
  });
  
  console.log(`   Found ${historyRecords.length} history records`);
  
  const invalidHistory = [];
  for (const record of historyRecords) {
    const userExists = await prisma.user.findUnique({
      where: { id: record.performedBy }
    });
    
    if (!userExists) {
      invalidHistory.push(record);
    }
  }
  
  if (invalidHistory.length > 0) {
    console.log(`   ❌ Found ${invalidHistory.length} records with invalid performedBy references:`);
    invalidHistory.forEach(r => {
      console.log(`      - History ID: ${r.id}, performedBy: ${r.performedBy}, action: ${r.action}`);
    });
  } else {
    console.log(`   ✅ All history records have valid user references`);
  }
  
  // Check Appointments
  console.log('\n2. Checking Appointment.patientId references...');
  const appointments = await prisma.appointment.findMany({
    select: { id: true, patientId: true }
  });
  
  const invalidPatients = [];
  for (const appt of appointments) {
    const patientExists = await prisma.patient.findUnique({
      where: { id: appt.patientId }
    });
    if (!patientExists) {
      invalidPatients.push(appt);
    }
  }
  
  if (invalidPatients.length > 0) {
    console.log(`   ❌ Found ${invalidPatients.length} appointments with invalid patient references`);
  } else {
    console.log(`   ✅ All appointments have valid patient references`);
  }
  
  // Check Appointments.providerId
  console.log('\n3. Checking Appointment.providerId references...');
  const invalidProviders = [];
  for (const appt of appointments) {
    const providerExists = await prisma.provider.findUnique({
      where: { id: appt.providerId }
    });
    if (!providerExists) {
      invalidProviders.push(appt);
    }
  }
  
  if (invalidProviders.length > 0) {
    console.log(`   ❌ Found ${invalidProviders.length} appointments with invalid provider references`);
  } else {
    console.log(`   ✅ All appointments have valid provider references`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Total appointments: ${appointments.length}`);
  console.log(`Total history records: ${historyRecords.length}`);
  console.log(`Invalid history.performedBy: ${invalidHistory.length}`);
  console.log(`Invalid appointment.patientId: ${invalidPatients.length}`);
  console.log(`Invalid appointment.providerId: ${invalidProviders.length}`);
  
  const totalIssues = invalidHistory.length + invalidPatients.length + invalidProviders.length;
  
  if (totalIssues > 0) {
    console.log(`\n⚠️  Total issues found: ${totalIssues}`);
    console.log('\nRecommendation: These records need to be cleaned up.');
    return { hasIssues: true, invalidHistory, invalidPatients, invalidProviders };
  } else {
    console.log('\n✅ All foreign key references are valid!');
    return { hasIssues: false };
  }
}

checkForeignKeyIntegrity()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
