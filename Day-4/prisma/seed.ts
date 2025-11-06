import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
      { name: "Charlie", email: "charlie@example.com" },
    ],
    skipDuplicates: true,
  });

  await prisma.supplier.createMany({
    data: [
      { name: "PT. Sumber Jaya", email: "sumber@example.com" },
      { name: "CV. Maju Makmur", email: "maju@example.com" }
    ],
    skipDuplicates: true,
  });
  

  console.log("✅ Seeded users");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
