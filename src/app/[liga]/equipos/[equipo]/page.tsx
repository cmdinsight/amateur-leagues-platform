import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import { Crest } from "@/components/Crest";
import { MatchCard } from "@/components/MatchCard";

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ liga: string; equipo: string }>;
}) {
  const { liga, equipo } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const team = await prisma.team.findFirst({
    where: { id: equipo, leagueId: league.id },
    include: {
      rosterSpots: { include: { player: true }, orderBy: { number: "asc" } },
    },
  });
  if (!team) notFound();

  const matches = await prisma.match.findMany({
    where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "desc" },
    take: 6,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Crest name={team.name} url={team.crestUrl} size={56} />
        <div>
          <h1 className="text-xl font-bold text-slate-900">{team.name}</h1>
          <p className="text-sm text-slate-400">{team.rosterSpots.length} jugadores en plantilla</p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Plantilla</h2>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          {team.rosterSpots.map((rs) => (
            <Link
              key={rs.id}
              href={`/jugador/${rs.playerId}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
            >
              <span
                className="w-7 text-center text-sm font-bold"
                style={{ color: "var(--league-primary)" }}
              >
                {rs.number ?? "-"}
              </span>
              <span className="flex-1 font-medium text-slate-800">{rs.player.fullName}</span>
              {rs.position && <span className="text-xs text-slate-400">{rs.position}</span>}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Últimos partidos
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>
    </div>
  );
}
