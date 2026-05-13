import { PrismaClient, UserRole, CompanyStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DONOR_TEST_EMAIL ?? "donneur-test@fondatia.fr";
  const password = process.env.DONOR_TEST_PASSWORD ?? "DonneurFondatia2026!";
  const name = process.env.DONOR_TEST_NAME ?? "Donneur Test Fondatia";
  const legalName = process.env.DONOR_TEST_LEGAL_NAME ?? "FONDATIA Donneur Test";
  const siren = process.env.DONOR_TEST_SIREN ?? "923456781";
  const phone = process.env.DONOR_TEST_PHONE ?? "0611223344";
  const address = process.env.DONOR_TEST_ADDRESS ?? "10 avenue du Test";
  const postalCode = process.env.DONOR_TEST_POSTAL_CODE ?? "75008";
  const city = process.env.DONOR_TEST_CITY ?? "Paris";
  const kbisUrl = process.env.DONOR_TEST_KBIS_URL ?? "https://example.com/kbis-donneur-test.pdf";
  const insuranceDecennaleUrl =
    process.env.DONOR_TEST_INSURANCE_URL ?? "https://example.com/assurance-donneur-test.pdf";

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
        role: UserRole.DONNEUR,
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

    console.log(`Test donor created: ${user.email}`);
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
        role: UserRole.DONNEUR,
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

  console.log(`Test donor ready: ${normalizedEmail}`);
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
