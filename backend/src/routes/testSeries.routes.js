import express from 'express';
import { createTestSeries, getAllTestSeries, getTestSeriesQuestions, submitTestSeriesAnswers } from '../controllers/testSeries.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { requireAdminOrModerator } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', requireAdminOrModerator, createTestSeries); 
router.get('/', getAllTestSeries);
router.get('/:id', getTestSeriesQuestions);
router.post('/:id/submit', submitTestSeriesAnswers);

export default router;                                                                  