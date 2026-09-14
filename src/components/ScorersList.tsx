import Link from "next/link";
import type { ScorerRow } from "@/lib/stats";

export function ScorersList({ leagueSlug, rows }: { leagueSlug: string; rows: ScorerRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay goles registrados.</p>;
  }

  return (
    <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
      {rows.map((r, i) => (
        <li key={`${r.playerId}-${r.teamId}`} className="flex items-center justify-between px-3 py-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="w-5 text-slate-400">{i + 1}</span>
            <div>
              <Link
                href={`/jugador/${r.playerId}`}
                className="font-medium text-slate-800 hover:underline"
                style={{ color: i === 0 ? "var(--league-primary, #16a34a)" : undefined }}
              >
                {r.fullName}
              </Link>
              <div className="text-xs text-slate-400">{r.teamName}</div>
            </div>
          </div>
          <span className="font-semibold text-slate-900">{r.goals}</span>
        </li>
      ))}
    </ol>
  );
}
