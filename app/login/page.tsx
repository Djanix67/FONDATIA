"use client"

import Link from "next/link"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (!result || result.error) {
        setError("Email ou mot de passe incorrect.")
        setLoading(false)
        return
      }

      router.push("/admin")
      router.refresh()
    } catch {
      setError("Une erreur est survenue lors de la connexion.")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.14),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_40%,#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_520px]">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur">
              FONDATIA • Acces securise
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Connectez-vous a votre espace FONDATIA
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
              Le login envoie vers l'espace admin, puis la page decide si le compte peut y acceder. Les comptes non admin sont bloques hors de cette zone.
            </p>
          </div>

          <GlassCard className="p-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Connexion
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Entrez vos identifiants pour acceder a votre espace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="admin@fondatia.fr"
              />

              <Field
                label="Mot de passe"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />

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
                {loading ? "Connexion..." : "Se connecter"}
              </button>

              <div className="flex items-center justify-between gap-4 text-sm text-white/55">
                <Link href="/mot-de-passe-oublie" className="transition hover:text-white">
                  Mot de passe oublie ?
                </Link>
                <Link href="/inscription-artisan" className="transition hover:text-white">
                  Devenir artisan
                </Link>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </main>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
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
