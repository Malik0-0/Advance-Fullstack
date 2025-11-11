import multer from "multer";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.memoryStorage();

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new Error("Only JPEG/PNG/WEBP images are allowed"));
    }
    cb(null, true);
  },
}).single("avatar");