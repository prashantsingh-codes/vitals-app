import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireDB } from "../middleware/requireDB.js";
import {
  getCustomFoods,
  addCustomFood,
  toggleCustomFood,
  deleteCustomFood,
} from "../controllers/customFoodController.js";

const router = Router();

router.get("/",        auth, requireDB, getCustomFoods);
router.post("/",       auth, requireDB, addCustomFood);
router.patch("/:id",   auth, requireDB, toggleCustomFood);
router.delete("/:id",  auth, requireDB, deleteCustomFood);

export default router;
