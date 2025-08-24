import express from "express";
import { 
    signup, 
    login, 
    logout, 
    createModerator, 
    googleAuth, 
    forgotPassword, 
    resetPassword, 
    me, 
    getAllUsers,
    getAdminStats,
    getModerators,
    getUserAnalytics,
    getActivityLogs,
    deleteModerator,
    verifyEmail,
    resendVerificationCode
} from "../controllers/auth.controller.js";
import { requireAdmin, requireAdminOrModerator } from "../middleware/role.middleware.js";
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationCode);

router.post("/create-moderator", authMiddleware, requireAdmin, createModerator);
router.delete("/moderators/:id", authMiddleware, requireAdmin, deleteModerator);

router.post('/google-auth', googleAuth);
router.get('/me', authMiddleware, me);
router.get('/users', getAllUsers);
router.get('/admin/stats', authMiddleware, requireAdminOrModerator, getAdminStats);
router.get('/moderators', authMiddleware, requireAdminOrModerator, getModerators);
router.get('/user-analytics', authMiddleware, requireAdminOrModerator, getUserAnalytics);
router.get('/activity-logs', authMiddleware, requireAdminOrModerator, getActivityLogs);

export default router;