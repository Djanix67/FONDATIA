"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"

type DocumentFieldName =
  | "kbisUrl"
  | "insuranceDecennaleUrl"
  | "identityCardFrontUrl"
  | "identityCardBackUrl"

type FormFieldName =
  | "name"
  | "email"
  | "password"
  | "phone"
  | "profileType"
  | "legalName"
  | "siren"
  | "address"
  | "postalCode"
  | "city"
  | DocumentFieldName

type UploadState = {
  isUploading: boolean
  fileName: string
  error: string
}

type FieldErrors = Partial<Record<FormFieldName, string>>

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  profileType: "ARTISAN",
  legalName: "",
  siren: "",
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
}> = [
  {
    field: "kbisUrl",
    documentType: "kbis",
    label: "KBIS",
  },
  {
    field: "insuranceDecennaleUrl",
    documentType: "insuranceDecennale",
    label: "Attestation decennale",
  },
  {
    field: "identityCardFrontUrl",
    documentType: "identityCardFront",
    label: "Carte d'identite recto",
  },
  {
    field: "identityCardBackUrl",
    documentType: "identityCardBack",
    label: "Carte d'identite verso",
  },
]

const passwordHint =
  "8 caracteres minimum, avec 1 majuscule, 1 minuscule, 1 chiffre et 1 caractere special."

