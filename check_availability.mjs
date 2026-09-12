import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Checking providers and their availability slots...\n');
  
  const providers = await prisma.provider.findMany({
    include: {
      availabilitySlots: {
        where: {
          isActive: true
        }
      }
    }
  });
  
  providers.forEach(provider => {
    console.log(`\nProvider: ${provider.firstName} ${provider.lastName} (${provider.id})`);
    console.log(`Slots: ${provider.availabilitySlots.length}`);
    
    provider.availabilitySlots.forEach(slot => {
      console.log(`  - ${slot.dayOfWeek}: ${slot.startTime.toISOString()} to ${slot.endTime.toISOString()}`);
      console.log(`    Hours (UTC): ${slot.startTime.getUTCHours()}:${slot.startTime.getUTCMinutes().toString().padStart(2, '0')} to ${slot.endTime.getUTCHours()}:${slot.endTime.getUTCMinutes().toString().padStart(2, '0')}`);
      console.log(`    Hours (Local): ${slot.startTime.getHours()}:${slot.startTime.getMinutes().toString().padStart(2, '0')} to ${slot.endTime.getHours()}:${slot.endTime.getMinutes().toString().padStart(2, '0')}`);
    });
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
