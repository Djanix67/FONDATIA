"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"

type DocumentFieldName =
  | "kbisUrl"
  | "insuranceDecennaleUrl"
  | "identityCardFrontUrl"
  | "identityCardBackUrl"

type UploadState = {
  isUploading: boolean
  fileName: string
  error: string
}

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  profileType: "ARTISAN",
  legalName: "",
  siren: "",
  siret: "",
  address: "",
  postalCode: "",
  city: "",
  kbisUrl: "",
  insuranceDecennaleUrl: "",
  identityCardFrontUrl: "",
  identityCardBackUrl: "",
} as const

const initialUploadState: Record<DocumentFieldName, UploadState> = {
  kbisUrl: { isUploading: false, fileName: "", error: "" },
  insuranceDecennaleUrl: { isUploading: false, fileName: "", error: "" },
  identityCardFrontUrl: { isUploading: false, fileName: "", error: "" },
  identityCardBackUrl: { isUploading: false, fileName: "", error: "" },
}

const documentConfigs: Array<{
  field: DocumentFieldName
  documentType: "kbis" | "insuranceDecennale" | "identityCardFront" | "identityCardBack"
  label: string
  description: string
}> = [
  {
    field: "kbisUrl",
    documentType: "kbis",
    label: "KBIS",
    description: "PDF ou image nette du document officiel.",
  },
  {
    field: "insuranceDecennaleUrl",
    documentType: "insuranceDecennale",
    label: "Attestation decennale",
    description: "Attestation en cours de validite au format PDF ou image.",
  },
  {
    field: "identityCardFrontUrl",
    documentType: "identityCardFront",
    label: "Carte d'identite recto",
    description: "Recto lisible de la piece d'identite du gerant.",
  },
  {
    field: "identityCardBackUrl",
    documentType: "identityCardBack",
    label: "Carte d'identite verso",
    description: "Verso lisible de la piece d'identite du gerant.",
  },
]

