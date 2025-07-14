import express from "express";
import { signup, login, logout, createModerator, googleAuth, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/create-moderator", authMiddleware, requireAdmin, createModerator);

router.post('/google-auth', googleAuth);

export default router;