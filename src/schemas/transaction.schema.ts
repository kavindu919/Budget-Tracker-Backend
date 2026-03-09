import z from "zod";

const createTransactionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.string().uuid("Invalid category ID"),
  type: z.enum(["income", "expense"]),
  date: z
    .union([z.string().datetime(), z.date()])
    .transform((val) => new Date(val)),
  note: z.string().max(500).optional().nullable(),
});

const updateTransactionSchema = createTransactionSchema.partial();

const filterSchema = z.object({
  startDate: z
    .union([z.string().datetime(), z.date()])
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .union([z.string().datetime(), z.date()])
    .transform((val) => new Date(val))
    .optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(["income", "expense"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(["date", "amount", "title"]).default("date").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
});
