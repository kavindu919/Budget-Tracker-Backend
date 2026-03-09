import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  categoryQuerySchema,
  categorySchema,
  updatecategorySchema,
} from "../schemas/category.schema";
import { ZodError } from "zod";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const valideData = categorySchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const existing = await prisma.categories.findFirst({
      where: { userId, name: valideData.name, type: valideData.type },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }
    const category = await prisma.categories.create({
      data: {
        name: valideData.name,
        type: valideData.type,
        color: valideData.color,
        userId,
      },
    });
    res.status(201).json({
      success: true,
      message: "Category created",
    });
  } catch (error: any) {
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

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const valideData = updatecategorySchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const existingCategory = await prisma.categories.findFirst({
      where: { id: valideData.id, userId },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const duplicate = await prisma.categories.findFirst({
      where: {
        userId,
        name: valideData.name,
        type: valideData.type,
        NOT: { id: valideData.id },
      },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    await prisma.categories.update({
      where: { id: valideData.id },
      data: {
        name: valideData.name,
        type: valideData.type,
        color: valideData.color,
      },
    });

    res.json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error: any) {
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

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.body.id;
    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid issue id",
      });
    }
    if (!id) {
      return res.status(404).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const existingCategory = await prisma.categories.findFirst({
      where: { id, userId },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await prisma.categories.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const validateData = categoryQuerySchema.parse(req.query);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const where: any = { userId };
    if (validateData.type) {
      where.type = validateData.type;
    }
    if (validateData.search) {
      where.name = {
        contains: validateData.search,
        mode: "insensitive",
      };
    }

    const categories = await prisma.categories.findMany({
      where,
      orderBy: {
        [validateData.sortBy]: validateData.sortOrder,
      },
      skip: (Number(validateData.page) - 1) * Number(validateData.limit),
      take: Number(validateData.limit),
    });

    const total = await prisma.categories.count({ where });

    res.json({
      success: true,
      data: categories,
      meta: {
        total,
        page: Number(validateData.page),
        limit: Number(validateData.limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid issue id",
      });
    }
    if (!id) {
      return res.status(404).json({
        success: false,
        message: "Missing required fields",
      });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const category = await prisma.categories.findFirst({
      where: { id, userId },
    });

    if (!category)
      return res.status(404).json({ success: false, message: "Not found" });

    res.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
