import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  getTransactionSummary,
  updateTransaction,
} from "../controllers/transaction.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { Router } from "express";

const transactionRouter = Router();

transactionRouter.post("/create", authMiddleware, createTransaction);
transactionRouter.post("/update", authMiddleware, updateTransaction);
transactionRouter.post("/delete", authMiddleware, deleteTransaction);
transactionRouter.get("/get-all-transactions", authMiddleware, getTransactions);
transactionRouter.get("/summary", authMiddleware, getTransactionSummary);

export default transactionRouter;
