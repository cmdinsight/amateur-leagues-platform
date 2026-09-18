import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug, getDivisions } from "@/lib/leagues";
import { getDivisionTotals } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function SeriesPage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const divisions = await getDivisions(league.id);
  const withTotals = await Promise.all(
    divisions.map(async (division) => ({ division, totals: await getDivisionTotals(division.id) })),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Elegí tu serie</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {withTotals.map(({ division, totals }) => (
          <Link
            key={division.id}
            href={`/${liga}/series/${division.id}`}
            className="block rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition"
          >
            <p className="font-bold text-slate-900">{division.name}</p>
            <p className="text-xs text-slate-400">
              {totals.totalPlayers} jugadores · {totals.totalTeams} equipos
            </p>
          </Link>
        ))}
        {divisions.length === 0 && <p className="text-sm text-slate-500">Aún no hay series creadas.</p>}
      </div>
    </div>
  );
}
