import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug, getDivisions } from "@/lib/leagues";
import { getStandings, getLeagueTotals } from "@/lib/stats";
import { TotalsRow } from "@/components/TotalsRow";
import { StandingsTable } from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export default async function LeagueHomePage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const [totals, divisions] = await Promise.all([getLeagueTotals(league.id), getDivisions(league.id)]);

  const previews = await Promise.all(
    divisions.map(async (division) => {
      const activeTournament = division.tournaments.find((t) => t.isActive) ?? division.tournaments[0];
      const standings = activeTournament ? await getStandings(activeTournament.id) : [];
      return { division, activeTournament, standings: standings.slice(0, 4) };
    }),
  );

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-slate-900">{league.name} — en números</h1>
      <TotalsRow totals={totals} title="Toda la historia de la liga" />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Divisiones</h2>
          <Link href={`/${liga}/divisiones`} className="text-sm font-medium hover:underline" style={{ color: "var(--league-primary)" }}>
            Ver todas →
          </Link>
        </div>
        <div className="space-y-6">
          {previews.map(({ division, activeTournament, standings }) => (
            <div key={division.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{division.name}</p>
                  {activeTournament && <p className="text-xs text-slate-400">{activeTournament.name}</p>}
                </div>
                {activeTournament && (
                  <Link
                    href={`/${liga}/torneos/${activeTournament.id}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: "var(--league-primary)" }}
                  >
                    Ver torneo →
                  </Link>
                )}
              </div>
              {activeTournament ? (
                <StandingsTable rows={standings} />
              ) : (
                <p className="text-sm text-slate-500">Esta división aún no tiene torneos.</p>
              )}
            </div>
          ))}
          {divisions.length === 0 && <p className="text-sm text-slate-500">Esta liga aún no tiene divisiones.</p>}
        </div>
      </section>
    </div>
  );
}
