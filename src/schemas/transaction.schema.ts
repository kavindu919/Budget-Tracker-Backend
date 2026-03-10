import z from "zod";

export const createTransactionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.string().uuid("Invalid category ID"),
  type: z.enum(["income", "expense"]),
  date: z.string().transform((val) => new Date(val).toISOString()),
  note: z.string().max(500).optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema
  .partial()
  .extend({
    id: z.string().uuid("Invalid transaction ID"),
  });

export const filterSchema = z.object({
  startDate: z
    .string()
    .optional()
    .transform((val) =>
      val && val !== "" ? new Date(val).toISOString() : undefined,
    ),
  endDate: z
    .string()
    .optional()
    .transform((val) =>
      val && val !== "" ? new Date(val).toISOString() : undefined,
    ),
  categoryId: z.string().uuid().or(z.literal("")).optional(),
  type: z.enum(["income", "expense"]).or(z.literal("")).optional(),
  search: z.string().optional(),
  limit: z.string().optional().default("20"),
  page: z.string().optional().default("1"),
  sortBy: z
    .enum(["date", "amount", "title"])
    .or(z.literal(""))
    .default("date")
    .optional(),
  sortOrder: z
    .enum(["asc", "desc"])
    .or(z.literal(""))
    .default("desc")
    .optional(),
});
