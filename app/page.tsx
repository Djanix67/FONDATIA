import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.14),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_40%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 backdrop-blur">
            FONDATIA • Plateforme BTP premium
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Connexion
            </Link>

            <Link
              href="/inscription-artisan"
              className="rounded-2xl border border-blue-400/20 bg-blue-500/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500/25"
            >
              Devenir artisan
            </Link>
          </div>
        </header>

        <section className="grid min-h-[78vh] items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 backdrop-blur">
              Artisans vérifiés • Donneurs d’ordre qualifiés
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              Trouvez des artisans BTP fiables. Développez votre activité en toute confiance.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              Fondatia connecte les artisans du BTP et les donneurs d’ordre dans
              un environnement sérieux, vérifié et pensé pour éviter les pertes de
              temps, les dossiers faibles et les profils non qualifiés.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/inscription-artisan"
                className="rounded-2xl border border-blue-400/20 bg-blue-500/15 px-6 py-4 text-sm font-medium text-white transition hover:bg-blue-500/25"
              >
                Je suis artisan
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                Accéder à mon espace
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <MiniStat title="Profils vérifiés" value="Sélection sérieuse" />
              <MiniStat title="Traitement rapide" value="Validation manuelle" />
              <MiniStat title="Positionnement" value="Premium & confiance" />
            </div>
          </div>

          <GlassCard className="p-6 sm:p-8">
            <div className="grid gap-5">
              <FeatureCard
                number="01"
                title="Inscription structurée"
                description="Les artisans déposent un dossier clair avec identité, entreprise, KBIS et assurance décennale."
              />

              <FeatureCard
                number="02"
                title="Validation admin"
                description="Chaque dossier peut être approuvé ou refusé pour garder une base propre et crédible."
              />

              <FeatureCard
                number="03"
                title="Développement maîtrisé"
                description="La plateforme pose les bases d’un vrai système de mise en relation BTP premium."
              />
            </div>
          </GlassCard>
        </section>

        <section className="pb-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-8">
              <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                Pour les artisans
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                Développez votre visibilité avec un positionnement sérieux
              </h2>
              <p className="mt-4 text-base leading-7 text-white/65">
                Rejoignez une plateforme qui valorise les profils professionnels,
                structurés et vérifiés. L’objectif n’est pas de faire du volume
                cheap, mais de construire un réseau crédible.
              </p>
              <div className="mt-6">
                <Link
                  href="/inscription-artisan"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Déposer mon dossier
                </Link>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                Pour les donneurs d’ordre
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                Accédez à des artisans mieux qualifiés
              </h2>
              <p className="mt-4 text-base leading-7 text-white/65">
                Fondatia a vocation à filtrer les profils et à améliorer la
                qualité des mises en relation. Le but : réduire les mauvaises
                surprises et augmenter la confiance.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Accéder à la plateforme
                </Link>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>
    </main>
  )
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <p className="text-sm text-white/45">{title}</p>
      <p className="mt-2 text-lg font-medium text-white">{value}</p>
    </div>
  )
}

function FeatureCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">{number}</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/60">{description}</p>
    </div>
  )
}