import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendTransactionalEmail } from "@/lib/email"
import { emailVerificationTemplate } from "@/emails/templates"

const EMAIL_VERIFICATION_TTL_HOURS = 24

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000"
}

export async function createEmailVerificationToken(email: string) {
  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000)

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  return token
}

export async function sendEmailVerification(email: string) {
  const token = await createEmailVerificationToken(email)
  const verificationUrl = `${getBaseUrl()}/verification-email?token=${token}`
  const template = emailVerificationTemplate(verificationUrl)

  await sendTransactionalEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  })

  return { token, verificationUrl }
}

export async function verifyEmailToken(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return { ok: false, reason: "invalid" as const }
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    })

    return { ok: false, reason: "expired" as const }
  }

  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
    select: { role: true },
  })

  await prisma.$transaction([
    prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { token },
    }),
  ])

  return { ok: true as const, role: user?.role ?? null }
}
