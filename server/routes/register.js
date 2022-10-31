import express from "express";
import {
  createNewUser,
  CheckEmail,
  getUserList,
} from "../controllers/userControllers.js";
const router = express.Router();

router.post("/register/user", createNewUser);
router.post("/check/email", CheckEmail);
router.get("/user", getUserList);

export default router;
