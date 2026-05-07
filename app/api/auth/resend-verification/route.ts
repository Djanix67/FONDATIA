import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { sendEmailVerification } from "@/lib/email-verification"

const payloadSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Aucun compte trouve pour cet email." }, { status: 404 })
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "Cet email est deja verifie." }, { status: 409 })
  }

  await sendEmailVerification(email)

  return NextResponse.json({ ok: true })
}
