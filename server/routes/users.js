import express from "express";
import * as userControllers from "../controllers/userControllers";
import multer from "multer";
import path from "path";
//import { validateUser } from "../controllers/authController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "storage/avatar/",
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    req.avatar = `${req.protocol}://${req.headers.host}/avatar/${file.fieldname}-${uniqueSuffix}`;
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

//router.use()
router.get("/users", userControllers.getUsers);
router.get("/members", userControllers.getMemberList);
router.get("/members/certified/", userControllers.getCertifiedMemberList);
router.get("/users/:id", userControllers.getUser);
router.post("/register/user", userControllers.createNewUser);
router.post("/check/email", userControllers.CheckEmail);
router.put(
  "/update/user/:id",
  upload.single("avatar"),
  userControllers.updateUserProfile
);
router.put("/check/password", userControllers.checkPassword);
router.put("/update/password/:id", userControllers.updatePassword);
router.put("/users/:id/join-licentiate", userControllers.joinLicentate);
router.put("/users/:id/join-associate", userControllers.joinAssociate);
router.put("/users/:id/join-full", userControllers.joinFull);
router.put("/users/:id/join-corporate", userControllers.joinCorporate);
router.put("/users/:id/renew/:membership", userControllers.renewMembership);
router.put(
  "/updateUserActivationStatus/:id",
  userControllers.updateUserActivationStatus
);

export default router;
