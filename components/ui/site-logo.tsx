import Link from "next/link"

export function SiteLogo() {
  return (
    <Link
      href="/"
      className="fixed left-6 top-6 z-50 inline-flex items-center rounded-full border border-[#17345b]/70 bg-[linear-gradient(180deg,#0e2342,#122b50)] px-5 py-2.5 text-[13px] font-semibold tracking-[0.28em] text-white shadow-[0_18px_44px_rgba(25,63,112,0.28)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#10284b,#16355f)]"
    >
      FONDATIA
    </Link>
  )
}
