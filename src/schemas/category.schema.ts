import z from "zod";
export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string({ message: "Category name is required" }).min(1).max(50),
  type: z.enum(["income", "expense"]),
  color: z.string().optional(),
  limit: z.string().optional(),
  page: z.string().optional(),
});

export const updatecategorySchema = categorySchema.extend({
  id: z.string().uuid("Invalid category ID"),
});

export const categoryQuerySchema = z.object({
  type: z.enum(["income", "expense"]).or(z.literal("")).optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
});
