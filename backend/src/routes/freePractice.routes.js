import express from 'express';
import { createFreePractice, submitFreePractice, getUserFreePractices } from '../controllers/freePractice.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createFreePractice);
router.post('/:id/submit', submitFreePractice);
router.get('/', getUserFreePractices);

export default router;
