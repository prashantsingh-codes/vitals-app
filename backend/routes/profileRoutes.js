import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireDB } from "../middleware/requireDB.js";
import { getProfile, saveProfile } from "../controllers/profileController.js";

const router = Router();

router.get("/", auth, requireDB, getProfile);
router.put("/", auth, requireDB, saveProfile);

export default router;
