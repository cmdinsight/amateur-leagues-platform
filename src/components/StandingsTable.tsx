import type { StandingRow } from "@/lib/stats";
import { Crest } from "./Crest";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Aún no hay equipos registrados en esta temporada.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 bg-slate-50">
            <th className="py-2 pl-3 pr-2 font-medium">#</th>
            <th className="py-2 pr-2 font-medium">Equipo</th>
            <th className="py-2 px-2 text-center font-medium">PJ</th>
            <th className="py-2 px-2 text-center font-medium">G</th>
            <th className="py-2 px-2 text-center font-medium">E</th>
            <th className="py-2 px-2 text-center font-medium">P</th>
            <th className="py-2 px-2 text-center font-medium">GF</th>
            <th className="py-2 px-2 text-center font-medium">GC</th>
            <th className="py-2 px-2 text-center font-medium">DG</th>
            <th className="py-2 pr-3 pl-2 text-center font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.teamId} className="border-t border-slate-100">
              <td className="py-2 pl-3 pr-2 text-slate-400">{i + 1}</td>
              <td className="py-2 pr-2">
                <div className="flex items-center gap-2">
                  <Crest name={r.teamName} url={r.crestUrl} size={22} />
                  <span className="font-medium text-slate-800">{r.teamName}</span>
                </div>
              </td>
              <td className="py-2 px-2 text-center text-slate-600">{r.played}</td>
              <td className="py-2 px-2 text-center text-slate-600">{r.won}</td>
              <td className="py-2 px-2 text-center text-slate-600">{r.drawn}</td>
              <td className="py-2 px-2 text-center text-slate-600">{r.lost}</td>
              <td className="py-2 px-2 text-center text-slate-600">{r.goalsFor}</td>
              <td className="py-2 px-2 text-center text-slate-600">{r.goalsAgainst}</td>
              <td className="py-2 px-2 text-center text-slate-600">
                {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
              </td>
              <td className="py-2 pr-3 pl-2 text-center font-semibold text-slate-900">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
