import express from "express";
import {
  LoginUser,
  sendEmail,
  getAllEmailCodes,
  verifyEmailCode,
} from "../controllers/authController";
const router = express.Router();

// login user____________________
router.post("/login",LoginUser);
router.post("/email_verification/:id",sendEmail);
router.get("/all_email_verification",getAllEmailCodes);
router.post("/verify_code/:id", verifyEmailCode);

export default router;
