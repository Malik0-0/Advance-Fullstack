import { Request, Response } from "express";
import prisma from "../lib/prisma";
import sharp from "sharp";

function bufferToUint8Array(buf: Buffer): Uint8Array {
    // create a new ArrayBuffer-backed view and copy bytes in
    const out = new Uint8Array(buf.length);
    out.set(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
    return out;
  }

function uint8ArrayToBuffer(u: Uint8Array | Buffer | any): Buffer {
  if (Buffer.isBuffer(u)) return u as Buffer;
  return Buffer.from(u);
}

export const uploadMyAvatar = async (req: Request, res: Response) => {
  const user = (req as any).user as { id: number };
  const file = (req as any).file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ success: false, message: "Avatar file is required" });
  }

  // sanitize/resize to ~512px
  let buffer = file.buffer;
  try {
    buffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
      .toFormat(
        file.mimetype.includes("png") ? "png" :
        file.mimetype.includes("webp") ? "webp" : "jpeg",
        { quality: 85 }
      )
      .withMetadata({ exif: undefined })
      .toBuffer();
  } catch {
    // fallback to original buffer if sharp fails
  }

  // Convert to Prisma-compatible Uint8Array<ArrayBuffer>
  const dataForPrisma = bufferToUint8Array(buffer);

  const record = await prisma.userAvatar.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      mimeType: file.mimetype,
      size: buffer.length,
      // local, explicit cast to match Prisma generated signature
      data: bufferToUint8Array(buffer) as unknown as Uint8Array<ArrayBuffer>,
    },
    update: {
      mimeType: file.mimetype,
      size: buffer.length,
      data: bufferToUint8Array(buffer) as unknown as Uint8Array<ArrayBuffer>,
    },
    select: { userId: true, mimeType: true, size: true, updatedAt: true },
  });

  return (res as any).ok ? (res as any).ok(record, "Profile picture uploaded") : res.json({ success: true, data: record });
};

export const getAvatar = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const avatar = await prisma.userAvatar.findUnique({ where: { userId: id } });
  if (!avatar) return res.status(404).json({ success: false, message: "Avatar not found" });

  const buf = uint8ArrayToBuffer(avatar.data);
  res.setHeader("Content-Type", avatar.mimeType);
  res.setHeader("Content-Length", String(avatar.size));
  return res.send(buf);
};

export const deleteMyAvatar = async (req: Request, res: Response) => {
  const user = (req as any).user as { id: number };
  await prisma.userAvatar.delete({ where: { userId: user.id } }).catch(() => null);
  return (res as any).ok ? (res as any).ok(null, "Profile picture removed") : res.json({ success: true });
};
