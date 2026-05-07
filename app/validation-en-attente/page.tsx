import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"

type ValidationEnAttentePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ValidationEnAttentePage({ searchParams }: ValidationEnAttentePageProps) {
  const params = (await searchParams) ?? {}
  const email = typeof params.email === "string" ? params.email : null

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.14),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_40%,#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
        <GlassCard className="w-full p-8 sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-2xl">
            ✓
          </div>

          <h1 className="mt-6 text-center text-3xl font-semibold tracking-tight text-white">
            Verifiez votre email pour finaliser le dossier
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-center text-base leading-7 text-white/65">
            Nous vous avons envoye un lien de confirmation{email ? ` a ${email}` : ""}. Une fois l'email confirme,
            votre dossier artisan restera en attente de validation par l'equipe FONDATIA.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-200">
            Pensez a verifier vos spams si vous ne voyez pas l'email arriver dans les prochaines minutes.
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Retour a l'accueil
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  )
}
