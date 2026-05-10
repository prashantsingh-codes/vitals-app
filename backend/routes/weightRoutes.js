import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireDB } from "../middleware/requireDB.js";
import {
  getWeight,
  logWeight,
  updateWeight,
  deleteWeight,
} from "../controllers/weightController.js";

const router = Router();

router.get("/",      auth, requireDB, getWeight);
router.post("/",     auth, requireDB, logWeight);
router.put("/:id",   auth, requireDB, updateWeight);
router.delete("/:id",auth, requireDB, deleteWeight);

export default router;
