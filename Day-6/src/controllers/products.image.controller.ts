import { Request, Response } from "express";
import prisma from "../lib/prisma";
import sharp from "sharp";
import { bufferToPrismaUint8 } from "../utils/buffer-to-prisma";

const MAX_DIM = Number(process.env.IMAGE_MAX_DIM ?? 1024); // px

export const uploadProductImage = async (req: Request, res: Response) => {
  const sup = (req as any).supplier as { id: number; role: "SUPPLIER" | "ADMIN" } | undefined;
  const productId = Number(req.params.id);
  const file = (req as any).file as Express.Multer.File | undefined;

  if (!file) return res.status(400).json({ success: false, message: "image file is required" });

  // validate product existence
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  // if supplier, check assignment ownership
  if (sup?.role !== "ADMIN") {
    const owns = await prisma.supplierProduct.findUnique({
      where: { supplierId_productId: { supplierId: sup?.id ?? -1, productId } }
    });
    if (!owns) return res.status(403).json({ success: false, message: "You are not assigned to this product" });
  }

  // sanitize/resize with sharp
  let buffer = file.buffer;
  try {
    buffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
      .toFormat(file.mimetype.includes("png") ? "png" : file.mimetype.includes("webp") ? "webp" : "jpeg", { quality: 85 })
      .withMetadata({ exif: undefined })
      .toBuffer();
  } catch {
    // ignore and fall back to original
  }

  const dataForPrisma = bufferToPrismaUint8(buffer);

  const rec = await prisma.productImage.upsert({
    where: { productId },
    create: {
      productId,
      mimeType: file.mimetype,
      size: buffer.length,
      data: dataForPrisma as unknown as Uint8Array<ArrayBuffer>
    },
    update: {
      mimeType: file.mimetype,
      size: buffer.length,
      data: dataForPrisma as unknown as Uint8Array<ArrayBuffer>
    },
    select: { id: true, productId: true, mimeType: true, size: true, updatedAt: true }
  });

  return (res as any).created ? (res as any).created(rec, "Image uploaded") : res.status(201).json({ success: true, message: "Image uploaded", data: rec });
};

export const getProductImage = async (req: Request, res: Response) => {
  const productId = Number(req.params.id);
  const img = await prisma.productImage.findUnique({ where: { productId } });
  if (!img) return res.status(404).json({ success: false, message: "Image not found" });

  // convert to Buffer then send
  const buf = Buffer.from(img.data as unknown as Uint8Array);
  res.setHeader("Content-Type", img.mimeType);
  res.setHeader("Content-Length", String(img.size));
  return res.send(buf);
};

export const deleteProductImage = async (req: Request, res: Response) => {
  const sup = (req as any).supplier as { id: number; role: "ADMIN" | "SUPPLIER" } | undefined;
  const productId = Number(req.params.id);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  if (sup?.role !== "ADMIN") {
    const owns = await prisma.supplierProduct.findUnique({
      where: { supplierId_productId: { supplierId: sup?.id ?? -1, productId } }
    });
    if (!owns) return res.status(403).json({ success: false, message: "You are not assigned to this product" });
  }

  await prisma.productImage.delete({ where: { productId } }).catch(() => null);
  return (res as any).ok ? (res as any).ok(null, "Image deleted") : res.json({ success: true, message: "Image deleted" });
};
