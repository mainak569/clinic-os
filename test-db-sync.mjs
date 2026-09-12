import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: ['error'] });

async function testSync() {
  console.log('Testing database sync...\n');
  
  try {
    // Test 1: Can we connect?
    await prisma.$connect();
    console.log('✅ Database connection: OK');
    
    // Test 2: Can we query basic tables?
    const userCount = await prisma.user.count();
    console.log(`✅ Users table: OK (${userCount} records)`);
    
    const patientCount = await prisma.patient.count();
    console.log(`✅ Patients table: OK (${patientCount} records)`);
    
    const providerCount = await prisma.provider.count();
    console.log(`✅ Providers table: OK (${providerCount} records)`);
    
    const appointmentCount = await prisma.appointment.count();
    console.log(`✅ Appointments table: OK (${appointmentCount} records)`);
    
    const availabilityCount = await prisma.availabilitySlot.count();
    console.log(`✅ Availability slots table: OK (${availabilityCount} records)`);
    
    // Test 3: Can we query with relations?
    const appointmentWithRelations = await prisma.appointment.findFirst({
      include: {
        patient: true,
        provider: true,
      }
    });
    console.log(`✅ Relationships: OK`);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE IS FULLY SYNCED AND WORKING!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n⚠️  Database might not be fully synced.');
    console.log('Run: npx prisma db push');
  }
}

testSync()
  .finally(() => prisma.$disconnect());
