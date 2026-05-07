import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { companyDocumentTypeSchema, uploadSignupDocument } from "@/lib/storage"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const fileEntry = formData.get("file")
    const documentTypeEntry = formData.get("documentType")
    const draftIdEntry = formData.get("draftId")

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant." }, { status: 400 })
    }

    const parsedType = companyDocumentTypeSchema.safeParse(documentTypeEntry)

    if (!parsedType.success) {
      return NextResponse.json({ error: "Type de document invalide." }, { status: 400 })
    }

    const draftId =
      typeof draftIdEntry === "string" && draftIdEntry.trim().length > 0
        ? draftIdEntry.trim()
        : randomUUID()

    const upload = await uploadSignupDocument({
      draftId,
      documentType: parsedType.data,
      file: fileEntry,
    })

    return NextResponse.json({
      success: true,
      draftId,
      documentType: parsedType.data,
      bucket: upload.bucket,
      path: upload.path,
      url: upload.url,
    })
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Upload impossible."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
