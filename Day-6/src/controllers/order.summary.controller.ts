import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * GET /orders/summary
 * Returns total orders count and total amount per user.
 * Query:
 *  - limit, offset (pagination on summary rows)
 *  - minTotal (optional: filter users whose _sum.total >= minTotal)
 */
export const ordersSummary = async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  const minTotal = req.query.minTotal ? Number(req.query.minTotal) : undefined;

  // 1) group orders by userId
  const grouped = await prisma.order.groupBy({
    by: ["userId"],
    _count: { _all: true },
    _sum: { total: true },
    orderBy: { userId: "asc" },
  });

  // 2) optional filter + pagination (done in memory since Prisma groupBy doesn't support having on aggregates + pagination together easily)
  const filtered = grouped.filter(g => {
    if (typeof minTotal === "number") {
      const sum = g._sum?.total ?? 0;
      return sum >= minTotal;
    }
    return true;
  });

  const totalRows = filtered.length;
  const pageRows = filtered.slice(offset, offset + limit);

  // 3) fetch user info for the page rows
  const userIds = pageRows.map(r => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  const data = pageRows.map(r => ({
    user: userMap.get(r.userId) ?? { id: r.userId, name: null, email: null },
    ordersCount: r._count._all,
    totalAmount: r._sum.total ?? 0,
  }));

  return res.paginated(
    data,
    { limit, offset, total: totalRows },
    "Products fetched successfully"
  );
};
