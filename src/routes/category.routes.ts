import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "../controllers/category.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { Router } from "express";

const categoryRouter = Router();

categoryRouter.post("/create", authMiddleware, createCategory);
categoryRouter.post("/edit", authMiddleware, updateCategory);
categoryRouter.post("/delete", authMiddleware, deleteCategory);
categoryRouter.get("/get-all-categories", authMiddleware, getCategories);
categoryRouter.get("/get-all-category", authMiddleware, getCategory);

export default categoryRouter;
