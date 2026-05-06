import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = updateStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }

    const company = await prisma.company.update({
      where: { id },
      data: { status: parsed.data.status },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    })

    await prisma.user.update({
      where: { id: company.userId },
      data: { companyStatus: parsed.data.status },
    })

    return NextResponse.json({ success: true, company })
  } catch (error) {
    console.error("ADMIN_COMPANY_STATUS_UPDATE_ERROR", error)

    return NextResponse.json(
      { error: "Impossible de mettre à jour le statut." },
      { status: 500 }
    )
  }
}