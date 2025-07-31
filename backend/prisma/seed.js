// Seed script for Prisma
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  // 1. Delete all data in the correct order (respecting FK constraints)
  await prisma.studentActivity.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.freePractice.deleteMany();
  await prisma.testSeries.deleteMany();
  await prisma.question.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.Activity.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create only admin user for login
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin User',
      email: 'admin@placeprep.com',
      password: adminPassword,
      role: 'admin',
    },
  });

  console.log('Admin user created:', admin.email);
  console.log('Email: admin@placeprep.com');
  console.log('Password: admin123');
  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 