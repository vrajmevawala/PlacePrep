import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create a new TestSeries (admin/moderator only)
export const createTestSeries = async (req, res) => {
  try {
    const { title, questionIds, startTime, endTime } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can create test series.' });
    }

    // Validate questionIds
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ message: 'Provide at least one question.' });
    }

    // Create TestSeries
    const testSeries = await prisma.testSeries.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        createdBy: userId,
        questions: {
          connect: questionIds.map(id => ({ id })),
        },
      },
      include: { questions: { select: { id: true, question: true, options: true, level: true, category: true, subcategory: true } }, creator: true },
    });

    await prisma.question.updateMany({
      where: { id: { in: questionIds } },
      data: { visibility: false }
    });

    res.status(201).json({ testSeries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all TestSeries (optionally filter by creator)
export const getAllTestSeries = async (req, res) => {
  try {
    const tests = await prisma.testSeries.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        creator: {
          select: {
            fullName: true
          }
        }
      }
    });
    res.json({ testSeries: tests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get questions for a specific TestSeries (without correct answers)
export const getTestSeriesQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const testSeries = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            level: true,
            category: true,
            subcategory: true
          }
        }
      }
    });
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found.' });
    }
    res.json({ questions: testSeries.questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit answers for a TestSeries, calculate score, and store participation
export const submitTestSeriesAnswers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { answers } = req.body; // [{ questionId, selectedOption }]
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Answers are required.' });
    }
    // Fetch correct answers for the questions in this test series
    const testSeries = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          select: { id: true, correctAns: true }
        }
      }
    });
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found.' });
    }
    // Map questionId to correctAns
    const correctMap = {};
    testSeries.questions.forEach(q => {
      correctMap[q.id] = q.correctAns;
    });
    // Calculate score
    let score = 0;
    answers.forEach(ans => {
      if (correctMap[ans.questionId] && correctMap[ans.questionId] === ans.selectedOption) {
        score++;
      }
    });
    // Store participation
    await prisma.participation.create({
      data: {
        sid: userId,
        practiceTest: false,
        contest: false,
        testSeriesId: Number(id),
        startTime: new Date(),
        endTime: new Date(),
      }
    });
    res.json({ score, total: testSeries.questions.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
