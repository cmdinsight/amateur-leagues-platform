import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug, getTournamentById } from "@/lib/leagues";
import { getStandings, getTopScorers } from "@/lib/stats";
import { prisma } from "@/lib/prisma";
import { StandingsTable } from "@/components/StandingsTable";
import { ScorersList } from "@/components/ScorersList";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

const FORMAT_LABEL: Record<string, string> = {
  LIGA: "Liga (todos contra todos)",
  GRUPOS: "Fase de grupos",
  ELIMINACION: "Eliminación directa",
};

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ liga: string; torneoId: string }>;
}) {
  const { liga, torneoId } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const tournament = await getTournamentById(torneoId);
  if (!tournament || tournament.division.leagueId !== league.id) notFound();

  const matches = await prisma.match.findMany({
    where: { tournamentId: tournament.id },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "asc" },
  });
  const upcoming = matches.filter((m) => m.status !== "PLAYED");
  const results = matches.filter((m) => m.status === "PLAYED");

  const scorers = await getTopScorers(tournament.id, undefined, 8);

  const groupStandings =
    tournament.format === "GRUPOS"
      ? await Promise.all(tournament.groups.map(async (g) => ({ group: g, rows: await getStandings(tournament.id, g.id) })))
      : null;
  const overallStandings = tournament.format !== "GRUPOS" ? await getStandings(tournament.id) : null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-400">
          <Link href={`/${liga}/divisiones/${tournament.divisionId}`} className="hover:underline">
            {tournament.division.name}
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">{tournament.name}</h1>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {FORMAT_LABEL[tournament.format] ?? tournament.format}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tabla de posiciones</h2>
          {groupStandings
            ? groupStandings.map(({ group, rows }) => (
                <div key={group.id}>
                  <p className="mb-1 text-sm font-semibold text-slate-700">{group.name}</p>
                  <StandingsTable rows={rows} />
                </div>
              ))
            : overallStandings && <StandingsTable rows={overallStandings} />}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Tabla de goleo</h2>
          <ScorersList leagueSlug={liga} rows={scorers} />
        </section>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Próximos partidos</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No hay partidos programados.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {upcoming.map((m) => (
              <div key={m.id}>
                {m.stage && <p className="mb-1 text-xs font-medium text-slate-400">{m.stage}</p>}
                <MatchCard match={m} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Resultados</h2>
        {results.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no se han jugado partidos.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {[...results].reverse().map((m) => (
              <div key={m.id}>
                {m.stage && <p className="mb-1 text-xs font-medium text-slate-400">{m.stage}</p>}
                <MatchCard match={m} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
