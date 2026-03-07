import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export function signAccessToken(userId: string, email: string) {
  if (!ACCESS_SECRET) {
    throw new Error("ACCESS_SECRET not defined");
  }

  return jwt.sign(
    {
      sub: userId,
      email: email,
    },
    ACCESS_SECRET,
    {
      expiresIn: "15m",
    },
  );
}
export function signRefreshToken(userId: string, email: string) {
  if (!REFRESH_SECRET) {
    throw new Error("REFRESH_SECRET not defined");
  }
  return jwt.sign(
    {
      sub: userId,
      email: email,
    },
    REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );
}
export function verifyAccessToken(token: string) {
  if (!ACCESS_SECRET) {
    throw new Error("ACCESS_SECRET not defined");
  }
  return jwt.verify(token, ACCESS_SECRET);
}
export function verifyRefreshToken(token: string) {
  if (!REFRESH_SECRET) {
    throw new Error("VERIFY_SECRET not defined");
  }
  return jwt.verify(token, REFRESH_SECRET);
}
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
