import { PrismaClient, UserRole, CompanyStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin Fondatia";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in .env");
  }

  const normalizedEmail = email.toLowerCase();
  const passwordHash = await hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name,
      passwordHash,
      role: UserRole.ADMIN,
      companyStatus: CompanyStatus.APPROVED,
      emailVerified: new Date(),
    },
    create: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: UserRole.ADMIN,
      companyStatus: CompanyStatus.APPROVED,
      emailVerified: new Date(),
    },
  });

  console.log(`Admin password reset: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
