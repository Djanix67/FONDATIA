import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"

export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.14),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_40%,#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-12">
        <GlassCard className="w-full p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.18em] text-white/40">
            Acces interdit
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ce compte ne peut pas acceder a cette zone.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">
            L'authentification peut etre valide, mais l'espace admin reste reserve aux utilisateurs ayant le role ADMIN.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/artisan"
              className="rounded-2xl border border-blue-400/20 bg-blue-500/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500/25"
            >
              Aller vers l'espace artisan
            </Link>
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
