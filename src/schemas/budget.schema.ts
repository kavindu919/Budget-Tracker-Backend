import z from "zod";

export const createBudgetSchema = z.object({
  amount: z.coerce
    .number({ message: "Amount is required" })
    .positive("Amount must be positive"),
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
  alertLimit: z
    .union([
      z.literal("").transform(() => undefined),
      z.coerce.number().min(0, {
        message: "Alert limit must be 0 or greater",
      }),
    ])
    .optional(),
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
