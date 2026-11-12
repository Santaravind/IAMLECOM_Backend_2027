// scripts/createAdmin.js

import 'dotenv/config';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || 'ChangeThisPassword!';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const updateData = {};
  if (process.env.ADMIN_INITIAL_PASSWORD) {
    updateData.passwordHash = passwordHash;
  }
  if (process.env.ADMIN_EMAIL) {
    updateData.email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  }

  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: updateData,
    create: {
      username: 'admin',
      passwordHash,
      fullName: 'Dr. Murali Manohar Yadav',
      email: process.env.ADMIN_EMAIL || 'iamlecon2027@gmail.com',
      role: 'super_admin',
    },
  });

  console.log('✅ Admin account configured successfully:');
  console.log(`   Username : ${admin.username}`);
  console.log(`   Role     : ${admin.role}`);
  console.log(`   Email    : ${admin.email}`);
  console.log(`   Password : ${defaultPassword}`);
}

main()
  .catch((err) => {
    console.error('Failed to create admin:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

