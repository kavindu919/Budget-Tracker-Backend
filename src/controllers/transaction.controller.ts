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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};
