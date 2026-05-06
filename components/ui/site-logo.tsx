import Link from "next/link"

export function SiteLogo() {
  return (
    <Link
      href="/"
      className="fixed left-6 top-6 z-50 inline-flex items-center rounded-full border border-sky-200/90 bg-[#edf8ffef] px-4 py-2 text-sm font-semibold tracking-[0.18em] text-slate-950 shadow-[0_14px_36px_rgba(114,177,214,0.22)] backdrop-blur-xl transition hover:bg-white"
    >
      FONDATIA
    </Link>
  )
}
