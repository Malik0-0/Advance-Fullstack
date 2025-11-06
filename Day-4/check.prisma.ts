// scripts/check-prisma.ts (temporary)
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
console.log(Object.keys(p)); // should include 'supplier' and 'stockMovement'
