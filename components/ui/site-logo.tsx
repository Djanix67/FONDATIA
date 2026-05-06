import Link from "next/link"

export function SiteLogo() {
  return (
    <Link
      href="/"
      className="fixed left-6 top-6 z-50 inline-flex items-center rounded-full border border-white/55 bg-[#f4fbffd6] px-4 py-2 text-sm font-medium tracking-[0.18em] text-slate-900 shadow-[0_12px_34px_rgba(114,177,214,0.16)] backdrop-blur-xl transition hover:bg-white"
    >
      FONDATIA
    </Link>
  )
}
