import Link from "next/link"
import { redirect } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { verifyEmailToken } from "@/lib/email-verification"

type VerificationEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function VerificationEmailPage({ searchParams }: VerificationEmailPageProps) {
  const params = (await searchParams) ?? {}
  const token = typeof params.token === "string" ? params.token : ""

  if (!token) {
    redirect("/login?error=EmailVerificationMissing")
  }

  const result = await verifyEmailToken(token)

  const content =
    result.ok
      ? result.role === "DONNEUR"
        ? {
            title: "Adresse email confirmee",
            description:
              "Votre email est maintenant verifie. Vous pouvez vous connecter pour acceder a votre espace donneur d'ordre.",
          }
        : {
            title: "Adresse email confirmee",
            description:
              "Votre email est maintenant verifie. Vous pouvez vous connecter pour suivre votre dossier artisan.",
          }
      : result.reason === "expired"
        ? {
            title: "Lien expire",
            description:
              "Le lien de verification a expire. Nous pourrons ajouter un renvoi de lien dans une prochaine iteration.",
          }
        : {
            title: "Lien invalide",
            description:
              "Ce lien de verification n'est pas reconnu. Verifiez que vous utilisez bien le dernier email recu.",
          }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12 sm:px-10">
      <GlassCard className="w-full max-w-2xl p-8 text-center sm:p-10">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Verification email</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {content.title}
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-300">{content.description}</p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/login"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
          >
            Aller a la connexion
          </Link>
        </div>
      </GlassCard>
    </main>
  )
}
