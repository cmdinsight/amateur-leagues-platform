import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug, getActiveSeason } from "@/lib/leagues";
import { getStandings, getTopScorers } from "@/lib/stats";
import { prisma } from "@/lib/prisma";
import { StandingsTable } from "@/components/StandingsTable";
import { ScorersList } from "@/components/ScorersList";
import { MatchCard } from "@/components/MatchCard";

export default async function LeagueHomePage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const season = await getActiveSeason(league.id);
  if (!season) {
    return <p className="text-slate-500">Esta liga todavía no tiene una temporada activa.</p>;
  }

  const [standings, scorers, upcoming] = await Promise.all([
    getStandings(season.id),
    getTopScorers(season.id, 5),
    prisma.match.findMany({
      where: { seasonId: season.id, status: "SCHEDULED" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: "asc" },
      take: 4,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900">{season.name}</h1>
        <Link
          href={`/${liga}/calendario`}
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--league-primary)" }}
        >
          Ver calendario completo →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tabla de posiciones
          </h2>
          <StandingsTable rows={standings} />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tabla de goleo
          </h2>
          <ScorersList leagueSlug={liga} rows={scorers} />
        </section>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Próximos partidos
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
