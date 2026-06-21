const toneMap = {
  high: "bg-coral/15 text-coral border-coral/30",
  medium: "bg-amber/20 text-amber border-amber/30",
  low: "bg-teal/15 text-teal border-teal/30",
  neutral: "bg-ink/5 text-ink border-ink/10"
};

export function Badge({ children, tone = "neutral" }) {
  return <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold border ${toneMap[tone] || toneMap.neutral}`}>{children}</span>;
}
