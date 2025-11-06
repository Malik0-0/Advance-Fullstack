import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { StockBatchSchema, StockItem } from "../validation/supplierStock.schema";

/**
 * POST /suppliers/stock
 * Body: { updates: [{ supplierId, productId, type: "IN"|"OUT", quantity, note? }, ...] }
 * - Validates input
 * - Ensures all suppliers/products exist
 * - Ensures no product ends up with negative stock
 * - Writes StockMovement rows
 * - Updates Product.stock in a single transaction
 */
export const batchUpdateStock = async (req: Request, res: Response) => {
  const parse = StockBatchSchema.safeParse(req.body);
  if (!parse.success) {
    throw new AppError(400, "Invalid payload", "VALIDATION_ERROR");
  }
  const updates = parse.data.updates;

  // group deltas per product to validate final stock before applying
  const deltasByProduct = new Map<number, number>();
  updates.forEach((u) => {
    const delta = u.type === "IN" ? u.quantity : -u.quantity;
    deltasByProduct.set(u.productId, (deltasByProduct.get(u.productId) ?? 0) + delta);
  });

  const productIds = Array.from(deltasByProduct.keys());
  const supplierIds = Array.from(new Set(updates.map(u => u.supplierId)));

  // prefetch to validate existence
  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, stock: true } }),
    prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true } }),
  ]);

  const foundProductIds = new Set(products.map(p => p.id));
  const foundSupplierIds = new Set(suppliers.map(s => s.id));

  // existence checks
  const missingProduct = updates.find(u => !foundProductIds.has(u.productId));
  if (missingProduct) throw new AppError(404, `Product ${missingProduct.productId} not found`, "NOT_FOUND");

  const missingSupplier = updates.find(u => !foundSupplierIds.has(u.supplierId));
  if (missingSupplier) throw new AppError(404, `Supplier ${missingSupplier.supplierId} not found`, "NOT_FOUND");

  // negative stock check
  for (const p of products) {
    const projected = p.stock + (deltasByProduct.get(p.id) ?? 0);
    if (projected < 0) {
      throw new AppError(409, `Negative stock for product ${p.id} (${projected})`, "NEGATIVE_STOCK");
    }
  }

  // apply in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1) insert stock movements
    await tx.stockMovement.createMany({
      data: updates.map((u) => ({
        supplierId: u.supplierId,
        productId: u.productId,
        type: u.type,
        quantity: u.quantity,
        note: u.note,
      })),
    });

    // 2) update products' stock
    for (const [productId, delta] of deltasByProduct.entries()) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: delta } },
      });
    }

    // 3) return affected products (fresh values)
    const affected = await tx.product.findMany({
      where: { id: { in: productIds } },
      orderBy: { id: "asc" },
      select: { id: true, stock: true, name: true },
    });
    return affected;
  });
  
  return res.ok(result, "Stock updated successfully");
};
