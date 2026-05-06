import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendTransactionalEmail } from "@/lib/email"
import {
  applicationApprovedTemplate,
  applicationRejectedTemplate,
} from "@/emails/templates"

const payloadSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "BLOCKED"]),
  rejectedReason: z.string().trim().max(500).optional(),
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { companyId } = await context.params
  const existingCompany = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!existingCompany) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  const rejectedReason =
    parsed.data.status === "REJECTED"
      ? parsed.data.rejectedReason?.trim() || null
      : null

  const validatedAt =
    parsed.data.status === "APPROVED"
      ? existingCompany.validatedAt ?? new Date()
      : parsed.data.status === "BLOCKED"
        ? existingCompany.validatedAt
        : null

  const updatedCompany = await prisma.$transaction(async (transaction) => {
    const company = await transaction.company.update({
      where: { id: companyId },
      data: {
        status: parsed.data.status,
        rejectedReason,
        validatedAt,
      },
    })

    await transaction.user.update({
      where: { id: company.userId },
      data: {
        companyStatus: parsed.data.status,
      },
    })

    return company
  })

  if (parsed.data.status === "APPROVED") {
    const template = applicationApprovedTemplate(updatedCompany.legalName)

    await sendTransactionalEmail({
      to: updatedCompany.email,
      subject: template.subject,
      html: template.html,
    }).catch(() => null)
  }

  if (parsed.data.status === "REJECTED") {
    const template = applicationRejectedTemplate(
      updatedCompany.legalName,
      rejectedReason ?? undefined
    )

    await sendTransactionalEmail({
      to: updatedCompany.email,
      subject: template.subject,
      html: template.html,
    }).catch(() => null)
  }

  return NextResponse.json({
    ok: true,
    company: updatedCompany,
  })
}
