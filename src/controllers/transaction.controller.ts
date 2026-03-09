import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import {
  createTransactionSchema,
  filterSchema,
  updateTransactionSchema,
} from "../schemas/transaction.schema";
import { Request, Response } from "express";

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const validateData = createTransactionSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const category = await prisma.categories.findFirst({
      where: { id: validateData.categoryId, userId: userId },
    });
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    await prisma.transactions.create({
      data: {
        title: validateData.title,
        amount: validateData.amount,
        categoryId: validateData.categoryId,
        type: validateData.type,
        date: validateData.date,
        note: validateData.note,
        userId,
      },
    });
    res.status(201).json({
      success: true,
      message: "Transaction created",
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

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const validateData = filterSchema.parse(req.query);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const where: any = { userId };

    if (validateData.categoryId) where.categoryId = validateData.categoryId;
    if (validateData.type) where.type = validateData.type;
    if (validateData.startDate && validateData.endDate) {
      where.date = {
        gte: new Date(validateData.startDate),
        lte: new Date(validateData.endDate),
      };
    } else if (validateData.startDate) {
      where.date = { gte: new Date(validateData.startDate) };
    } else if (validateData.endDate) {
      where.date = { lte: new Date(validateData.endDate) };
    }
    if (validateData.search) {
      where.OR = [
        {
          title: {
            contains: validateData.search,
            mode: "insensitive",
          },
        },
        {
          note: {
            contains: validateData.search,
            mode: "insensitive",
          },
        },
        {
          category: {
            name: {
              contains: validateData.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const data = await prisma.transactions.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
      orderBy: {
        [validateData.sortBy || "date"]: validateData.sortOrder || "desc",
      },
      skip: (Number(validateData.page) - 1) * Number(validateData.limit),
      take: Number(validateData.limit),
    });
    const total = await prisma.transactions.count({ where });
    res.json({
      success: true,
      data: data,
      meta: {
        total,
        page: Number(validateData.page),
        limit: Number(validateData.limit),
      },
    });
  } catch (error) {
    console.log(error);
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({ success: false, message: error.issues[0].message });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const validateData = updateTransactionSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const existing = await prisma.transactions.findFirst({
      where: { id: validateData.id, userId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    await prisma.transactions.update({
      where: { id: validateData.id },
      data: {
        title: validateData.title,
        amount: validateData.amount,
        categoryId: validateData.categoryId,
        type: validateData.type,
        date: validateData.date,
        note: validateData.note,
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    res
      .status(200)
      .json({ success: true, message: "Transaction updated successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({ success: false, message: error.issues[0].message });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
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
    const transaction = await prisma.transactions.findFirst({
      where: { id: id, userId: userId },
    });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    await prisma.transactions.delete({ where: { id } });
    res.json({ success: true, message: "Transaction deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};

export const getTransactionSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const [incomeResult, expenseResult] = await Promise.all([
      prisma.transactions.aggregate({
        where: { userId, type: "income" },
        _sum: { amount: true },
      }),
      prisma.transactions.aggregate({
        where: { userId, type: "expense" },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(incomeResult._sum.amount ?? 0);
    const totalExpense = Number(expenseResult._sum.amount ?? 0);
    const balance =
      totalIncome - totalExpense > 0 ? totalIncome - totalExpense : 0;

    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        label: date.toLocaleString("default", { month: "short" }),
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
      };
    });

    const monthlyData = await Promise.all(
      months.map(async (month) => {
        const [inc, exp] = await Promise.all([
          prisma.transactions.aggregate({
            where: {
              userId,
              type: "income",
              date: { gte: month.start, lte: month.end },
            },
            _sum: { amount: true },
          }),
          prisma.transactions.aggregate({
            where: {
              userId,
              type: "expense",
              date: { gte: month.start, lte: month.end },
            },
            _sum: { amount: true },
          }),
        ]);
        return {
          month: month.label,
          income: Number(inc._sum.amount ?? 0),
          expense: Number(exp._sum.amount ?? 0),
        };
      }),
    );

    const categoryExpenses = await prisma.transactions.groupBy({
      by: ["categoryId"],
      where: { userId, type: "expense" },
      _sum: { amount: true },
    });

    const categoryDetails = await Promise.all(
      categoryExpenses.map(async (item) => {
        const category = await prisma.categories.findFirst({
          where: { id: item.categoryId },
          select: { name: true, color: true },
        });
        return {
          name: category?.name ?? "Unknown",
          color: category?.color ?? "#94a3b8",
          value: Number(item._sum.amount ?? 0),
        };
      }),
    );

    const budgets = await prisma.budgets.findMany({
      where: { userId },
      include: { category: { select: { name: true, color: true } } },
    });

    const budgetVsActual = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transactions.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: "expense",
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });
        const spentAmount = Number(spent._sum.amount ?? 0);
        return {
          name: budget.category.name,
          color: budget.category.color ?? "#94a3b8",
          budget: Number(budget.amount),
          spent: spentAmount,
        };
      }),
    );

    const recentTransactions = await prisma.transactions.findMany({
      where: { userId },
      include: { category: { select: { name: true, color: true } } },
      orderBy: { date: "desc" },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        monthlyData,
        categoryExpenses: categoryDetails,
        budgetVsActual,
        recentTransactions: recentTransactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};
