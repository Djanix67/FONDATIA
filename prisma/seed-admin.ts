import { PrismaClient, UserRole, CompanyStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const forcePasswordReset = process.env.ADMIN_PASSWORD_FORCE_RESET === "true";
  const name = process.env.ADMIN_NAME ?? "Admin Fondatia";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in .env");
  }

  const normalizedEmail = email.toLowerCase();
  const existingAdmin = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (!existingAdmin) {
    const passwordHash = await hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: UserRole.ADMIN,
        companyStatus: CompanyStatus.APPROVED,
        emailVerified: new Date(),
      },
    });

    console.log(`Admin created: ${admin.email}`);
    return;
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: {
      name,
      role: UserRole.ADMIN,
      companyStatus: CompanyStatus.APPROVED,
      emailVerified: new Date(),
      ...(forcePasswordReset ? { passwordHash: await hash(password, 12) } : {}),
    },
  });

  console.log(
    forcePasswordReset
      ? `Admin updated and password reset: ${normalizedEmail}`
      : `Admin updated without changing password: ${normalizedEmail}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
