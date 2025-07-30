import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.middleware.js';
import { requireAdminOrModerator } from '../middleware/role.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all results (admin/moderator only)
router.get('/', authMiddleware, requireAdminOrModerator, async (req, res) => {
  try {
    const results = await prisma.studentActivity.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        question: {
          select: {
            id: true,
            question: true,
            category: true,
            subcategory: true,
            level: true
          }
        },
        testSeries: {
          select: {
            id: true,
            title: true
          }
        },
        freePractice: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        time: 'desc'
      }
    });

    res.json({ results });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'Failed to fetch results' });
  }
});

// Get user's own results
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const results = await prisma.studentActivity.findMany({
      where: {
        sid: req.user.id
      },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            category: true,
            subcategory: true,
            level: true
          }
        },
        testSeries: {
          select: {
            id: true,
            title: true
          }
        },
        freePractice: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        time: 'desc'
      }
    });

    res.json({ results });
  } catch (error) {
    console.error('Error fetching user results:', error);
    res.status(500).json({ message: 'Failed to fetch results' });
  }
});

export default router; 