import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import {
  budgetQuerySchema,
  createBudgetSchema,
  updateBudgetSchema,
} from "../schemas/budget.schema";

export const createBudget = async (req: Request, res: Response) => {
  try {
    const validateData = createBudgetSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const category = await prisma.categories.findFirst({
      where: { id: validateData.categoryId, userId },
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    const existing = await prisma.budgets.findFirst({
      where: {
        userId,
        categoryId: validateData.categoryId,
        period: validateData.period,
      },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Budget already exists for this category and period",
      });
    }
    await prisma.budgets.create({
      data: {
        amount: validateData.amount,
        period: validateData.period,
        alertLimit: validateData.alertLimit,
        categoryId: validateData.categoryId,
        userId,
      },
    });
    res.status(201).json({
      success: true,
      message: "Budget created successfully",
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

export const getBudgets = async (req: Request, res: Response) => {
  try {
    const validateData = budgetQuerySchema.parse(req.query);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const where: any = { userId };

    if (validateData.period) {
      where.period = validateData.period;
    }
    if (validateData.categoryId) {
      where.categoryId = validateData.categoryId;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const budgets = await prisma.budgets.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (Number(validateData.page) - 1) * Number(validateData.limit),
      take: Number(validateData.limit),
    });

    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget) => {
        let dateFilter: any = {};

        if (budget.period === "monthly") {
          dateFilter = {
            gte: new Date(currentYear, currentMonth, 1),
            lte: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59),
          };
        } else if (budget.period === "yearly") {
          dateFilter = {
            gte: new Date(currentYear, 0, 1),
            lte: new Date(currentYear, 11, 31, 23, 59, 59),
          };
        } else if (budget.period === "weekly") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          dateFilter = { gte: startOfWeek, lte: endOfWeek };
        } else if (budget.period === "daily") {
          dateFilter = {
            gte: new Date(currentYear, currentMonth, now.getDate()),
            lte: new Date(currentYear, currentMonth, now.getDate(), 23, 59, 59),
          };
        }

        const spent = await prisma.transactions.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: "expense",
            date: dateFilter,
          },
          _sum: { amount: true },
        });

        const spentAmount = Number(spent._sum.amount ?? 0);
        const budgetAmount = Number(budget.amount);
        const alertLimit = Number(budget.alertLimit ?? budgetAmount * 0.8);
        const percentage = Math.min((spentAmount / budgetAmount) * 100, 100);
        const isExceeded = spentAmount > budgetAmount;
        const isNearLimit = !isExceeded && spentAmount >= alertLimit;

        return {
          ...budget,
          amount: budgetAmount,
          alertLimit: Number(budget.alertLimit),
          spent: spentAmount,
          remaining: Math.max(budgetAmount - spentAmount, 0),
          percentage: Math.round(percentage),
          isExceeded,
          isNearLimit,
        };
      }),
    );

    const total = await prisma.budgets.count({ where });

    res.json({
      success: true,
      data: budgetsWithProgress,
      meta: {
        total,
        page: Number(validateData.page),
        limit: Number(validateData.limit),
      },
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

export const updateBudget = async (req: Request, res: Response) => {
  try {
    const validateData = updateBudgetSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const existing = await prisma.budgets.findFirst({
      where: { id: validateData.id, userId },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    const duplicate = await prisma.budgets.findFirst({
      where: {
        userId,
        categoryId: validateData.categoryId,
        period: validateData.period,
        NOT: { id: validateData.id },
      },
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Budget already exists for this category and period",
      });
    }

    await prisma.budgets.update({
      where: { id: validateData.id },
      data: {
        amount: validateData.amount,
        period: validateData.period,
        alertLimit: validateData.alertLimit,
        categoryId: validateData.categoryId,
      },
    });

    res.json({
      success: true,
      message: "Budget updated successfully",
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

export const deleteBudget = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
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

    const existing = await prisma.budgets.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    await prisma.budgets.delete({ where: { id } });

    res.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};
