import { Router } from "express";
import { uploadProductImage, getProductImage, deleteProductImage } from "../controllers/products.image.controller";
import { supplierAuth, allowRoles } from "../middlewares/supplier-auth.middleware";
import { uploadSingleImage, multerErrorHandler } from "../middlewares/upload.middleware";
import { strictRateLimiter } from "../middlewares/rate-limit.middleware";


const router = Router();

router.post("/products/:id/upload-image", strictRateLimiter, supplierAuth, allowRoles("SUPPLIER", "ADMIN"), uploadSingleImage, multerErrorHandler, uploadProductImage);
router.get("/products/:id/image", getProductImage);
router.delete("/products/:id/image", supplierAuth, allowRoles("SUPPLIER", "ADMIN"), deleteProductImage);

export default router;
