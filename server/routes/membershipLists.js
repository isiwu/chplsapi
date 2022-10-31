import express from "express";
import {
  addMembership,
  getMembership,
  updateMembership,
} from "../controllers/mListController";

const router = express.Router();

router.post("/addmembership", addMembership);
router.get("/getMembership", getMembership);
router.put("/updateMembership/:id", updateMembership);

export default router;
