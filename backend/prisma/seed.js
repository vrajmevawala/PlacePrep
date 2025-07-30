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
  await prisma.Activity.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed fresh users
  const password1 = await bcrypt.hash('hashedpassword1', 10);
  const user1 = await prisma.user.create({
    data: {
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      password: password1,
      role: 'user',
    },
  });

  const password2 = await bcrypt.hash('hashedpassword2', 10);
  const user2 = await prisma.user.create({
    data: {
      fullName: 'Bob Johnson',
      email: 'bob@example.com',
      password: password2,
      role: 'moderator',
    },
  });

  const password3 = await bcrypt.hash('hashedpassword3', 10);
  const user3 = await prisma.user.create({
    data: {
      fullName: 'Charlie Brown',
      email: 'charlie@example.com', // Use a unique email
      password: password3,
      role: 'user', // or 'admin' if you want this to be the admin
    },
  });

  // 3. Seed Questions
  const question1 = await prisma.question.create({
    data: {
      category: 'Aptitude',
      subcategory: 'Math',
      level: 'easy',
      question: 'What is 2 + 2?',
      options: { a: '3', b: '4', c: '5', d: '6' },
      correctAns: 'b',
      explanation: '2 + 2 = 4',
      createdBy: user1.id,
    },
  });
  const question2 = await prisma.question.create({
    data: {
      category: 'Technical',
      subcategory: 'Programming',
      level: 'medium',
      question: 'What does HTML stand for?',
      options: { a: 'Hyper Trainer Marking Language', b: 'Hyper Text Markup Language', c: 'Hyper Text Marketing Language', d: 'Hyper Text Markup Leveler' },
      correctAns: 'b',
      explanation: 'HTML stands for Hyper Text Markup Language.',
      createdBy: user2.id,
    },
  });
  const question3 = await prisma.question.create({
    data: {
      category: 'Aptitude',
      subcategory: 'Logic',
      level: 'hard',
      question: 'If all bloops are razzies and all razzies are lazzies, are all bloops definitely lazzies?',
      options: { a: 'Yes', b: 'No', c: 'Cannot be determined', d: 'Only sometimes' },
      correctAns: 'a',
      explanation: 'Transitive logic.',
      createdBy: user3.id,
    },
  });

  // 4. Seed TestSeries
  const testSeries1 = await prisma.testSeries.create({
    data: {
      title: 'Aptitude Test 1',
      startTime: new Date(Date.now() + 3600 * 1000),
      endTime: new Date(Date.now() + 7200 * 1000),
      createdBy: user1.id,
      questions: {
        connect: [{ id: question1.id }, { id: question3.id }],
      },
    },
  });
  const testSeries2 = await prisma.testSeries.create({
    data: {
      title: 'Technical Test 1',
      startTime: new Date(Date.now() + 10800 * 1000),
      endTime: new Date(Date.now() + 14400 * 1000),
      createdBy: user2.id,
      questions: {
        connect: [{ id: question2.id }],
      },
    },
  });

  // 5. Seed FreePractice
  const freePractice1 = await prisma.freePractice.create({
    data: {
      title: 'Technical Practice',
      category: 'Technical',
      subcategory: 'Programming',
      level: 'medium',
      startTime: new Date(Date.now() + 3600 * 1000),
      endTime: new Date(Date.now() + 7200 * 1000),
      createdBy: user2.id,
      questions: {
        connect: [{ id: question2.id }],
      },
    },
  });

  // 6. Seed Participation
  await prisma.participation.create({
    data: {
      sid: user1.id,
      practiceTest: true,
      contest: false,
      testSeriesId: testSeries1.id,
      freePracticeId: null,
      startTime: new Date(Date.now() + 3600 * 1000),
      endTime: new Date(Date.now() + 7200 * 1000),
    },
  });
  await prisma.participation.create({
    data: {
      sid: user2.id,
      practiceTest: false,
      contest: true,
      testSeriesId: null,
      freePracticeId: freePractice1.id,
      startTime: new Date(Date.now() + 3600 * 1000),
      endTime: new Date(Date.now() + 7200 * 1000),
    },
  });

  // 7. Seed StudentActivity
  await prisma.studentActivity.create({
    data: {
      sid: user1.id,
      qid: question1.id,
      time: new Date(),
    },
  });
  await prisma.studentActivity.create({
    data: {
      sid: user2.id,
      qid: question2.id,
      time: new Date(),
    },
  });

  // 8. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin User',
      email: 'admin@placeprep.com', // This must be unique
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log('Admin user created:', admin.email);

  // 9. Create Activity logs
  await prisma.Activity.createMany({
    data: [
      {
        user: user1.fullName,
        action: 'Completed DSA Test',
        score: 85,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        user: user2.fullName,
        action: 'Started Aptitude Test',
        score: null,
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      },
      {
        user: admin.fullName,
        action: 'Created new contest',
        score: null,
        timestamp: new Date(),
      },
    ],
  });
  console.log('Activity logs seeded.');

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