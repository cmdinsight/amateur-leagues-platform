import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug, getDivisions } from "@/lib/leagues";
import { getStandings, getLeagueTotals } from "@/lib/stats";
import { prisma } from "@/lib/prisma";
import { TotalsRow } from "@/components/TotalsRow";
import { StandingsTable } from "@/components/StandingsTable";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

export default async function LeagueHomePage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const [totals, divisions, recentResults, latestNews] = await Promise.all([
    getLeagueTotals(league.id),
    getDivisions(league.id),
    prisma.match.findMany({
      where: { status: "PLAYED", tournament: { division: { leagueId: league.id } } },
      include: { homeTeam: true, awayTeam: true, tournament: { include: { division: true } } },
      orderBy: { matchDate: "desc" },
      take: 4,
    }),
    prisma.newsPost.findMany({ where: { leagueId: league.id }, orderBy: { publishedAt: "desc" }, take: 3 }),
  ]);

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

      {recentResults.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Últimos resultados</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentResults.map((m) => (
              <div key={m.id}>
                <p className="mb-1 text-xs text-slate-400">{m.tournament.division.name}</p>
                <MatchCard match={m} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Series</h2>
          <Link href={`/${liga}/series`} className="text-sm font-medium hover:underline" style={{ color: "var(--league-primary)" }}>
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
                <p className="text-sm text-slate-500">Esta serie aún no tiene torneos.</p>
              )}
            </div>
          ))}
          {divisions.length === 0 && <p className="text-sm text-slate-500">Esta liga aún no tiene series.</p>}
        </div>
      </section>

      {latestNews.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Noticias</h2>
            <Link href={`/${liga}/noticias`} className="text-sm font-medium hover:underline" style={{ color: "var(--league-primary)" }}>
              Ver todas →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {latestNews.map((post) => (
              <Link
                key={post.id}
                href={`/${liga}/noticias/${post.id}`}
                className="block rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition"
              >
                <p className="font-semibold text-slate-900">{post.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{post.body}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
