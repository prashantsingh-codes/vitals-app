import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireDB } from "../middleware/requireDB.js";
import { getLog, saveLog } from "../controllers/logController.js";

const router = Router();

router.get("/",  auth, requireDB, getLog);
router.put("/",  auth, requireDB, saveLog);

export default router;
