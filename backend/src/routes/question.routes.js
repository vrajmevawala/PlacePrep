import express from 'express';
import { addQuestion } from '../controllers/question.controller.js';
import { getAllQuestions } from '../controllers/question.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { requireAdminOrModerator } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, requireAdminOrModerator, addQuestion);
router.get('/', authMiddleware, requireAdminOrModerator, getAllQuestions);

export default router; 