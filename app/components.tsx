// Piccoli componenti presentazionali condivisi (server-safe, nessun client JS).
import { pct } from "@/lib/data";

export function ProbBar({ p, label }: { p: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="label w-40 shrink-0">{label}</span>
      <div className="prob-track grow">
        <div className="prob-fill" style={{ width: `${Math.round(p * 100)}%` }} />
      </div>
      <span className="num w-10 text-right text-sm">{pct(p)}</span>
    </div>
  );
}

export function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="border-l border-(--color-line) pl-3">
      <div className="masthead-title num text-3xl sm:text-4xl">{value}</div>
      <div className="label mt-1">{label}</div>
      {sub && <div className="text-xs text-(--color-faded)">{sub}</div>}
    </div>
  );
}

export function HBar({ label, value, max, right }: { label: string; value: number; max: number; right?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-44 shrink-0 truncate text-sm" title={label}>{label}</span>
      <div className="h-3.5 grow bg-(--color-paper-dark)">
        <div className="bar-fill h-full" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="num w-24 shrink-0 text-right text-sm">{right ?? value.toLocaleString("it-IT")}</span>
    </div>
  );
}
