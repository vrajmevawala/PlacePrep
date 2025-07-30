import express from 'express';
import { addQuestion, addQuestionsFromExcel, addQuestionsFromJson, getSubcategories, practiceQuestions, deleteQuestion, updateQuestion, getUserBookmarks, addBookmark, removeBookmark } from '../controllers/question.controller.js';
import { getAllQuestions } from '../controllers/question.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { requireAdminOrModerator } from '../middleware/role.middleware.js';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/', authMiddleware, requireAdminOrModerator, addQuestion);
router.post('/upload-excel', authMiddleware, requireAdminOrModerator, upload.single('file'), addQuestionsFromExcel);
router.post('/upload-json', authMiddleware, requireAdminOrModerator, upload.single('file'), addQuestionsFromJson);
router.get('/', authMiddleware, requireAdminOrModerator, getAllQuestions);
router.get('/practice', practiceQuestions);
router.get('/subcategories', getSubcategories);
router.get('/bookmarks', authMiddleware, getUserBookmarks);
router.post('/bookmarks', authMiddleware, addBookmark);
router.post('/bookmarks/remove', authMiddleware, removeBookmark);
router.delete('/:id', authMiddleware, requireAdminOrModerator, deleteQuestion);
router.put('/:id', authMiddleware, requireAdminOrModerator, updateQuestion);

export default router; 