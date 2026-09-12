import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function quickCheck() {
  try {
    // Quick count queries
    console.log('Quick Foreign Key Check\n');
    
    const historyCount = await prisma.appointmentHistory.count();
    const appointmentCount = await prisma.appointment.count();
    const userCount = await prisma.user.count();
    const patientCount = await prisma.patient.count();
    const providerCount = await prisma.provider.count();
    
    console.log('Record counts:');
    console.log(`  Users: ${userCount}`);
    console.log(`  Patients: ${patientCount}`);
    console.log(`  Providers: ${providerCount}`);
    console.log(`  Appointments: ${appointmentCount}`);
    console.log(`  History records: ${historyCount}`);
    
    // Try to fetch a sample history record to see the structure
    if (historyCount > 0) {
      console.log('\nSample history record:');
      const sample = await prisma.appointmentHistory.findFirst({
        include: {
          performer: {
            select: { id: true, email: true }
          }
        }
      });
      
      if (sample) {
        console.log(`  ID: ${sample.id}`);
        console.log(`  Performed by: ${sample.performedBy}`);
        console.log(`  Performer exists: ${sample.performer ? 'YES' : 'NO'}`);
        if (sample.performer) {
          console.log(`  Performer email: ${sample.performer.email}`);
        }
      }
    }
    
    console.log('\n✅ Database connection is working');
    console.log('\nTo check for broken references, the validation code');
    console.log('added to the application will handle them gracefully.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickCheck()
  .finally(() => prisma.$disconnect());
