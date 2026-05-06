import { cn } from "@/lib/utils"

type GlassCardProps = React.HTMLAttributes<HTMLDivElement>

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)]",
        className
      )}
      {...props}
    />
  )
}