export default function InscriptionArtisanPage() {
  const router = useRouter()
  const [form, setForm] = useState(initialForm)
  const [uploadState, setUploadState] = useState(initialUploadState)
  const [draftId, setDraftId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const uploadsInFlight = useMemo(
    () => Object.values(uploadState).some((item) => item.isUploading),
    [uploadState]
  )

  const updateField = (key: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
    setError("")
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

  const applyFieldErrors = (nextErrors: FieldErrors) => {
    setFieldErrors(nextErrors)
    setError(Object.keys(nextErrors).length > 0 ? "Merci de corriger les champs encadres en rouge." : "")
  }

  const validateForm = () => {
    const nextErrors: FieldErrors = {}

    if (form.name.trim().length < 2) {
      nextErrors.name = "Le nom et prenom du gerant sont requis."
    }

    if (!form.email.trim()) {
      nextErrors.email = "L'email est requis."
    } else if (!form.email.includes("@")) {
      nextErrors.email = "L'email doit contenir un @."
    }

    if (!/^(06|07)\d{8}$/.test(form.phone)) {
      nextErrors.phone = "Le numero doit commencer par 06 ou 07 et contenir 10 chiffres."
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)) {
      nextErrors.password = passwordHint
    }

    if (form.legalName.trim().length < 2) {
      nextErrors.legalName = "La raison sociale est requise."
    }

    if (!/^\d{9}$/.test(form.siren)) {
      nextErrors.siren = "Le SIREN doit contenir 9 chiffres."
    }

    if (form.address.trim().length < 3) {
      nextErrors.address = "L'adresse est requise."
    }

    if (form.postalCode.trim().length < 4) {
      nextErrors.postalCode = "Le code postal est requis."
    }

    if (form.city.trim().length < 2) {
      nextErrors.city = "La ville est requise."
    }

    for (const document of documentConfigs) {
      if (!form[document.field]) {
        nextErrors[document.field] = `Merci de telecharger ${document.label.toLowerCase()}.`
      }
    }

    return nextErrors
  }

  const handleDocumentUpload = async (
    field: DocumentFieldName,
    documentType: "kbis" | "insuranceDecennale" | "identityCardFront" | "identityCardBack",
    file: File
  ) => {
    setError("")
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
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
      const message = err instanceof Error ? err.message : "Upload impossible"
      updateField(field, "")
      setFieldErrors((prev) => ({ ...prev, [field]: message }))
      updateUploadState(field, {
        isUploading: false,
        error: message,
      })
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const nextErrors = validateForm()

    if (Object.keys(nextErrors).length > 0) {
      applyFieldErrors(nextErrors)
      setLoading(false)
      return
    }

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
        const apiFieldErrors =
          (data?.details?.fieldErrors as Record<string, string[] | undefined> | undefined) ?? {}

        const normalizedErrors: FieldErrors = {}

        for (const [key, value] of Object.entries(apiFieldErrors)) {
          if (value?.[0]) {
            normalizedErrors[key as FormFieldName] = value[0]
          }
        }

        if (Object.keys(normalizedErrors).length > 0) {
          applyFieldErrors(normalizedErrors)
        } else {
          setError(data?.error || "Une erreur est survenue pendant l'inscription.")
        }

        return
      }

      router.push(data?.redirectTo ?? "/validation-en-attente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue pendant l'inscription.")
    } finally {
      setLoading(false)
    }
  }

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
                      error={fieldErrors.name}
                    />
                  </div>
                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) => updateField("email", value)}
                    placeholder="jean@exemple.fr"
                    error={fieldErrors.email}
                  />
                  <Field
                    label="Telephone"
                    value={form.phone}
                    onChange={(value) => updateField("phone", value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="06 00 00 00 00"
                    error={fieldErrors.phone}
                    inputMode="numeric"
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Mot de passe"
                      type="password"
                      value={form.password}
                      onChange={(value) => updateField("password", value)}
                      placeholder="••••••••"
                      error={fieldErrors.password}
                      helperText={passwordHint}
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
                        error={fieldErrors.legalName}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Field
                        label="SIREN"
                        value={form.siren}
                        onChange={(value) => updateField("siren", value.replace(/\D/g, "").slice(0, 9))}
                        placeholder="123456789"
                        error={fieldErrors.siren}
                        inputMode="numeric"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Field
                        label="Adresse"
                        value={form.address}
                        onChange={(value) => updateField("address", value)}
                        placeholder="12 rue des Artisans"
                        error={fieldErrors.address}
                      />
                    </div>

                    <Field
                      label="Code postal"
                      value={form.postalCode}
                      onChange={(value) => updateField("postalCode", value)}
                      placeholder="67000"
                      error={fieldErrors.postalCode}
                      inputMode="numeric"
                    />
                    <Field
                      label="Ville"
                      value={form.city}
                      onChange={(value) => updateField("city", value)}
                      placeholder="Strasbourg"
                      error={fieldErrors.city}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Documents obligatoires
                </p>
                <p className="text-sm leading-6 text-white/65">
                  Merci de telecharger votre KBIS, votre carte d'identite recto/verso et votre attestation decennale.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {documentConfigs.map((document) => (
                    <DocumentUploadField
                      key={document.field}
                      label={document.label}
                      isUploading={uploadState[document.field].isUploading}
                      fileName={uploadState[document.field].fileName}
                      error={fieldErrors[document.field] || uploadState[document.field].error}
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
  error?: string
  helperText?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  helperText,
  inputMode,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={[
          "h-12 w-full rounded-2xl border bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:bg-white/[0.07]",
          error
            ? "border-red-400/70 focus:border-red-400"
            : "border-white/10 focus:border-white/20",
        ].join(" ")}
      />
      {helperText ? <p className="mt-2 text-xs leading-5 text-white/45">{helperText}</p> : null}
      {error ? <p className="mt-2 text-xs leading-5 text-red-200">{error}</p> : null}
    </label>
  )
}

function DocumentUploadField({
  label,
  isUploading,
  fileName,
  error,
  isUploaded,
  onFileSelect,
}: {
  label: string
  isUploading: boolean
  fileName: string
  error?: string
  isUploaded: boolean
  onFileSelect: (file: File) => void
}) {
  return (
    <label
      className={[
        "block cursor-pointer rounded-2xl border p-4 transition",
        error
          ? "border-red-400/70 bg-red-400/10"
          : "border-white/10 bg-white/5 hover:bg-white/[0.07]",
      ].join(" ")}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl text-white">
          +
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="mt-1 text-xs text-white/50">
            {isUploading
              ? "Televersement en cours..."
              : isUploaded
                ? fileName || "Document telecharge"
                : "Cliquez pour choisir un fichier ou une photo"}
          </p>
        </div>
      </div>

      <input
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            onFileSelect(file)
          }
        }}
      />

      {error ? <p className="mt-3 text-xs leading-5 text-red-200">{error}</p> : null}
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
