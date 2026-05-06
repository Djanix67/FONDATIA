import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GlassCard } from "@/components/ui/glass-card"

export default async function DonneurOrdrePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const role = (session.user as { role?: string }).role

  if (role !== "DONNEUR") {
    redirect("/acces-interdit")
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.14),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_40%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.18em] text-white/40">
            Espace donneur d'ordre
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Tableau de bord sourcing
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Cette base prepare l'espace donneur d'ordre : recherche d'artisans, futures demandes de chantier, filtres par zone, budget et delai.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <GlassCard className="p-8">
            <p className="text-sm text-white/45">Etat de l'espace</p>
            <p className="mt-3 text-3xl font-semibold text-white">Actif</p>
          </GlassCard>
          <GlassCard className="p-8">
            <p className="text-sm text-white/45">Prochaine brique</p>
            <p className="mt-3 text-lg font-medium text-white">Depot de demande de chantier</p>
          </GlassCard>
          <GlassCard className="p-8">
            <p className="text-sm text-white/45">Objectif produit</p>
            <p className="mt-3 text-lg font-medium text-white">Matching qualifie artisan / besoin</p>
          </GlassCard>
        </div>
      </div>
    </main>
  )
}
