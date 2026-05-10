import { Router } from "express";
import { requireDB } from "../middleware/requireDB.js";
import { auth } from "../middleware/auth.js";
import { signup, login, me } from "../controllers/authController.js";

const router = Router();

router.post("/signup", requireDB, signup);
router.post("/login",  requireDB, login);
router.get("/me",      auth, requireDB, me);

export default router;
