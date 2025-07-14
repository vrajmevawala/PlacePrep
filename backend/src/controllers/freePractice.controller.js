import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create a new freePractice test (user starts a practice test)
export const createFreePractice = async (req, res) => {
  try {
    const { category, subcategory, level, numQuestions, title } = req.body;
    const userId = req.user.id;

    // Fetch random questions matching criteria
    const questions = await prisma.question.findMany({
      where: { category, subcategory, level, visibility: true },
      orderBy: { id: 'asc' }, // or use random ordering if supported
      take: numQuestions,
    });

    if (questions.length < numQuestions) {
      return res.status(400).json({ message: 'Not enough questions available.' });
    }

    // Create freePractice test
    const freePractice = await prisma.freePractice.create({
      data: {
        title,
        category,
        subcategory,
        level,
        createdBy: userId,
        startTime: new Date(),
        questions: {
          connect: questions.map(q => ({ id: q.id })),
        },
      },
      include: { questions: { select: { id: true, question: true, options: true, level: true, category: true, subcategory: true } } },
    });

    res.status(201).json({ freePractice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit a freePractice test (user finishes the test)
export const submitFreePractice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Only allow the creator to submit
    const freePractice = await prisma.freePractice.findUnique({ where: { id: Number(id) } });
    if (!freePractice || freePractice.createdBy !== userId) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // Set endTime
    const updated = await prisma.freePractice.update({
      where: { id: Number(id) },
      data: { endTime: new Date() },
    });

    res.json({ message: 'Test submitted.', freePractice: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all freePractice tests for the logged-in user
export const getUserFreePractices = async (req, res) => {
  try {
    const userId = req.user.id;
    const tests = await prisma.freePractice.findMany({
      where: { createdBy: userId },
      include: { questions: { select: { id: true, question: true, options: true, level: true, category: true, subcategory: true } } },
    });
    res.json({ freePractices: tests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
