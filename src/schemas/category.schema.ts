import z from "zod";
export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string({ message: "Category name is required" }).min(1).max(50),
  type: z.enum(["income", "expense"]),
  color: z.string().optional(),
});

export const updatecategorySchema = categorySchema.extend({
  id: z.string().uuid("Invalid category ID"),
});