export default function InscriptionArtisanPage() {
  const router = useRouter()
  const [form, setForm] = useState(initialForm)
  const [uploadState, setUploadState] = useState(initialUploadState)
  const [draftId, setDraftId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const updateField = (key: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateUploadState = (field: DocumentFieldName, next: Partial<UploadState>) => {
    setUploadState((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        ...next,
      },
    }))
  }

  const handleDocumentUpload = async (
    field: DocumentFieldName,
    documentType: "kbis" | "insuranceDecennale" | "identityCardFront" | "identityCardBack",
    file: File
  ) => {
    setError("")
    updateUploadState(field, {
      isUploading: true,
      error: "",
      fileName: file.name,
    })

    try {
      const payload = new FormData()
      payload.append("file", file)
      payload.append("documentType", documentType)

      if (draftId) {
        payload.append("draftId", draftId)
      }

      const response = await fetch("/api/storage/signup-upload", {
        method: "POST",
        body: payload,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Upload impossible")
      }

      if (typeof data?.draftId === "string" && data.draftId) {
        setDraftId(data.draftId)
      }

      updateField(field, data.url)
      updateUploadState(field, {
        isUploading: false,
        error: "",
        fileName: file.name,
      })
    } catch (err) {
      updateField(field, "")
      updateUploadState(field, {
        isUploading: false,
        error: err instanceof Error ? err.message : "Upload impossible",
      })
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/artisans/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Une erreur est survenue")
      }

      router.push(data?.redirectTo ?? "/validation-en-attente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const uploadsInFlight = Object.values(uploadState).some((item) => item.isUploading)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.14),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_40%,#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_680px]">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur">
              FONDATIA • Reseau BTP premium
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Rejoignez FONDATIA
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
              Creez votre dossier artisan avec les pieces necessaires a l'etude : KBIS,
              attestation decennale et carte d'identite recto verso du gerant.
            </p>
          </div>

          <GlassCard className="p-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                INSCRIPTION
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Le mot de passe doit contenir au minimum 8 caracteres, une majuscule, une minuscule et un caractere special.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-8">
              <section className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Compte
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field
                      label="Nom et Prenom du gerant"
                      value={form.name}
                      onChange={(value) => updateField("name", value)}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) => updateField("email", value)}
                    placeholder="jean@exemple.fr"
                  />
                  <Field
                    label="Telephone"
                    value={form.phone}
                    onChange={(value) => updateField("phone", value)}
                    placeholder="06 00 00 00 00"
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Mot de passe"
                      type="password"
                      value={form.password}
                      onChange={(value) => updateField("password", value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Entreprise
                </p>

                <div className="grid gap-4">
                  <ProfileTypeField
                    value={form.profileType}
                    onChange={(value) => updateField("profileType", value)}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field
                        label="Raison sociale"
                        value={form.legalName}
                        onChange={(value) => updateField("legalName", value)}
                        placeholder="Dupont Construction"
                      />
                    </div>

                    <Field
                      label="SIREN"
                      value={form.siren}
                      onChange={(value) => updateField("siren", value.replace(/\D/g, "").slice(0, 9))}
                      placeholder="123456789"
                    />
                    <Field
                      label="SIRET"
                      value={form.siret}
                      onChange={(value) => updateField("siret", value.replace(/\D/g, "").slice(0, 14))}
                      placeholder="12345678900012"
                    />

                    <div className="sm:col-span-2">
                      <Field
                        label="Adresse"
                        value={form.address}
                        onChange={(value) => updateField("address", value)}
                        placeholder="12 rue des Artisans"
                      />
                    </div>

                    <Field
                      label="Code postal"
                      value={form.postalCode}
                      onChange={(value) => updateField("postalCode", value)}
                      placeholder="67000"
                    />
                    <Field
                      label="Ville"
                      value={form.city}
                      onChange={(value) => updateField("city", value)}
                      placeholder="Strasbourg"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Documents obligatoires
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {documentConfigs.map((document) => (
                    <DocumentUploadField
                      key={document.field}
                      label={document.label}
                      description={document.description}
                      isUploading={uploadState[document.field].isUploading}
                      fileName={uploadState[document.field].fileName}
                      error={uploadState[document.field].error}
                      isUploaded={Boolean(form[document.field])}
                      onFileSelect={(file) =>
                        handleDocumentUpload(document.field, document.documentType, file)
                      }
                    />
                  ))}
                </div>
                <p className="text-xs leading-6 text-white/45">
                  Formats acceptes : PDF, JPG, PNG ou WEBP. Taille maximale : 10 Mo par document.
                </p>
              </section>

              {error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || uploadsInFlight}
                className="w-full rounded-2xl border border-blue-400/20 bg-blue-500/15 px-5 py-4 text-sm font-medium text-white transition hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creation du compte..." : uploadsInFlight ? "Televersement en cours..." : "Creer un compte"}
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </main>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.07]"
      />
    </label>
  )
}

function DocumentUploadField({
  label,
  description,
  isUploading,
  fileName,
  error,
  isUploaded,
  onFileSelect,
}: {
  label: string
  description: string
  isUploading: boolean
  fileName: string
  error: string
  isUploaded: boolean
  onFileSelect: (file: File) => void
}) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="mt-2 text-xs leading-6 text-white/50">{description}</p>
        </div>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-medium",
            isUploaded
              ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : "border border-white/10 bg-white/5 text-white/55",
          ].join(" ")}
        >
          {isUploading ? "Upload..." : isUploaded ? "Recu" : "A fournir"}
        </span>
      </div>

      <input
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        className="mt-4 block w-full text-sm text-white file:mr-4 file:rounded-full file:border file:border-white/10 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition hover:file:bg-white/15"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            onFileSelect(file)
          }
        }}
      />

      {fileName ? <p className="mt-3 text-xs text-white/55">{fileName}</p> : null}
      {error ? <p className="mt-2 text-xs text-rose-200">{error}</p> : null}
    </label>
  )
}

function ProfileTypeField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const options = [
    {
      value: "ARTISAN",
      title: "Je cherche des marches",
      description: "Creation d'un compte artisan avec orientation vers le dashboard artisan.",
    },
    {
      value: "DONNEUR",
      title: "Je cherche des artisans",
      description: "Creation d'un compte donneur d'ordre avec orientation vers le dashboard correspondant.",
    },
  ]

  return (
    <div>
      <p className="mb-2 block text-sm font-medium text-white/80">Je suis ici pour</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const active = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={[
                "rounded-2xl border p-4 text-left transition",
                active
                  ? "border-blue-400/30 bg-blue-500/15 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <p className="text-sm font-medium">{option.title}</p>
              <p className="mt-2 text-xs leading-6">{option.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
