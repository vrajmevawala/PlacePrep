import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  // Delete all existing records (order matters due to relations)
  await prisma.studentActivity.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.freePractice.deleteMany();
  await prisma.testSeries.deleteMany();
  await prisma.question.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const hashedPassword1 = await bcrypt.hash('password1', 10);
  const hashedPassword2 = await bcrypt.hash('password2', 10);

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      password: hashedPassword1,
      role: 'user',
    },
  });
  const user2 = await prisma.user.create({
    data: {
      fullName: 'Bob Johnson',
      email: 'bob@example.com',
      password: hashedPassword2,
      role: 'moderator',
    },
  });

  // Create Questions
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

  // Create TestSeries
  const testSeries1 = await prisma.testSeries.create({
    data: {
      title: 'Aptitude Test 1',
      startTime: new Date(Date.now() + 3600 * 1000),
      endTime: new Date(Date.now() + 7200 * 1000),
      createdBy: user1.id,
      questions: {
        connect: [{ id: question1.id }],
      },
    },
  });

  // Create freePractice
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

  // Create Participation
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

  // Create StudentActivity
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

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 