import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { ProductCreateSchema } from "../validation/supplierValidator.schema";
import { StockBatchSchema} from "../validation/supplierStock.schema";

export const myProducts = async (req: Request, res: Response) => {
  const sup = (req as any).supplier as { id: number };

  const rows = await prisma.product.findMany({
    where: {
      supplierProducts: {                // <-- use the correct relation name
        some: { supplierId: sup.id },
      },
    },
    orderBy: { id: "asc" },
    select: { id: true, name: true, price: true, stock: true },
  });

  return res.ok(rows, "Supplier products");
};

export const updateMyProduct = async (req: Request, res: Response) => {
  const sup = (req as any).supplier as { id: number; role: "ADMIN" | "SUPPLIER" };
  const productId = Number(req.params.productId);

  // check ownership (or allow ADMIN)
  if (sup.role !== "ADMIN") {
    const owns = await prisma.supplierProduct.findUnique({
      where: { supplierId_productId: { supplierId: sup.id, productId } },
      select: { supplierId: true }
    });
    if (!owns) return res.status(403).json({ success: false, message: "You are not assigned to this product" });
  }

  const { name, price, stock } = req.body ?? {};
  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(price !== undefined ? { price: Number(price) } : {}),
      ...(stock !== undefined ? { stock: Number(stock) } : {}),
    },
    select: { id: true, name: true, price: true, stock: true }
  });

  return res.updated(updated, "Product updated");
};

export const batchUpdateStock = async (req: Request, res: Response) => {
  const parse = StockBatchSchema.safeParse(req.body);
  if (!parse.success) throw new AppError(400, "Invalid payload", "VALIDATION_ERROR");

  const sup = (req as any).supplier as { id: number; role: "SUPPLIER" | "ADMIN" };
  const updates = parse.data.updates;

  // If supplier (not admin), force their own id and ownership of each product
  if (sup.role !== "ADMIN") {
    // all updates must be from the logged-in supplier
    const bad = updates.find(u => u.supplierId !== sup.id);
    if (bad) throw new AppError(403, "You can only update your own supplierId", "FORBIDDEN");

    // ensure supplier owns all products being updated
    const productIds = Array.from(new Set(updates.map(u => u.productId)));
    const owns = await prisma.supplierProduct.findMany({
      where: { supplierId: sup.id, productId: { in: productIds } },
      select: { productId: true },
    });
    const ownedSet = new Set(owns.map(o => o.productId));
    const notOwned = productIds.filter(pid => !ownedSet.has(pid));
    if (notOwned.length) {
      throw new AppError(403, `You are not assigned to products: ${notOwned.join(", ")}`, "FORBIDDEN");
    }
  }

  // group deltas per product
  const deltasByProduct = new Map<number, number>();
  for (const u of updates) {
    const delta = u.type === "IN" ? u.quantity : -u.quantity;
    deltasByProduct.set(u.productId, (deltasByProduct.get(u.productId) ?? 0) + delta);
  }

  const productIds = Array.from(deltasByProduct.keys());
  const supplierIds = Array.from(new Set(updates.map(u => u.supplierId)));

  // pre-validate existence
  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, stock: true } }),
    prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true } }),
  ]);

  const foundProducts = new Set(products.map(p => p.id));
  const foundSuppliers = new Set(suppliers.map(s => s.id));
  const missingProduct = updates.find(u => !foundProducts.has(u.productId));
  if (missingProduct) throw new AppError(404, `Product ${missingProduct.productId} not found`, "NOT_FOUND");
  const missingSupplier = updates.find(u => !foundSuppliers.has(u.supplierId));
  if (missingSupplier) throw new AppError(404, `Supplier ${missingSupplier.supplierId} not found`, "NOT_FOUND");

  // negative stock check
  for (const p of products) {
    const projected = p.stock + (deltasByProduct.get(p.id) ?? 0);
    if (projected < 0) throw new AppError(409, `Negative stock for product ${p.id} (${projected})`, "NEGATIVE_STOCK");
  }

  // apply within one transaction
  const result = await prisma.$transaction(async (tx) => {
    await tx.stockMovement.createMany({
      data: updates.map(u => ({
        supplierId: u.supplierId,
        productId: u.productId,
        type: u.type,
        quantity: u.quantity,
        note: u.note,
      })),
    });

    for (const [productId, delta] of deltasByProduct.entries()) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: delta } },
      });
    }

    return tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true },
      orderBy: { id: "asc" },
    });
  });

  return res.ok(result, "Stock updated");
};

// validated public create (requires login)
export const addProduct = async (req: Request, res: Response) => {
  const parse = ProductCreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: "Invalid input", issues: parse.error.flatten() });
  }
  const { name, price, stock } = parse.data;
  const created = await prisma.product.create({
    data: { name, price, stock },
    select: { id: true, name: true, price: true, stock: true }
  });
  return res.created(created, "Product created");
};

export const assignProduct = async (req: Request, res: Response) => {
  const { supplierId, productId } = req.body ?? {};
  const assigned = await prisma.supplierProduct.upsert({
    where: { supplierId_productId: { supplierId: Number(supplierId), productId: Number(productId) } },
    create: { supplierId: Number(supplierId), productId: Number(productId) },
    update: {},
    include: { product: { select: { id: true, name: true, price: true, stock: true, }, }, supplier: { select: { id: true, name: true }, }, },
  });
  return res.ok(assigned, "Assigned");
};