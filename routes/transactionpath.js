import express from "express";
import {
  deleteTransaction,
  getAllTransactions,
  postTransaction,
  dashboardStat,
} from "../controllers/transactionControl.js";
const router = express.Router();

router.get("/transactions", getAllTransactions);
router.delete("/delete/transaction", deleteTransaction);
router.post("/post/transaction", postTransaction);
router.get("/dashboard/stat", dashboardStat);

export default router;
