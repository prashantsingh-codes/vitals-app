import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { chat } from "../controllers/chatController.js";

const router = Router();

// Auth required — user must be logged in to use AI chat
router.post("/", auth, chat);

export default router;
