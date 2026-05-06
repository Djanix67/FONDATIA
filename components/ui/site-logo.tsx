import Link from "next/link"

export function SiteLogo() {
  return (
    <Link
      href="/"
      className="fixed left-6 top-6 z-50 inline-flex items-center rounded-full border border-white/10 bg-[#08101dcc] px-4 py-2 text-sm font-medium tracking-[0.18em] text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:bg-[#0b1525]"
    >
      FONDATIA
    </Link>
  )
}
