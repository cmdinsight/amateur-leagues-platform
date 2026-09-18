import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug, getTournamentById } from "@/lib/leagues";
import { getStandings, getTopScorers, getGoalkeeperRanking, getSanciones, getTournamentTotals } from "@/lib/stats";
import { prisma } from "@/lib/prisma";
import { StandingsTable } from "@/components/StandingsTable";
import { ScorersList } from "@/components/ScorersList";
import { MatchCard } from "@/components/MatchCard";
import { TotalsRow } from "@/components/TotalsRow";

export const dynamic = "force-dynamic";

const FORMAT_LABEL: Record<string, string> = {
  LIGA: "Liga (todos contra todos)",
  GRUPOS: "Fase de grupos",
  ELIMINACION: "Eliminación directa",
};

const TABS = [
  { id: "posiciones", label: "Posiciones" },
  { id: "fixture", label: "Fixture" },
  { id: "lideres", label: "Líderes" },
  { id: "estadisticas", label: "Estadísticas" },
  { id: "historico", label: "Histórico" },
  { id: "sanciones", label: "Sanciones" },
] as const;

export default async function TournamentPage({
  params,
  searchParams,
}: {
  params: Promise<{ liga: string; torneoId: string }>;
  searchParams: Promise<{ grupo?: string; tab?: string }>;
}) {
  const { liga, torneoId } = await params;
  const { grupo, tab: rawTab } = await searchParams;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const tournament = await getTournamentById(torneoId);
  if (!tournament || tournament.division.leagueId !== league.id) notFound();

  const isGrupos = tournament.format === "GRUPOS";
  const activeGroup = isGrupos ? (tournament.groups.find((g) => g.id === grupo) ?? tournament.groups[0]) : undefined;
  const groupId = activeGroup?.id;
  const tab = TABS.some((t) => t.id === rawTab) ? rawTab! : "posiciones";

  function tabHref(nextTab: string, nextGroup?: string) {
    const params = new URLSearchParams();
    if (nextGroup) params.set("grupo", nextGroup);
    params.set("tab", nextTab);
    return `/${liga}/torneos/${torneoId}?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-400">
          <Link href={`/${liga}/series/${tournament.divisionId}`} className="hover:underline">
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

      {isGrupos && tournament.groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tournament.groups.map((g) => (
            <Link
              key={g.id}
              href={tabHref(tab, g.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                g.id === groupId ? "text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
              style={g.id === groupId ? { background: "var(--league-primary)", borderColor: "var(--league-primary)" } : undefined}
            >
              {g.name} {g.isFinished && <span className="ml-1 text-xs opacity-80">· Terminado</span>}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={tabHref(t.id, groupId)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              t.id === tab ? "border-current text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            style={t.id === tab ? { color: "var(--league-primary)", borderColor: "var(--league-primary)" } : undefined}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "posiciones" && <PosicionesTab tournamentId={tournament.id} groupId={groupId} />}
      {tab === "fixture" && <FixtureTab tournamentId={tournament.id} groupId={groupId} />}
      {tab === "lideres" && <LideresTab liga={liga} tournamentId={tournament.id} groupId={groupId} />}
      {tab === "estadisticas" && <EstadisticasTab tournamentId={tournament.id} groupId={groupId} />}
      {tab === "historico" && <HistoricoTab tournamentId={tournament.id} groupId={groupId} />}
      {tab === "sanciones" && <SancionesTab tournamentId={tournament.id} groupId={groupId} />}
    </div>
  );
}

async function PosicionesTab({ tournamentId, groupId }: { tournamentId: string; groupId?: string }) {
  const rows = await getStandings(tournamentId, groupId);
  return <StandingsTable rows={rows} />;
}

async function FixtureTab({ tournamentId, groupId }: { tournamentId: string; groupId?: string }) {
  const matches = await prisma.match.findMany({
    where: { tournamentId, ...(groupId ? { groupId } : {}) },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ round: "asc" }, { matchDate: "asc" }],
  });

  const rounds = new Map<number, typeof matches>();
  const noRound: typeof matches = [];
  for (const m of matches) {
    if (m.round == null) noRound.push(m);
    else {
      if (!rounds.has(m.round)) rounds.set(m.round, []);
      rounds.get(m.round)!.push(m);
    }
  }

  if (matches.length === 0) return <p className="text-sm text-slate-500">Aún no hay partidos programados.</p>;

  return (
    <div className="space-y-6">
      {Array.from(rounds.entries())
        .sort(([a], [b]) => a - b)
        .map(([round, roundMatches]) => (
          <div key={round}>
            <p className="mb-2 text-sm font-semibold text-slate-700">Fecha {round}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {roundMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      {noRound.length > 0 && (
        <div>
          {rounds.size > 0 && <p className="mb-2 text-sm font-semibold text-slate-700">Sin fecha asignada</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {noRound.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

async function LideresTab({ liga, tournamentId, groupId }: { liga: string; tournamentId: string; groupId?: string }) {
  const [scorers, keepers] = await Promise.all([
    getTopScorers(tournamentId, groupId, 10),
    getGoalkeeperRanking(tournamentId, groupId, 10),
  ]);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Goleadores</h2>
        <ScorersList leagueSlug={liga} rows={scorers} />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Imbatibles (arqueros)</h2>
        {keepers.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay datos suficientes.</p>
        ) : (
          <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
            {keepers.map((k, i) => (
              <li key={`${k.playerId}-${k.teamId}`} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-slate-400">{i + 1}</span>
                  <div>
                    <Link href={`/jugador/${k.playerId}`} className="font-medium text-slate-800 hover:underline">
                      {k.fullName}
                    </Link>
                    <div className="text-xs text-slate-400">
                      {k.teamName} · {k.goalsConceded} goles en {k.matchesPlayed} partidos
                    </div>
                  </div>
                </div>
                <span className="font-semibold text-slate-900">{k.average.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

async function EstadisticasTab({ tournamentId, groupId }: { tournamentId: string; groupId?: string }) {
  const totals = await getTournamentTotals(tournamentId, groupId);

  return (
    <div className="space-y-6">
      <TotalsRow totals={totals} title="Estadísticas del torneo" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Promedio de goles por partido" value={totals.avgGoalsPerMatch} />
        <StatBox label="Partidos por jugar" value={totals.totalMatchesScheduled} />
        <StatBox label="Tarjetas amarillas" value={totals.totalYellowCards} />
        <StatBox label="Tarjetas rojas" value={totals.totalRedCards} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

async function HistoricoTab({ tournamentId, groupId }: { tournamentId: string; groupId?: string }) {
  const results = await prisma.match.findMany({
    where: { tournamentId, status: "PLAYED", ...(groupId ? { groupId } : {}) },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "desc" },
  });

  if (results.length === 0) return <p className="text-sm text-slate-500">Aún no se han jugado partidos.</p>;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {results.map((m) => (
        <div key={m.id}>
          {m.stage && <p className="mb-1 text-xs font-medium text-slate-400">{m.stage}</p>}
          <MatchCard match={m} />
        </div>
      ))}
    </div>
  );
}

async function SancionesTab({ tournamentId, groupId }: { tournamentId: string; groupId?: string }) {
  const rows = await getSanciones(tournamentId, groupId);

  if (rows.length === 0) return <p className="text-sm text-slate-500">Sin tarjetas registradas todavía.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 bg-slate-50">
            <th className="py-2 pl-3 pr-2 font-medium">Jugador</th>
            <th className="py-2 pr-2 font-medium">Equipo</th>
            <th className="py-2 px-2 text-center font-medium">Amarillas</th>
            <th className="py-2 px-2 text-center font-medium">Rojas</th>
            <th className="py-2 pr-3 pl-2 text-center font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.playerId}-${r.teamId}`} className="border-t border-slate-100">
              <td className="py-2 pl-3 pr-2">
                <Link href={`/jugador/${r.playerId}`} className="font-medium text-slate-800 hover:underline">
                  {r.fullName}
                </Link>
              </td>
              <td className="py-2 pr-2 text-slate-600">{r.teamName}</td>
              <td className="py-2 px-2 text-center text-slate-600">{r.yellowCards}</td>
              <td className="py-2 px-2 text-center text-slate-600">{r.redCards}</td>
              <td className="py-2 pr-3 pl-2 text-center">
                {r.suspended ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Suspendido</span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
