import Link from "next/link"

export function SiteLogo() {
  return (
    <Link
      href="/"
      className="fixed left-6 top-6 z-50 inline-flex items-center rounded-full border border-sky-100/95 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(230,245,255,0.82))] px-5 py-2.5 text-[13px] font-semibold tracking-[0.28em] text-slate-950 shadow-[0_18px_44px_rgba(114,177,214,0.24)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,248,255,0.9))]"
    >
      FONDATIA
    </Link>
  )
}
