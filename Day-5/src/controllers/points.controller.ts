import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AppError } from "../errors/AppError";

export const transferPoints = async (req: Request, res: Response) => {
  const { fromUserId, toUserId, amount } = req.body ?? {};

  // basic validation
  if (!fromUserId || !toUserId || typeof amount !== "number")
    throw new AppError(400, "fromUserId, toUserId, amount are required", "VALIDATION_ERROR");
  if (fromUserId === toUserId)
    throw new AppError(400, "Cannot transfer to the same user", "VALIDATION_ERROR");
  if (amount <= 0)
    throw new AppError(400, "Amount must be > 0", "VALIDATION_ERROR");

  // make sure both users exist first
  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: Number(fromUserId) }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: Number(toUserId) }, select: { id: true } }),
  ]);
  if (!fromUser) throw new AppError(404, "Sender not found", "SENDER_NOT_FOUND");
  if (!toUser) throw new AppError(404, "Recipient not found", "RECIPIENT_NOT_FOUND");

  // perform atomic transfer
  const result = await prisma.$transaction(async (tx) => {
    // atomic debit with balance guard
    const debited = await tx.user.updateMany({
      where: { id: Number(fromUserId), points: { gte: amount } },
      data: { points: { decrement: amount } },
    });
    if (debited.count !== 1) {
      throw new AppError(409, "Insufficient points", "INSUFFICIENT_POINTS");
    }

    // credit recipient
    await tx.user.update({
      where: { id: Number(toUserId) },
      data: { points: { increment: amount } },
    });

    // return new balances
    const [fromAfter, toAfter] = await Promise.all([
      tx.user.findUnique({ where: { id: Number(fromUserId) }, select: { id: true, name: true, points: true } }),
      tx.user.findUnique({ where: { id: Number(toUserId) },   select: { id: true, name: true, points: true } }),
    ]);

    return { from: fromAfter, to: toAfter };
  });

  return res.ok(result, "Points transferred successfully");
};

// admin-only
export const topUpPoints = async (req: Request, res: Response) => {
  const { userId, amount } = req.body ?? {};
  if (!userId || typeof amount !== "number") {
    throw new AppError(400, "userId and amount are required", "VALIDATION_ERROR");
  }
  if (amount <= 0) throw new AppError(400, "Amount must be > 0", "VALIDATION_ERROR");

  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: { points: { increment: amount } },
    select: { id: true, name: true, points: true },
  });

  return res.ok(user, "Points topped up successfully");
};