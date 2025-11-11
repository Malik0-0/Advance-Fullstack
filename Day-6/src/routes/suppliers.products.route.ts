import { Router } from "express";
import { supplierAuth, allowRoles } from "../middlewares/supplier-auth.middleware";
import { myProducts, updateMyProduct, addProduct, assignProduct, batchUpdateStock } from "../controllers/suppliers.products.controller";

const router = Router();

router.get("/suppliers/products", supplierAuth, allowRoles("SUPPLIER", "ADMIN"), myProducts);

router.put("/suppliers/products/:productId", supplierAuth, allowRoles("SUPPLIER", "ADMIN"), updateMyProduct);

router.post("/products/add", supplierAuth, allowRoles("SUPPLIER", "ADMIN"), addProduct);
router.post( "/suppliers/assign", supplierAuth, allowRoles("ADMIN"), assignProduct );
router.post("/suppliers/stock/batch", supplierAuth, allowRoles("SUPPLIER", "ADMIN"), batchUpdateStock);

export default router;