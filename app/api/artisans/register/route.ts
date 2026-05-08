import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { artisanRegisterSchema } from "@/lib/validations/artisan-register"
import { sendTransactionalEmail } from "@/lib/email"
import { applicationReceivedTemplate } from "@/emails/templates"
import { sendEmailVerification } from "@/lib/email-verification"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = artisanRegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Merci de corriger les champs encadres en rouge.",
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
      profileType,
      legalName,
      siren,
      address,
      postalCode,
      city,
      kbisUrl,
      insuranceDecennaleUrl,
      identityCardFrontUrl,
      identityCardBackUrl,
    } = parsed.data

    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Merci de corriger les champs encadres en rouge.",
          details: {
            fieldErrors: {
              email: ["Un compte existe deja avec cet email."],
            },
          },
        },
        { status: 409 }
      )
    }

    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone }, { siren }],
      },
      select: { email: true, phone: true, siren: true },
    })

    if (existingCompany) {
      const fieldErrors: Record<string, string[]> = {}

      if (existingCompany.email === normalizedEmail) {
        fieldErrors.email = ["Une entreprise existe deja avec cet email."]
      }

      if (existingCompany.phone === phone) {
        fieldErrors.phone = ["Une entreprise existe deja avec ce numero de telephone."]
      }

      if (existingCompany.siren === siren) {
        fieldErrors.siren = ["Une entreprise existe deja avec ce SIREN."]
      }

      return NextResponse.json(
        {
          error: "Merci de corriger les champs encadres en rouge.",
          details: { fieldErrors },
        },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const companyStatus = profileType === "ARTISAN" ? "PENDING" : "APPROVED"

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: profileType,
        companyStatus,
        company: {
          create: {
            legalName,
            email: normalizedEmail,
            phone,
            siren,
            siret: null,
            address,
            postalCode,
            city,
            kbisUrl,
            insuranceDecennaleUrl,
            identityCardFrontUrl,
            identityCardBackUrl,
            status: companyStatus,
          },
        },
      },
      include: {
        company: true,
      },
    })

    const sideEffects = [sendEmailVerification(normalizedEmail)]

    if (profileType === "ARTISAN") {
      const template = applicationReceivedTemplate(legalName)

      sideEffects.push(
        sendTransactionalEmail({
          to: normalizedEmail,
          subject: template.subject,
          html: template.html,
        })
      )
    }

    await Promise.allSettled(sideEffects)

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
        companyId: user.company?.id,
        redirectTo: `/validation-en-attente?email=${encodeURIComponent(normalizedEmail)}&profileType=${profileType}`,
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
