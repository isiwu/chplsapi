import express from "express";
import * as adminController from "../controllers/adminController";
import * as userControllers from "../controllers/userControllers";

const router = express.Router();

router.post("/create-admin", adminController.createAdmin);
router.put("/delete-admin/:id", adminController.deleteAdmin);
router.post("/admin-login", adminController.loginAdmin);
router.get("/all-admin", adminController.getAllAdmins);
router.put(
  "/admin/approve/users/:id/:membership",
  userControllers.approveMembership
);

export default router;
