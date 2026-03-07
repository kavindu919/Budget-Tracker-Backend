import { Router } from "express";
import { registerSchema } from "../schemas/auth.schema";
import {
  login,
  logout,
  refreshTokens,
  register,
} from "../controllers/auth.controller";

const authRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh-tokens", refreshTokens);
authRouter.post("/logout", logout);

export default authRouter;
