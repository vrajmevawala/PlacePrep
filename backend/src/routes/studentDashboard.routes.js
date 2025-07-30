import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get student statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total practice tests taken
    const totalTests = await prisma.freePractice.count({
      where: { createdBy: userId }
    });

    // Get total contests participated
    const totalContests = await prisma.participation.count({
      where: { 
        sid: userId,
        contest: true 
      }
    });

    // Get average score (if available)
    const activities = await prisma.studentActivity.findMany({
      where: { sid: userId },
      include: { question: true }
    });

    let totalQuestions = 0;
    let correctAnswers = 0;

    activities.forEach(activity => {
      if (activity.selectedAnswer) {
        totalQuestions++;
        if (activity.selectedAnswer === activity.question.correctAns) {
          correctAnswers++;
        }
      }
    });

    const averageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    res.json({
      totalTests,
      totalContests,
      averageScore,
      totalQuestions
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get recent tests
router.get('/recent-tests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const recentTests = await prisma.freePractice.findMany({
      where: { createdBy: userId },
      orderBy: { startTime: 'desc' },
      take: 5,
      include: {
        questions: {
          select: { id: true }
        }
      }
    });

    res.json(recentTests);
  } catch (error) {
    console.error('Error fetching recent tests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
