import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLeagueBySlug } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import { Crest } from "@/components/Crest";
import {
  isAdminAuthed,
  createPlayerForTeamAction,
  addExistingPlayerToTeamAction,
  removeRosterSpotAction,
  deleteTeamAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminEquipoPage({
  params,
}: {
  params: Promise<{ liga: string; teamId: string }>;
}) {
  const { liga, teamId } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const authed = await isAdminAuthed(liga);
  if (!authed) redirect(`/admin/${liga}`);

  const team = await prisma.team.findFirst({
    where: { id: teamId, leagueId: league.id },
    include: { rosterSpots: { include: { player: true }, orderBy: { number: "asc" } } },
  });
  if (!team) notFound();

  const [otherLeaguePlayers, matchCount] = await Promise.all([
    prisma.player.findMany({
      where: {
        rosterSpots: { some: { team: { leagueId: league.id } } },
        NOT: { rosterSpots: { some: { teamId: team.id } } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.match.count({ where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] } }),
  ]);

  const createPlayer = createPlayerForTeamAction.bind(null, liga, team.id);
  const addExisting = addExistingPlayerToTeamAction.bind(null, liga, team.id);
  const deleteTeam = deleteTeamAction.bind(null, liga, team.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <div>
        <Link href={`/admin/${liga}/equipos`} className="text-sm text-slate-400 hover:underline">
          ← Equipos
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <Crest name={team.name} url={team.crestUrl} size={40} />
          <h1 className="text-xl font-bold text-slate-900">{team.name}</h1>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Plantilla ({team.rosterSpots.length})</h2>
        <div className="divide-y divide-slate-100">
          {team.rosterSpots.map((rs) => {
            const removeSpot = removeRosterSpotAction.bind(null, liga, team.id, rs.id);
            return (
              <div key={rs.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-6 text-center font-bold text-slate-400">{rs.number ?? "-"}</span>
                <Link href={`/jugador/${rs.playerId}`} className="flex-1 font-medium text-slate-800 hover:underline">
                  {rs.player.fullName}
                </Link>
                <span className="text-xs text-slate-400">{rs.position}</span>
                <form action={removeSpot}>
                  <button className="text-xs font-semibold text-red-600 hover:underline">Quitar del equipo</button>
                </form>
              </div>
            );
          })}
          {team.rosterSpots.length === 0 && <p className="py-2 text-sm text-slate-500">Sin jugadores todavía.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Agregar jugador nuevo</h2>
        <form action={createPlayer} className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Nombre completo</span>
            <input name="fullName" required className="input" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Número</span>
            <input name="number" type="number" min={0} className="input w-20" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Posición</span>
            <input name="position" placeholder="Ej. Portero" className="input" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Foto (opcional)</span>
            <input name="photoFile" type="file" accept="image/*" className="input" />
          </label>
          <button className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: league.primaryColor }}>
            Agregar
          </button>
        </form>
      </section>

      {otherLeaguePlayers.length > 0 && (
        <section className="rounded-xl border border-slate-200 p-5">
          <h2 className="mb-1 font-semibold text-slate-800">Sumar jugador de otro equipo de la liga</h2>
          <p className="mb-3 text-xs text-slate-500">
            Un jugador puede moverse de equipo sin perder su historial de estadísticas.
          </p>
          <form action={addExisting} className="flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Jugador</span>
              <select name="playerId" required className="input">
                {otherLeaguePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Número</span>
              <input name="number" type="number" min={0} className="input w-20" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Posición</span>
              <input name="position" placeholder="Ej. Defensa" className="input" />
            </label>
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Sumar al equipo
            </button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-red-100 p-5">
        <h2 className="mb-2 font-semibold text-red-700">Eliminar equipo</h2>
        {matchCount > 0 ? (
          <p className="text-sm text-slate-500">
            No se puede eliminar: este equipo ya tiene {matchCount} partido(s) registrados en su historial.
          </p>
        ) : (
          <form action={deleteTeam}>
            <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              Eliminar equipo
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
