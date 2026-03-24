import express from "express";
import { generateResume } from "../controllers/resumeController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/generate", protectRoute, generateResume);

export default router;
