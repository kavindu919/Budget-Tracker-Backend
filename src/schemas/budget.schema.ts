import z from "zod";

export const createBudgetSchema = z.object({
  amount: z.coerce
    .number({ message: "Amount is required" })
    .positive("Amount must be positive"),
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
  alertLimit: z.coerce.number().positive().optional(),
  categoryId: z.string().uuid("Invalid category ID"),
});

export const updateBudgetSchema = createBudgetSchema.extend({
  id: z.string().uuid("Invalid budget ID"),
});

export const budgetQuerySchema = z.object({
  period: z
    .enum(["daily", "weekly", "monthly", "yearly"])
    .or(z.literal(""))
    .optional(),
  categoryId: z.string().uuid().or(z.literal("")).optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});
