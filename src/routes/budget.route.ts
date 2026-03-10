import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from "../controllers/budget.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { Router } from "express";

const budgetRouter = Router();

budgetRouter.post("/create", authMiddleware, createBudget);
budgetRouter.post("/edit", authMiddleware, updateBudget);
budgetRouter.post("/delete", authMiddleware, deleteBudget);
budgetRouter.get("/get-budgets", authMiddleware, getBudgets);

export default budgetRouter;
