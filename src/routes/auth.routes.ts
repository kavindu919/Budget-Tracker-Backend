import { Router } from "express";
import {
  getUserProfile,
  login,
  logout,
  refreshTokens,
  register,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const authRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh-tokens", refreshTokens);
authRouter.post("/logout", authMiddleware, logout);
authRouter.get("/profile", authMiddleware, getUserProfile);

export default authRouter;
