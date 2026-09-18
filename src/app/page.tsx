import Link from "next/link";
import { getAllLeagues } from "@/lib/leagues";
import { Crest } from "@/components/Crest";
import { createContactRequestAction } from "./admin/actions";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ solicitud?: string }>;
}) {
  const [leagues, { solicitud }] = await Promise.all([getAllLeagues(), searchParams]);

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
            <a
              href="#ligas"
              className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-slate-900 hover:bg-emerald-400 transition"
            >
              Ver ligas de ejemplo
            </a>
            <a
              href="#solicitar"
              className="rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10 transition"
            >
              Solicitar mi liga
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12">
        <h2 className="mb-1 text-xl font-bold text-slate-900">¿Qué incluye?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            title="Marca propia por liga"
            desc="Colores, logo y nombre editables para cada liga cliente, sin tocar código."
          />
          <Feature
            title="Historial global del jugador"
            desc="Un jugador conserva sus goles, tarjetas y trayectoria aunque juegue en varias ligas."
          />
          <Feature
            title="Series, torneos y grupos"
            desc="Varias divisiones por liga, cada una con sus propios torneos y formato (liga, grupos o eliminación)."
          />
          <Feature
            title="Todo en un panel"
            desc="Captura resultados, gestiona plantillas, sponsors, galería y noticias desde un solo lugar."
          />
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto w-full max-w-5xl px-4">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Cómo funciona</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Step
              number={1}
              title="Nos contás tu liga"
              desc="Completás el formulario de abajo con los datos de tu liga o torneo."
            />
            <Step
              number={2}
              title="Te armamos tu espacio"
              desc="Configuramos tu liga con tu nombre, colores y logo, lista para usar."
            />
            <Step
              number={3}
              title="Cargás y arrancás"
              desc="Entrás a tu panel, cargás equipos y jugadores, y programás tus partidos."
            />
          </div>
        </div>
      </section>

      <section id="ligas" className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Ligas de ejemplo</h2>
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

      <section id="solicitar" className="bg-slate-900 py-16 text-white">
        <div className="mx-auto w-full max-w-lg px-4">
          <h2 className="text-xl font-bold">Solicitá tu liga</h2>
          <p className="mt-1 text-sm text-slate-300">
            Contanos sobre tu liga o torneo y te contactamos para dejarla lista en la plataforma.
          </p>
          <p className="mt-3 rounded-lg bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">
            ¿Sos cliente de CMD Cobertura Médica Deportiva? El software es gratis para vos.
          </p>
          {solicitud === "ok" && (
            <p className="mt-4 rounded-lg bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">
              ¡Listo! Recibimos tu solicitud, te vamos a contactar a la brevedad.
            </p>
          )}
          <form action={createContactRequestAction} className="mt-6 space-y-3">
            <input name="fullName" required placeholder="Tu nombre" className="input w-full" />
            <input name="leagueName" required placeholder="Nombre de tu liga o torneo" className="input w-full" />
            <input name="city" placeholder="Ciudad (opcional)" className="input w-full" />
            <input name="contact" required placeholder="Email o teléfono" className="input w-full" />
            <textarea name="message" rows={3} placeholder="Contanos más (opcional)" className="input w-full" />
            <label className="flex items-start gap-2 text-xs text-slate-300">
              <input type="checkbox" required className="mt-0.5" />
              <span>
                Acepto la{" "}
                <Link href="/privacidad" className="font-medium underline hover:text-white">
                  política de privacidad
                </Link>
                .
              </span>
            </label>
            <button className="w-full rounded-lg bg-emerald-500 py-2 font-semibold text-slate-900 hover:bg-emerald-400 transition">
              Enviar solicitud
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-slate-50 py-4 text-center text-xs text-slate-400">
        <p>
          <Link href="/admin" className="font-medium hover:underline">
            ¿Ya sos cliente? Entrá a tu panel
          </Link>
        </p>
        <p className="mt-1">
          Creado por{" "}
          <a href="https://cmdtech.uy" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
            CMD Tech
          </a>
        </p>
      </footer>
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

function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div>
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
        {number}
      </div>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}
