// scripts/changeAdminCredentials.js

import 'dotenv/config';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const targetUsername = args[0] || process.env.ADMIN_USERNAME || 'admin';
  const newPassword = args[1] || process.env.ADMIN_NEW_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
  const newEmail = args[2] || process.env.ADMIN_EMAIL;

  if (!newPassword && !newEmail) {
    console.error('❌ Usage: node scripts/changeAdminCredentials.js <username> <newPassword> [newEmail]');
    console.error('   Or set ADMIN_NEW_PASSWORD and ADMIN_EMAIL in your .env file.');
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({
    where: { username: targetUsername },
  });

  if (!existing) {
    console.error(`❌ Admin with username "${targetUsername}" not found in database.`);
    process.exit(1);
  }

  const updateData = {};
  if (newPassword) {
    if (newPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters long.');
      process.exit(1);
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (newEmail) {
    updateData.email = newEmail.trim().toLowerCase();
  }

  const updated = await prisma.admin.update({
    where: { username: targetUsername },
    data: updateData,
  });

  console.log('✅ Admin credentials updated successfully:');
  console.log(`   Username : ${updated.username}`);
  console.log(`   Email    : ${updated.email}`);
  if (newPassword) {
    console.log(`   Password : [UPDATED TO NEW PASSWORD]`);
  }
}

main()
  .catch((err) => {
    console.error('Failed to update admin credentials:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
