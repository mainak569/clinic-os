/**
 * Foreign Key Integrity Check and Fix Script
 * 
 * This script checks for and optionally fixes broken foreign key references
 * that may exist after database resets or data migrations.
 * 
 * Usage:
 *   npx tsx scripts/fix-foreign-keys.ts --check     # Just check, don't fix
 *   npx tsx scripts/fix-foreign-keys.ts --fix       # Check and fix issues
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IssueReport {
  invalidHistory: Array<{ id: string; performedBy: string; appointmentId: string }>;
  invalidAppointmentPatients: Array<{ id: string; patientId: string }>;
  invalidAppointmentProviders: Array<{ id: string; providerId: string }>;
}

async function checkForeignKeyIntegrity(): Promise<IssueReport> {
  console.log('🔍 Checking foreign key integrity...\n');
  
  const issues: IssueReport = {
    invalidHistory: [],
    invalidAppointmentPatients: [],
    invalidAppointmentProviders: [],
  };

  // Check 1: AppointmentHistory.performedBy -> User.id
  console.log('1️⃣  Checking AppointmentHistory.performedBy references...');
  const historyWithInvalidUsers = await prisma.$queryRaw<Array<{ id: string; performed_by: string; appointment_id: string }>>`
    SELECT ah.id, ah.performed_by, ah.appointment_id
    FROM appointment_history ah
    LEFT JOIN users u ON ah.performed_by = u.id
    WHERE u.id IS NULL
  `;
  
  issues.invalidHistory = historyWithInvalidUsers.map(h => ({
    id: h.id,
    performedBy: h.performed_by,
    appointmentId: h.appointment_id,
  }));
  
  if (issues.invalidHistory.length > 0) {
    console.log(`   ❌ Found ${issues.invalidHistory.length} history records with invalid user references`);
  } else {
    console.log(`   ✅ All history records have valid user references`);
  }

  // Check 2: Appointment.patientId -> Patient.id
  console.log('\n2️⃣  Checking Appointment.patientId references...');
  const appointmentsWithInvalidPatients = await prisma.$queryRaw<Array<{ id: string; patient_id: string }>>`
    SELECT a.id, a.patient_id
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE p.id IS NULL
  `;
  
  issues.invalidAppointmentPatients = appointmentsWithInvalidPatients.map(a => ({
    id: a.id,
    patientId: a.patient_id,
  }));
  
  if (issues.invalidAppointmentPatients.length > 0) {
    console.log(`   ❌ Found ${issues.invalidAppointmentPatients.length} appointments with invalid patient references`);
  } else {
    console.log(`   ✅ All appointments have valid patient references`);
  }

  // Check 3: Appointment.providerId -> Provider.id
  console.log('\n3️⃣  Checking Appointment.providerId references...');
  const appointmentsWithInvalidProviders = await prisma.$queryRaw<Array<{ id: string; provider_id: string }>>`
    SELECT a.id, a.provider_id
    FROM appointments a
    LEFT JOIN providers p ON a.provider_id = p.id
    WHERE p.id IS NULL
  `;
  
  issues.invalidAppointmentProviders = appointmentsWithInvalidProviders.map(a => ({
    id: a.id,
    providerId: a.provider_id,
  }));
  
  if (issues.invalidAppointmentProviders.length > 0) {
    console.log(`   ❌ Found ${issues.invalidAppointmentProviders.length} appointments with invalid provider references`);
  } else {
    console.log(`   ✅ All appointments have valid provider references`);
  }

  return issues;
}

async function fixIssues(issues: IssueReport): Promise<void> {
  console.log('\n🔧 Fixing issues...\n');
  
  let fixed = 0;

  // Fix 1: Delete orphaned history records
  if (issues.invalidHistory.length > 0) {
    console.log(`Deleting ${issues.invalidHistory.length} orphaned history records...`);
    const deleteResult = await prisma.appointmentHistory.deleteMany({
      where: {
        id: { in: issues.invalidHistory.map(h => h.id) },
      },
    });
    console.log(`   ✅ Deleted ${deleteResult.count} history records`);
    fixed += deleteResult.count;
  }

  // Fix 2: Delete appointments with invalid patients
  if (issues.invalidAppointmentPatients.length > 0) {
    console.log(`\nDeleting ${issues.invalidAppointmentPatients.length} appointments with invalid patients...`);
    const deleteResult = await prisma.appointment.deleteMany({
      where: {
        id: { in: issues.invalidAppointmentPatients.map(a => a.id) },
      },
    });
    console.log(`   ✅ Deleted ${deleteResult.count} appointments`);
    fixed += deleteResult.count;
  }

  // Fix 3: Delete appointments with invalid providers
  if (issues.invalidAppointmentProviders.length > 0) {
    console.log(`\nDeleting ${issues.invalidAppointmentProviders.length} appointments with invalid providers...`);
    const deleteResult = await prisma.appointment.deleteMany({
      where: {
        id: { in: issues.invalidAppointmentProviders.map(a => a.id) },
      },
    });
    console.log(`   ✅ Deleted ${deleteResult.count} appointments`);
    fixed += deleteResult.count;
  }

  console.log(`\n✨ Fixed ${fixed} issues total`);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const shouldCheck = args.includes('--check') || args.length === 0;

  if (!shouldCheck && !shouldFix) {
    console.log('Usage:');
    console.log('  npx tsx scripts/fix-foreign-keys.ts --check     # Just check');
    console.log('  npx tsx scripts/fix-foreign-keys.ts --fix       # Check and fix');
    process.exit(1);
  }

  const issues = await checkForeignKeyIntegrity();

  const totalIssues = 
    issues.invalidHistory.length + 
    issues.invalidAppointmentPatients.length + 
    issues.invalidAppointmentProviders.length;

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Orphaned history records:              ${issues.invalidHistory.length}`);
  console.log(`Appointments with invalid patients:    ${issues.invalidAppointmentPatients.length}`);
  console.log(`Appointments with invalid providers:   ${issues.invalidAppointmentProviders.length}`);
  console.log(`Total issues:                          ${totalIssues}`);
  console.log('='.repeat(70));

  if (totalIssues === 0) {
    console.log('\n✅ All foreign key references are valid! No action needed.');
    process.exit(0);
  }

  if (shouldFix) {
    console.log('\n⚠️  Running in FIX mode - will delete orphaned records');
    await fixIssues(issues);
    
    // Verify fixes
    console.log('\n🔍 Verifying fixes...');
    const remaining = await checkForeignKeyIntegrity();
    const remainingTotal = 
      remaining.invalidHistory.length + 
      remaining.invalidAppointmentPatients.length + 
      remaining.invalidAppointmentProviders.length;
    
    if (remainingTotal === 0) {
      console.log('\n✅ All issues resolved!');
    } else {
      console.log(`\n⚠️  ${remainingTotal} issues remain. Manual intervention may be needed.`);
    }
  } else {
    console.log('\n💡 Run with --fix to automatically delete orphaned records');
    console.log('   Example: npx tsx scripts/fix-foreign-keys.ts --fix');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
