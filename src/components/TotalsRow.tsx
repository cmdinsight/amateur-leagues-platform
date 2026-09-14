import type { LeagueTotals } from "@/lib/stats";

export function TotalsRow({ totals, title }: { totals: LeagueTotals; title: string }) {
  const items: [string, number][] = [
    ["Goles anotados", totals.totalGoals],
    ["Partidos jugados", totals.totalMatchesPlayed],
    ["Equipos", totals.totalTeams],
    ["Jugadores", totals.totalPlayers],
  ];
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
