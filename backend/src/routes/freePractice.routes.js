import express from 'express';
import { createFreePractice, submitFreePractice, getUserFreePractices, startPracticeTest, submitPracticeTest, getUserFreePracticeParticipations, getFreePracticeResult, getStudentStats, getStudentRecentTests } from '../controllers/freePractice.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createFreePractice);
router.post('/:id/submit', submitFreePractice);
router.get('/', getUserFreePractices);
router.get('/participations', getUserFreePracticeParticipations);
router.get('/result', getFreePracticeResult);
router.get('/student/stats', getStudentStats);
router.get('/student/recent-tests', getStudentRecentTests);

// New endpoints for practice test
router.post('/start', startPracticeTest);
router.post('/:id/practice-submit', submitPracticeTest);

export default router;
