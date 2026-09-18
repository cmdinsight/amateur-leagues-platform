import { notFound } from "next/navigation";
import { getLeagueBySlug } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import { createFreeAgentAction } from "@/app/admin/[liga]/actions";

export const dynamic = "force-dynamic";

export default async function JugadoresLibresPage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const listings = await prisma.freeAgentListing.findMany({
    where: { leagueId: league.id },
    orderBy: { createdAt: "desc" },
  });

  const jugadoresLibres = listings.filter((l) => l.type === "JUGADOR_LIBRE");
  const buscoEquipo = listings.filter((l) => l.type === "BUSCO_EQUIPO");
  const createListing = createFreeAgentAction.bind(null, liga, league.id);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-slate-900">Jugadores libres y equipos buscando refuerzos</h1>

      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Publicarme</h2>
        <form action={createListing} className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Tipo</span>
            <select name="type" className="input w-full">
              <option value="JUGADOR_LIBRE">Soy jugador y busco equipo</option>
              <option value="BUSCO_EQUIPO">Mi equipo busca jugadores</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Nombre {"/"} equipo</span>
            <input name="fullName" required className="input w-full" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Posición</span>
            <input name="position" placeholder="Opcional" className="input w-full" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Contacto (teléfono o email)</span>
            <input name="contact" required className="input w-full" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-600">Mensaje</span>
            <textarea name="message" rows={2} placeholder="Opcional" className="input w-full" />
          </label>
          <div className="sm:col-span-2">
            <button
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--league-primary)" }}
            >
              Publicar
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Jugadores libres</h2>
        <ListingList listings={jugadoresLibres} emptyText="No hay jugadores libres publicados." />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Equipos buscando jugadores</h2>
        <ListingList listings={buscoEquipo} emptyText="Ningún equipo está buscando jugadores por ahora." />
      </section>
    </div>
  );
}

function ListingList({
  listings,
  emptyText,
}: {
  listings: { id: string; fullName: string; position: string | null; contact: string; message: string | null }[];
  emptyText: string;
}) {
  if (listings.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>;
  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
      {listings.map((l) => (
        <div key={l.id} className="px-4 py-3 text-sm">
          <p className="font-medium text-slate-800">
            {l.fullName} {l.position && <span className="text-xs text-slate-400">· {l.position}</span>}
          </p>
          {l.message && <p className="mt-0.5 text-slate-500">{l.message}</p>}
          <p className="mt-0.5 text-xs text-slate-400">Contacto: {l.contact}</p>
        </div>
      ))}
    </div>
  );
}
