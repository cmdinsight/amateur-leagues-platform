import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug } from "@/lib/leagues";
import { getTeamCareer } from "@/lib/stats";
import { prisma } from "@/lib/prisma";
import { Crest } from "@/components/Crest";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

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
      entries: { include: { tournament: { include: { division: true } } } },
    },
  });
  if (!team) notFound();

  const [career, matches] = await Promise.all([
    getTeamCareer(team.id),
    prisma.match.findMany({
      where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] },
      include: { homeTeam: true, awayTeam: true, tournament: { include: { division: true } } },
      orderBy: { matchDate: "desc" },
      take: 8,
    }),
  ]);

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
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Récord histórico (todos los torneos)
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <Stat label="PJ" value={career.played} />
          <Stat label="G" value={career.won} />
          <Stat label="E" value={career.drawn} />
          <Stat label="P" value={career.lost} />
          <Stat label="GF" value={career.goalsFor} />
          <Stat label="GC" value={career.goalsAgainst} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Series y torneos</h2>
        <div className="flex flex-wrap gap-2">
          {team.entries.map((e) => (
            <Link
              key={e.id}
              href={`/${liga}/torneos/${e.tournamentId}`}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-slate-300"
            >
              {e.tournament.division.name} · {e.tournament.name}
            </Link>
          ))}
          {team.entries.length === 0 && <p className="text-sm text-slate-500">Sin inscripciones aún.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Plantilla actual</h2>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          {team.rosterSpots.map((rs) => (
            <Link
              key={rs.id}
              href={`/jugador/${rs.playerId}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
            >
              <span className="w-7 text-center text-sm font-bold" style={{ color: "var(--league-primary)" }}>
                {rs.number ?? "-"}
              </span>
              <span className="flex-1 font-medium text-slate-800">{rs.player.fullName}</span>
              {rs.position && <span className="text-xs text-slate-400">{rs.position}</span>}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Últimos partidos</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {matches.map((m) => (
            <div key={m.id}>
              <p className="mb-1 text-xs text-slate-400">
                {m.tournament.division.name} · {m.tournament.name}
              </p>
              <MatchCard match={m} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2 text-center">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
