import express from 'express';
import { createTestSeries, getAllTestSeries, getTestSeriesById, getTestSeriesQuestions, submitTestSeriesAnswers, joinTestSeries, getUserContestResult, getContestStats, getAllContestStats, getUserParticipations, getUpcomingContests, joinContestByCode, updateTestSeries } from '../controllers/testSeries.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { requireAdminOrModerator } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', requireAdminOrModerator, createTestSeries); 
router.get('/', getAllTestSeries);
router.get('/participations', getUserParticipations);
router.get('/contests/upcoming', getUpcomingContests);
router.get('/stats/all', getAllContestStats);
router.get('/:id', getTestSeriesById);
router.get('/:id/questions', getTestSeriesQuestions);
router.post('/:id/submit', submitTestSeriesAnswers);
router.post('/:id/join', joinTestSeries);
router.post('/join-by-code', joinContestByCode);
router.get('/:id/result', getUserContestResult);
router.get('/:id/stats', getContestStats);
router.put('/:id', requireAdminOrModerator, updateTestSeries);

export default router;                                                                  