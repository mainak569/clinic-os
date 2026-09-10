import { prisma } from './prisma.config';
import bcrypt from 'bcryptjs';

async function testAuth() {
  console.log('Testing authentication...\n');
  
  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
    },
  });
  
  console.log(`Found ${users.length} users:\n`);
  
  for (const user of users) {
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Password hash: ${user.passwordHash.substring(0, 20)}...`);
    
    // Test passwords
    const testPasswords = ['DrSmith123!', 'DrJohnson123!', 'FrontDesk123!'];
    
    for (const pwd of testPasswords) {
      const isValid = await bcrypt.compare(pwd, user.passwordHash);
      if (isValid) {
        console.log(`✅ CORRECT PASSWORD: ${pwd}`);
      }
    }
    console.log('---\n');
  }
  
  await prisma.$disconnect();
}

testAuth();
