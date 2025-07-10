import express from "express";
import { practiceTest } from "../controllers/test.controller.js";

const router = express.Router();

router.use('/practice-test', practiceTest);

export default router;