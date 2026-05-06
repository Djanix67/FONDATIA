import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"

const trustSignals = [
  "Se reposer sur une relation de confiance",
  "Base preparee pour des services de qualite",
]

const featureBubbles = [
  {
    title: "Validation des dossiers",
    description:
      "Un controle est effectue a chaque inscription afin de faire correspondre des entreprises de confiance et de qualite.",
  },
  {
    title: "Traitement rapide",
    description: "Reponse en moins de 48 h.",
  },
  {
    title: "Developpement maitrise",
    description:
      "Fondatia est une vraie plateforme incluant un systeme de mise en relation pour le BTP.",
  },
  {
    title: "Positionnement",
    description: "Premium & Confiance.",
  },
]

const steps = [
  {
    number: "01",
    title: "Depot du dossier",
    description:
      "L'artisan transmet le dossier de son entreprise dans un cadre structure.",
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
    label: "Creer mon profil",
  },
  {
    title: "Donneurs d'ordre",
    description:
      "Une base plus selective pour trouver des entreprises avec d'avantage de filtres.",
    cta: "/login",
    label: "Acceder a la plateforme",
  },
]

const marketCards = [
  {
    title: "Renovation complete d'un immeuble",
    location: "Lyon",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Lot maconnerie et second oeuvre",
    location: "Bordeaux",
    image:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Rehabilitation tertiaire multi-corps",
    location: "Lille",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(125,170,255,0.28),transparent_26%),radial-gradient(circle_at_82%_16%,rgba(196,221,255,0.22),transparent_24%),linear-gradient(180deg,#0b1322_0%,#10203a_40%,#132744_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between gap-6 pt-2">
          <nav className="flex flex-wrap items-center gap-3 text-sm text-white/78">
            <a
              href="#marches-en-ligne"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10 hover:text-white"
            >
              Les marches en ligne
            </a>
            <a
              href="#qui-sommes-nous"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10 hover:text-white"
            >
              Qui sommes nous ?
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Connexion
            </Link>
            <Link
              href="/inscription-artisan"
              className="rounded-2xl border border-sky-300/20 bg-sky-400/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400/25"
            >
              Rejoindre Fondatia
            </Link>
          </div>
        </header>

        <section className="grid min-h-[78vh] items-center gap-10 py-16 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/70 backdrop-blur">
              Marketplace BTP premium
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Une plateforme credible pour relier marches qualifies et artisans exigeants.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">
              FONDATIA pose un cadre plus selectif pour l'inscription des artisans,
              un service premium pour des marches de qualite partout en France.
              Rejoignez une plateforme qui valorise les profils structures et de qualite.
              L'objectif est de construire des relations de confiance permettant la continuite des marches.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/inscription-artisan"
                className="rounded-2xl border border-sky-300/20 bg-sky-400/15 px-6 py-4 text-sm font-medium text-white transition hover:bg-sky-400/25"
              >
                Creer mon profil
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
                  className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/78 backdrop-blur"
                >
                  {signal}
                </div>
              ))}
            </div>
          </div>

          <GlassCard className="bg-white/7 p-6 sm:p-8">
            <div className="grid gap-5">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/38">
                  Validation FONDATIA
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Une base plus sereine pour le BTP
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/66">
                  Le coeur du produit repose sur l'inscription des artisans qualifies,
                  le controle, le systeme de statut et la preparation des futurs marches.
                </p>
              </div>

              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    {step.number}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/62">{step.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="pb-18">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureBubbles.map((bubble) => (
              <div
                key={bubble.title}
                className="rounded-3xl border border-white/12 bg-white/8 p-5 text-white/78 backdrop-blur"
              >
                <p className="text-sm font-semibold text-white">{bubble.title}</p>
                <p className="mt-3 text-sm leading-7">{bubble.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="qui-sommes-nous" className="pb-20 pt-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.18em] text-white/40">
              Qui sommes nous ?
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Une plateforme pensee pour remettre de la confiance et du niveau dans les mises en relation BTP.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/72">
              Fondatia s'adresse aux artisans qui veulent acceder a des marches qualifies
              dans un environnement plus propre, et aux donneurs d'ordre qui veulent trouver
              des entreprises structurees. Notre vision est simple : moins de bruit, plus de fiabilite,
              et une vraie logique de continuite dans les relations de travail partout en France.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {segments.map((segment) => (
              <GlassCard key={segment.title} className="bg-white/7 p-8">
                <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                  {segment.title}
                </p>
                <p className="mt-4 text-base leading-7 text-white/68">
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

        <section id="marches-en-ligne" className="pb-24 pt-4">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.18em] text-white/40">
              Les marches en ligne
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Un apercu volontairement floute des futurs marches diffuses sur la plateforme.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/68">
              Cette section donne une projection du type de missions que Fondatia preparera pour ses membres,
              tout en conservant une discretion visuelle qui soutient l'univers premium.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {marketCards.map((card) => (
              <article
                key={card.title}
                className="group relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/8 p-0 shadow-[0_20px_60px_rgba(7,14,28,0.28)]"
              >
                <div
                  className="h-80 w-full scale-105 blur-[3px] transition duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(12,24,46,0.14), rgba(6,12,23,0.68)), url(${card.image})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="rounded-[1.5rem] border border-white/12 bg-[#12233dcc] p-5 backdrop-blur-xl">
                    <p className="text-sm text-white/55">{card.location}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/68">
                      Marche en ligne bientot visible avec cahier des charges, localisation et delais filtres.
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
