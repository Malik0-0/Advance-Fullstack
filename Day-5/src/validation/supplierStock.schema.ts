import { z } from "zod";

export const StockItemSchema = z.object({
  supplierId: z.number().int().positive(),
  productId:  z.number().int().positive(),
  type:       z.enum(["IN", "OUT"]),
  quantity:   z.number().int().positive(),
  note:       z.string().max(200).optional(),
});

export const StockBatchSchema = z.object({
  updates: z.array(StockItemSchema).min(1)
});

export type StockItem = z.infer<typeof StockItemSchema>;
export type StockBatch = z.infer<typeof StockBatchSchema>;
