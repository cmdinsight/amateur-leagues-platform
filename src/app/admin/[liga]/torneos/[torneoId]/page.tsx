import { notFound, redirect } from "next/navigation";
import { getLeagueBySlug, getTournamentById } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import {
  isAdminAuthed,
  createGroupAction,
  setTeamEntryAction,
  scheduleMatchAction,
  submitResultAction,
  toggleGroupFinishedAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminTournamentPage({
  params,
}: {
  params: Promise<{ liga: string; torneoId: string }>;
}) {
  const { liga, torneoId } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const authed = await isAdminAuthed(liga);
  if (!authed) redirect(`/admin/${liga}`);

  const tournament = await getTournamentById(torneoId);
  if (!tournament || tournament.division.leagueId !== league.id) notFound();

  const allTeams = await prisma.team.findMany({ where: { leagueId: league.id }, orderBy: { name: "asc" } });
  const entryByTeam = new Map(tournament.entries.map((e) => [e.teamId, e]));
  const isGrupos = tournament.format === "GRUPOS";

  const scheduled = await prisma.match.findMany({
    where: { tournamentId: tournament.id, status: "SCHEDULED" },
    include: {
      homeTeam: { include: { rosterSpots: { include: { player: true } } } },
      awayTeam: { include: { rosterSpots: { include: { player: true } } } },
    },
    orderBy: { matchDate: "asc" },
  });

  const createGroup = createGroupAction.bind(null, liga, tournament.id);
  const scheduleMatch = scheduleMatchAction.bind(null, liga, tournament.id);
  const enrolledTeams = tournament.entries.map((e) => e.team);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-10">
      <div>
        <p className="text-sm text-slate-400">{tournament.division.name}</p>
        <h1 className="text-xl font-bold text-slate-900">{tournament.name}</h1>
      </div>

      {isGrupos && (
        <section className="rounded-xl border border-slate-200 p-5">
          <h2 className="mb-3 font-semibold text-slate-800">Grupos</h2>
          <div className="mb-3 space-y-2">
            {tournament.groups.map((g) => {
              const toggleFinished = toggleGroupFinishedAction.bind(null, liga, tournament.id, g.id);
              return (
                <form key={g.id} action={toggleFinished} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="flex-1 font-medium text-slate-700">{g.name}</span>
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <input type="checkbox" name="isFinished" defaultChecked={g.isFinished} />
                    Terminado
                  </label>
                  <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white">
                    Guardar
                  </button>
                </form>
              );
            })}
            {tournament.groups.length === 0 && <p className="text-sm text-slate-500">Sin grupos todavía.</p>}
          </div>
          <form action={createGroup} className="flex items-end gap-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Nuevo grupo</span>
              <input name="name" required placeholder="Ej. Grupo C" className="input" />
            </label>
            <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">Agregar grupo</button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Equipos inscritos</h2>
        <div className="divide-y divide-slate-100">
          {allTeams.map((team) => {
            const entry = entryByTeam.get(team.id);
            const setEntry = setTeamEntryAction.bind(null, liga, tournament.id, team.id);
            return (
              <form key={team.id} action={setEntry} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <label className="flex flex-1 items-center gap-2">
                  <input type="checkbox" name="enrolled" defaultChecked={!!entry} />
                  <span className="font-medium text-slate-800">{team.name}</span>
                </label>
                {isGrupos && (
                  <select name="groupId" defaultValue={entry?.groupId ?? ""} className="input">
                    <option value="">Sin grupo</option>
                    {tournament.groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
                <button className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Guardar
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Programar partido</h2>
        {enrolledTeams.length < 2 ? (
          <p className="text-sm text-slate-500">Inscribe al menos dos equipos para poder programar partidos.</p>
        ) : (
          <form action={scheduleMatch} className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Local</span>
              <select name="homeTeamId" required className="input w-full">
                {enrolledTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Visitante</span>
              <select name="awayTeamId" required className="input w-full">
                {enrolledTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Fecha y hora</span>
              <input name="matchDate" type="datetime-local" required className="input w-full" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Sede / cancha</span>
              <input name="venue" placeholder="Opcional" className="input w-full" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Fecha (jornada)</span>
              <input name="round" type="number" min={1} placeholder="Opcional, ej. 3" className="input w-full" />
            </label>
            {isGrupos && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-600">Grupo</span>
                <select name="groupId" className="input w-full">
                  <option value="">Sin grupo</option>
                  {tournament.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Etapa</span>
              <input name="stage" placeholder="Ej. Cuartos de final (opcional)" className="input w-full" />
            </label>
            <div className="sm:col-span-2">
              <button className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: league.primaryColor }}>
                Programar
              </button>
            </div>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-800">Capturar resultados</h2>
        {scheduled.length === 0 ? (
          <p className="text-sm text-slate-500">No hay partidos pendientes por capturar.</p>
        ) : (
          <div className="space-y-4">
            {scheduled.map((m) => {
              const submit = submitResultAction.bind(null, liga, m.id);
              return (
                <form key={m.id} action={submit} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-center gap-3 font-medium text-slate-800">
                    <span className="flex-1 text-right">{m.homeTeam.name}</span>
                    <input name="homeScore" type="number" min={0} defaultValue={0} className="input w-16 text-center" />
                    <span>–</span>
                    <input name="awayScore" type="number" min={0} defaultValue={0} className="input w-16 text-center" />
                    <span className="flex-1">{m.awayTeam.name}</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">{m.homeTeam.name}</p>
                      <div className="mb-1 flex justify-end gap-2 text-[10px] text-slate-400">
                        <span className="w-10 text-center">Goles</span>
                        <span className="w-8 text-center">Am</span>
                        <span className="w-8 text-center">Roj</span>
                      </div>
                      {m.homeTeam.rosterSpots.map((rs) => (
                        <div key={rs.id} className="flex items-center justify-between gap-2 py-0.5">
                          <span className="flex-1 truncate">{rs.player.fullName}</span>
                          <input type="number" min={0} defaultValue={0} name={`homeGoals_${rs.playerId}`} className="input w-10 text-center" />
                          <input type="number" min={0} defaultValue={0} name={`homeYellow_${rs.playerId}`} className="input w-8 text-center" />
                          <input type="number" min={0} defaultValue={0} name={`homeRed_${rs.playerId}`} className="input w-8 text-center" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">{m.awayTeam.name}</p>
                      <div className="mb-1 flex justify-end gap-2 text-[10px] text-slate-400">
                        <span className="w-10 text-center">Goles</span>
                        <span className="w-8 text-center">Am</span>
                        <span className="w-8 text-center">Roj</span>
                      </div>
                      {m.awayTeam.rosterSpots.map((rs) => (
                        <div key={rs.id} className="flex items-center justify-between gap-2 py-0.5">
                          <span className="flex-1 truncate">{rs.player.fullName}</span>
                          <input type="number" min={0} defaultValue={0} name={`awayGoals_${rs.playerId}`} className="input w-10 text-center" />
                          <input type="number" min={0} defaultValue={0} name={`awayYellow_${rs.playerId}`} className="input w-8 text-center" />
                          <input type="number" min={0} defaultValue={0} name={`awayRed_${rs.playerId}`} className="input w-8 text-center" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: league.primaryColor }}>
                    Guardar resultado
                  </button>
                </form>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
