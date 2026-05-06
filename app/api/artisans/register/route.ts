import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { artisanRegisterSchema } from "@/lib/validations/artisan-register"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = artisanRegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const {
      name,
      email,
      password,
      phone,
      companyName,
      siren,
      siret,
      address,
      postalCode,
      city,
      kbisUrl,
      insuranceUrl,
    } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 }
      )
    }

    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [{ email }, { phone }, { siren }, { siret }],
      },
      select: { id: true },
    })

    if (existingCompany) {
      return NextResponse.json(
        {
          error:
            "Une entreprise existe déjà avec cet email, téléphone, SIREN ou SIRET.",
        },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ARTISAN",
        companyStatus: "PENDING",
        company: {
          create: {
            legalName: companyName,
            email,
            phone,
            siren,
            siret,
            address,
            postalCode,
            city,
            kbisUrl,
            insuranceDecennaleUrl: insuranceUrl,
            status: "PENDING",
          },
        },
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
        companyId: user.company?.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("ARTISAN_REGISTER_ERROR", error)

    return NextResponse.json(
      { error: "Une erreur est survenue pendant l'inscription." },
      { status: 500 }
    )
  }
}