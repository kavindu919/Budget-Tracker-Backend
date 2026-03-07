import z from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .regex(/^\S+$/, "Email must not contain spaces."),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/^\S+$/, "Password must not contain spaces."),

  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be less than 100 characters.")
    .regex(/^\S(.*\S)?$/, "Full name must not start or end with spaces."),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .min(1, "Email is required."),

  password: z.string().min(1, "Password is required."),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required."),
});
