import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  documentUploadRequestSchema,
  prepareCompanyDocumentUpload,
} from "@/lib/storage"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const role = (session.user as { role?: string }).role

  if (role !== "ARTISAN") {
    return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = documentUploadRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload invalide", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const uploadTarget = prepareCompanyDocumentUpload({
      userId: String((session.user as { id?: string }).id ?? ""),
      documentType: parsed.data.documentType,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
    })

    return NextResponse.json({
      ready: true,
      uploadTarget,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage indisponible"

    return NextResponse.json({ error: message }, { status: 503 })
  }
}
