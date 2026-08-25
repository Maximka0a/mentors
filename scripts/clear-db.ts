import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.reviewState.deleteMany();
  await prisma.question.deleteMany();
  await prisma.category.deleteMany();
  console.log("Cleared reviewState, question, category tables.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
