import Link from "next/link"

const contact = "mailto:caner.pro@hotmail.com?subject=Contact%20FONDATIA"

export function SiteFooter() {
  return <>
    <footer className="mt-auto border-t border-sky-200 bg-[#edf6fb] px-6 pt-12 pb-24 text-[#183653] sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-9 pb-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Link className="text-xl font-semibold tracking-[0.2em]" href="/">FONDATIA</Link>
            <p className="mt-3 max-w-xs leading-7">Le réseau des artisans et des donneurs d’ordre du bâtiment</p>
          </div>
          <nav aria-label="Découvrir FONDATIA" className="grid content-start justify-items-start gap-2">
            <h2 className="mb-1 text-lg font-semibold">La plateforme</h2>
            <Link className="hover:underline" href="/#marches-en-ligne">Les marchés en ligne</Link>
            <Link className="hover:underline" href="/#qui-sommes-nous">Qui sommes-nous ?</Link>
            <Link className="hover:underline" href="/inscription-artisan">Rejoindre FONDATIA</Link>
          </nav>
          <div className="grid content-start justify-items-start gap-2">
            <h2 className="mb-1 text-lg font-semibold">Contact</h2>
            <a className="underline underline-offset-4" href={contact}>caner.pro@hotmail.com</a>
            <Link className="mt-2 rounded-xl bg-[#163955] px-5 py-3 font-semibold text-white hover:bg-[#204c6d]" href="/login">Mon espace</Link>
          </div>
        </div>
        <nav aria-label="Informations juridiques" className="flex flex-wrap gap-x-7 gap-y-3 border-t border-slate-300 pt-5 text-sm">
          <Link className="hover:underline" href="/mentions-legales">Mentions légales</Link>
          <Link className="hover:underline" href="/conditions-generales-utilisation">Conditions générales d’utilisation</Link>
          <Link className="hover:underline" href="/politique-de-confidentialite">Politique de confidentialité</Link>
        </nav>
      </div>
    </footer>
    <a href={contact} aria-label="Message : écrire à FONDATIA par e-mail" title="Écrire à FONDATIA par e-mail"
       className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-white/60 bg-[#103859] px-3 text-white shadow-lg hover:bg-[#205679] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:right-6 sm:px-5">
      <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M5 3.5h14a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2h-7l-6 4v-4H5a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z"/><path d="M7 8.5h10M7 12.5h7"/></svg>
      <span className="hidden font-semibold sm:inline">Message</span>
    </a>
  </>
}
