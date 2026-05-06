"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  companyName: "",
  siren: "",
  siret: "",
  address: "",
  postalCode: "",
  city: "",
  kbisUrl: "",
  insuranceUrl: "",
}

export default function InscriptionArtisanPage() {
  const router = useRouter()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const updateField = (key: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
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

      router.push("/validation-en-attente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.14),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_40%,#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_620px]">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur">
              FONDATIA • Réseau BTP premium
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Rejoignez FONDATIA en tant qu’artisan
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
              Déposez votre dossier en quelques minutes. Votre entreprise sera
              ensuite vérifiée par l’équipe avant validation définitive.
            </p>
          </div>

          <GlassCard className="p-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Inscription artisan
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Renseignez vos informations personnelles et celles de votre entreprise.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-8">
              <section className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Compte
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nom" value={form.name} onChange={(value) => updateField("name", value)} placeholder="Jean Dupont" />
                  <Field label="Email" type="email" value={form.email} onChange={(value) => updateField("email", value)} placeholder="jean@exemple.fr" />
                  <Field label="Mot de passe" type="password" value={form.password} onChange={(value) => updateField("password", value)} placeholder="••••••••" />
                  <Field label="Téléphone" value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="06 00 00 00 00" />
                </div>
              </section>

              <section className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Entreprise
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Raison sociale" value={form.companyName} onChange={(value) => updateField("companyName", value)} placeholder="Dupont Construction" />
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
                    <Field label="Adresse" value={form.address} onChange={(value) => updateField("address", value)} placeholder="12 rue des Artisans" />
                  </div>

                  <Field label="Code postal" value={form.postalCode} onChange={(value) => updateField("postalCode", value)} placeholder="67000" />
                  <Field label="Ville" value={form.city} onChange={(value) => updateField("city", value)} placeholder="Strasbourg" />

                  <div className="sm:col-span-2">
                    <Field label="URL KBIS" value={form.kbisUrl} onChange={(value) => updateField("kbisUrl", value)} placeholder="https://..." />
                  </div>

                  <div className="sm:col-span-2">
                    <Field
                      label="URL assurance décennale"
                      value={form.insuranceUrl}
                      onChange={(value) => updateField("insuranceUrl", value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </section>

              {error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl border border-blue-400/20 bg-blue-500/15 px-5 py-4 text-sm font-medium text-white transition hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Création du dossier..." : "Créer mon dossier artisan"}
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