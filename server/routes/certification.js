import express from "express";
import {
  approveCertificate,
  certApplication,
  deleteCert,
  getCertList,
  scheduleExam,
  verifyCertCode,
} from "../controllers/certController";
const router = express.Router();

router.post("/certification", certApplication);
router.delete("/delete/cert/:id", deleteCert);
router.get("/cert", getCertList);
router.post("/approve/certificate/:id", approveCertificate);
router.post("/verify/certificate", verifyCertCode);
router.post("/schedule/exam/:id", scheduleExam);

export default router;
