import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLeagueBySlug } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import { Crest } from "@/components/Crest";
import { isAdminAuthed, createTeamAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminEquiposPage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const authed = await isAdminAuthed(liga);
  if (!authed) redirect(`/admin/${liga}`);

  const teams = await prisma.team.findMany({
    where: { leagueId: league.id },
    include: { _count: { select: { rosterSpots: true } } },
    orderBy: { name: "asc" },
  });

  const createTeam = createTeamAction.bind(null, liga, league.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <div>
        <Link href={`/admin/${liga}`} className="text-sm text-slate-400 hover:underline">
          ← Panel admin
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Equipos — {league.name}</h1>
      </div>

      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-4 font-semibold text-slate-800">Equipos cargados</h2>
        <div className="divide-y divide-slate-100">
          {teams.map((t) => (
            <Link
              key={t.id}
              href={`/admin/${liga}/equipos/${t.id}`}
              className="flex items-center gap-3 py-3 hover:bg-slate-50"
            >
              <Crest name={t.name} url={t.crestUrl} size={36} />
              <div className="flex-1">
                <p className="font-medium text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-400">{t._count.rosterSpots} jugadores</p>
              </div>
              <span style={{ color: league.primaryColor }} className="text-sm font-medium">
                Gestionar plantilla →
              </span>
            </Link>
          ))}
          {teams.length === 0 && <p className="py-2 text-sm text-slate-500">Todavía no hay equipos cargados.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Agregar equipo nuevo</h2>
        <form action={createTeam} className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Nombre</span>
            <input name="name" required placeholder="Ej. Halcones FC" className="input" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Sigla (opcional)</span>
            <input name="shortName" placeholder="Ej. HAL" className="input w-24" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Escudo (opcional)</span>
            <input name="crestFile" type="file" accept="image/*" className="input" />
          </label>
          <button className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: league.primaryColor }}>
            Crear equipo
          </button>
        </form>
      </section>
    </div>
  );
}
