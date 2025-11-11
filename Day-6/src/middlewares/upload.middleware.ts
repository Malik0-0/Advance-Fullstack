import multer from "multer";
import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 2_000_000) }, // default 2MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      // TypeScript sometimes complains about passing Error directly, so cast to any
      return cb(new Error("Invalid file type") as any, false);
    }
    cb(null, true);
  },
});

export const uploadSingleImage = upload.single("image");

// small wrapper to surface validation errors as HTTP 400
export function multerErrorHandler(err: any, _req: Request, res: Response, next: NextFunction) {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  // any other error from fileFilter will be handled here
  return res.status(400).json({ success: false, message: err.message || "Upload error" });
}