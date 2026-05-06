import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"

const trustSignals = [
  "Selection serieuse des profils",
  "Validation admin avant activation",
  "Base preparee pour les leads qualifies",
]

const steps = [
  {
    number: "01",
    title: "Depot du dossier",
    description:
      "L'artisan transmet son compte, son entreprise et ses documents dans un cadre structure.",
  },
  {
    number: "02",
    title: "Controle FONDATIA",
    description:
      "Chaque dossier est relu et qualifie avant d'entrer dans la base active.",
  },
  {
    number: "03",
    title: "Acces a un reseau plus propre",
    description:
      "Le produit se construit sur la confiance, la lisibilite et la qualite des mises en relation.",
  },
]

const segments = [
  {
    title: "Artisans",
    description:
      "Un espace pour presenter une entreprise serieuse, suivre son statut et preparer les futures opportunites.",
    cta: "/inscription-artisan",
    label: "Deposer mon dossier",
  },
  {
    title: "Donneurs d'ordre",
    description:
      "Une base plus selective pour sourcer des entreprises BTP avec davantage de filtres et moins de bruit.",
    cta: "/login",
    label: "Acceder a la plateforme",
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.16),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_38%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm tracking-[0.18em] text-white/75 backdrop-blur">
            FONDATIA
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

        <section className="grid min-h-[78vh] items-center gap-10 py-16 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 backdrop-blur">
              Marketplace BTP premium
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Une plateforme credible pour relier artisans qualifies et donneurs d'ordre exigeants.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              FONDATIA pose un cadre plus selectif pour l'inscription artisan,
              la validation admin, la lecture des statuts et la future monétisation
              des leads. L'objectif n'est pas le volume cheap, mais la confiance.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/inscription-artisan"
                className="rounded-2xl border border-blue-400/20 bg-blue-500/15 px-6 py-4 text-sm font-medium text-white transition hover:bg-blue-500/25"
              >
                Demarrer mon dossier artisan
              </Link>
              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                Acceder a mon espace
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-3">
              {trustSignals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur"
                >
                  {signal}
                </div>
              ))}
            </div>
          </div>

          <GlassCard className="p-6 sm:p-8">
            <div className="grid gap-5">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                  Validation FONDATIA
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Une base plus lisible des le MVP
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  Le coeur du produit repose deja sur l'inscription artisan, le controle admin, le systeme de statut et la preparation des briques suivantes.
                </p>
              </div>

              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    {step.number}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">{step.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="pb-20">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.18em] text-white/40">
              Deux usages, une meme exigence
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Un socle simple aujourd'hui, une plateforme business demain.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {segments.map((segment) => (
              <GlassCard key={segment.title} className="p-8">
                <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                  {segment.title}
                </p>
                <p className="mt-4 text-base leading-7 text-white/65">
                  {segment.description}
                </p>
                <div className="mt-6">
                  <Link
                    href={segment.cta}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    {segment.label}
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
