import Link from "next/link";
import { getAllLeagues } from "@/lib/leagues";
import { Crest } from "@/components/Crest";

export default async function HomePage() {
  const leagues = await getAllLeagues();

  return (
    <div className="flex flex-col">
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Software para ligas deportivas amateur
          </p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            Tu liga, con tu marca,
            <br className="hidden sm:block" /> y el historial del jugador en todos lados.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-slate-300">
            Tablas de posiciones, goleo, calendario y plantillas para cada liga que administres —
            cada una con sus propios colores y logo. Y a diferencia de otras plataformas, el
            historial de cada jugador lo sigue aunque cambie de equipo o de liga.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="#ligas"
              className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-slate-900 hover:bg-emerald-400 transition"
            >
              Ver ligas de ejemplo
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10 transition"
            >
              Panel de administración
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12">
        <h2 className="mb-1 text-xl font-bold text-slate-900">¿Qué incluye?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Feature
            title="Marca propia por liga"
            desc="Colores, logo y nombre editables para cada liga cliente, sin tocar código."
          />
          <Feature
            title="Historial global del jugador"
            desc="Un jugador conserva sus goles, tarjetas y trayectoria aunque juegue en varias ligas."
          />
          <Feature
            title="Todo en un panel"
            desc="Captura resultados, arma calendarios y gestiona plantillas desde un solo lugar."
          />
        </div>
      </section>

      <section id="ligas" className="mx-auto w-full max-w-5xl px-4 pb-16">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Ligas en esta plataforma</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {leagues.map((l) => (
            <Link
              key={l.id}
              href={`/${l.slug}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5 hover:shadow-md transition"
              style={{ borderColor: l.primaryColor + "33" }}
            >
              <Crest name={l.name} url={l.logoUrl} size={48} />
              <div>
                <p className="font-bold text-slate-900">{l.name}</p>
                <p className="text-sm text-slate-500">{l.city}</p>
              </div>
              <span
                className="ml-auto h-3 w-3 rounded-full"
                style={{ background: l.primaryColor }}
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}
