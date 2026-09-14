import { notFound } from "next/navigation";
import { getLeagueBySlug, getActiveSeason } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import { MatchCard } from "@/components/MatchCard";

export default async function CalendarioPage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const season = await getActiveSeason(league.id);
  if (!season) return <p className="text-slate-500">Sin temporada activa.</p>;

  const matches = await prisma.match.findMany({
    where: { seasonId: season.id },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "asc" },
  });

  const results = matches.filter((m) => m.status === "PLAYED");
  const upcoming = matches.filter((m) => m.status !== "PLAYED");

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-slate-900">Calendario — {season.name}</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Próximos partidos
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No hay partidos programados.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Resultados
        </h2>
        {results.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no se han jugado partidos.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {[...results].reverse().map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
