import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Add a new question (admin/moderator only)
export const addQuestion = async (req, res) => {
  try {
    const { category, subcategory, level, question, options, correctAns, explanation, visibility } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can add questions.' });
    }

    if (!category || !subcategory || !level || !question || !options || !correctAns) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    const newQuestion = await prisma.question.create({
      data: {
        category,
        subcategory,
        level,
        question,
        options,
        correctAns,
        explanation: explanation || '',
        visibility: visibility !== undefined ? visibility : true,
        createdBy: userId,
      },
    });

    res.status(201).json({ question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all questions (admin/moderator only)
export const getAllQuestions = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can view questions.' });
    }
    const questions = await prisma.question.findMany({
      include: {
        author: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 