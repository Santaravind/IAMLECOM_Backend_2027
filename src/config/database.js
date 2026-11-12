// src/config/database.js

import 'dotenv/config';
import dns from 'dns';
import { PrismaClient } from '@prisma/client';

// Ensure IPv4 is prioritized for database cloud hostnames
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

