import { PrismaClient, UserRole, CompanyStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ARTISAN_TEST_EMAIL ?? "artisan.test@fondatia.fr";
  const password = process.env.ARTISAN_TEST_PASSWORD ?? "Test1234!";
  const name = process.env.ARTISAN_TEST_NAME ?? "Artisan Test Fondatia";
  const legalName = process.env.ARTISAN_TEST_LEGAL_NAME ?? "FONDATIA Artisan Test";
  const siren = process.env.ARTISAN_TEST_SIREN ?? "823456781";
  const phone = process.env.ARTISAN_TEST_PHONE ?? "0601020304";
  const address = process.env.ARTISAN_TEST_ADDRESS ?? "12 rue des Artisans";
  const postalCode = process.env.ARTISAN_TEST_POSTAL_CODE ?? "75011";
  const city = process.env.ARTISAN_TEST_CITY ?? "Paris";
  const kbisUrl = process.env.ARTISAN_TEST_KBIS_URL ?? "https://example.com/kbis-artisan-test.pdf";
  const insuranceDecennaleUrl =
    process.env.ARTISAN_TEST_INSURANCE_URL ?? "https://example.com/assurance-artisan-test.pdf";

  const normalizedEmail = email.toLowerCase();
  const passwordHash = await hash(password, 12);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { company: true },
  });

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: UserRole.ARTISAN,
        companyStatus: CompanyStatus.APPROVED,
        emailVerified: new Date(),
        company: {
          create: {
            legalName,
            siren,
            siret: null,
            email: normalizedEmail,
            phone,
            postalCode,
            city,
            address,
            kbisUrl,
            insuranceDecennaleUrl,
            identityCardFrontUrl: null,
            identityCardBackUrl: null,
            status: CompanyStatus.APPROVED,
            validatedAt: new Date(),
          },
        },
      },
      include: { company: true },
    });

    console.log(`Test artisan created: ${user.email}`);
    console.log(`Password: ${password}`);
    return;
  }

  const companyId = existingUser.company?.id;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        passwordHash,
        role: UserRole.ARTISAN,
        companyStatus: CompanyStatus.APPROVED,
        emailVerified: new Date(),
      },
    });

    if (companyId) {
      await tx.company.update({
        where: { id: companyId },
        data: {
          legalName,
          siren,
          email: normalizedEmail,
          phone,
          postalCode,
          city,
          address,
          kbisUrl,
          insuranceDecennaleUrl,
          status: CompanyStatus.APPROVED,
          validatedAt: new Date(),
          rejectedReason: null,
        },
      });
    } else {
      await tx.company.create({
        data: {
          userId: existingUser.id,
          legalName,
          siren,
          siret: null,
          email: normalizedEmail,
          phone,
          postalCode,
          city,
          address,
          kbisUrl,
          insuranceDecennaleUrl,
          identityCardFrontUrl: null,
          identityCardBackUrl: null,
          status: CompanyStatus.APPROVED,
          validatedAt: new Date(),
        },
      });
    }
  });

  console.log(`Test artisan ready: ${normalizedEmail}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
