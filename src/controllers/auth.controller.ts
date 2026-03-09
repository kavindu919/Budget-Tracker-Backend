import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../utills/password.util";
import {
  hashToken,
  refreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utills/jwt.util";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { ZodError } from "zod";

export const register = async (req: Request, res: Response) => {
  try {
    const validateData = registerSchema.parse(req.body);
    const isUser = await prisma.user.findUnique({
      where: { email: validateData.email },
    });
    if (isUser) {
      return res.status(409).json({
        success: false,
        message: "User already exist",
      });
    }
    const hashedPassword = await hashPassword(validateData.password);

    const user = await prisma.user.create({
      data: {
        name: validateData.name,
        email: validateData.email,
        password: hashedPassword,
      },
    });

    const access_token = signAccessToken(user.id, user.email);
    const refresh_token = signRefreshToken(user.id, user.email);
    const hashed_refresh_token = hashToken(refresh_token);
    const refresh_token_expire = refreshTokenExpiry();

    await prisma.refreshTokens.create({
      data: {
        userId: user.id,
        token: hashed_refresh_token,
        expiresAt: refresh_token_expire,
      },
    });

    res.cookie("accessToken", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userData = {
      name: user.name,
      email: user.email,
    };
    return res.status(201).json({
      success: true,
      data: userData,
      message: "Registration complete",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validateData = loginSchema.parse(req.body);
    const isUser = await prisma.user.findUnique({
      where: { email: validateData.email },
    });
    if (!isUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    if (!isUser.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    const isPassword = await comparePassword(
      validateData.password,
      isUser.password,
    );
    if (!isPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    const access_token = signAccessToken(isUser.id, isUser.email);
    const refresh_token = signRefreshToken(isUser.id, isUser.email);
    const hashed_refresh_token = hashToken(refresh_token);
    const refresh_token_expire = refreshTokenExpiry();

    await prisma.refreshTokens.create({
      data: {
        userId: isUser.id,
        token: hashed_refresh_token,
        expiresAt: refresh_token_expire,
      },
    });

    const userData = {
      name: isUser.name,
      email: isUser.email,
    };

    res.cookie("accessToken", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
      data: userData,
      message: "Login successful",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};

export const refreshTokens = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Missing refresh token",
      });
    }

    let payload: { sub: string; email: string };
    try {
      payload = verifyRefreshToken(token) as { sub: string; email: string };
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const hashedToken = hashToken(token);
    const storedToken = await prisma.refreshTokens.findUnique({
      where: { token: hashedToken },
    });

    if (!storedToken) {
      await prisma.refreshTokens.deleteMany({
        where: { userId: payload.sub },
      });
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshTokens.delete({
        where: { token: hashedToken },
      });
      return res.status(401).json({
        success: false,
        message: "Refresh token expired, please login again",
      });
    }

    await prisma.refreshTokens.delete({
      where: { token: hashedToken },
    });

    const access_token = signAccessToken(storedToken.userId, payload.email);
    const refresh_token = signRefreshToken(storedToken.userId, payload.email);

    const newHashedToken = hashToken(refresh_token);
    await prisma.refreshTokens.create({
      data: {
        userId: storedToken.userId,
        token: newHashedToken,
        expiresAt: refreshTokenExpiry(),
      },
    });

    res.cookie("accessToken", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong please try again",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
      },
      tokens: {
        access_token,
      },
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      const hashedToken = hashToken(token);
      await prisma.refreshTokens.deleteMany({
        where: { token: hashedToken },
      });
    }

    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: user,
      message: "Profile fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};
