import { notFound } from "next/navigation";
import { getLeagueBySlug } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import {
  isAdminAuthed,
  loginAction,
  logoutAction,
  updateBrandingAction,
  submitResultAction,
} from "./actions";

export default async function AdminLeaguePage({
  params,
  searchParams,
}: {
  params: Promise<{ liga: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { liga } = await params;
  const { error } = await searchParams;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const authed = await isAdminAuthed(liga);

  if (!authed) {
    const login = loginAction.bind(null, liga);
    return (
      <div className="mx-auto mt-16 max-w-sm px-4">
        <h1 className="text-xl font-bold text-slate-900">Acceso admin — {league.name}</h1>
        <form action={login} className="mt-4 space-y-3">
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
          {error && <p className="text-sm text-red-600">Contraseña incorrecta.</p>}
          <button className="w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
            Entrar
          </button>
          <p className="text-xs text-slate-400">
            Demo: la contraseña por defecto de cada liga sembrada es <code>demo1234</code>.
          </p>
        </form>
      </div>
    );
  }

  const scheduled = await prisma.match.findMany({
    where: { season: { leagueId: league.id }, status: "SCHEDULED" },
    include: {
      homeTeam: { include: { rosterSpots: { include: { player: true } } } },
      awayTeam: { include: { rosterSpots: { include: { player: true } } } },
    },
    orderBy: { matchDate: "asc" },
  });

  const updateBranding = updateBrandingAction.bind(null, liga);
  const logout = logoutAction.bind(null, liga);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Panel admin — {league.name}</h1>
        <form action={logout}>
          <button className="text-sm text-slate-400 hover:underline">Cerrar sesión</button>
        </form>
      </div>

      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-4 font-semibold text-slate-800">Marca de la liga</h2>
        <form action={updateBranding} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre de la liga">
            <input name="name" defaultValue={league.name} className="input" />
          </Field>
          <Field label="Ciudad">
            <input name="city" defaultValue={league.city ?? ""} className="input" />
          </Field>
          <Field label="URL del logo">
            <input name="logoUrl" defaultValue={league.logoUrl ?? ""} className="input" placeholder="https://..." />
          </Field>
          <div className="flex gap-4">
            <Field label="Color primario">
              <input type="color" name="primaryColor" defaultValue={league.primaryColor} className="h-10 w-16" />
            </Field>
            <Field label="Color de acento">
              <input type="color" name="accentColor" defaultValue={league.accentColor} className="h-10 w-16" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button className="rounded-lg px-4 py-2 font-semibold text-white" style={{ background: league.primaryColor }}>
              Guardar cambios
            </button>
          </div>
        </form>
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
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                        Goles — {m.homeTeam.name}
                      </p>
                      {m.homeTeam.rosterSpots.map((rs) => (
                        <div key={rs.id} className="flex items-center justify-between py-0.5">
                          <span>{rs.player.fullName}</span>
                          <input
                            type="number"
                            min={0}
                            defaultValue={0}
                            name={`homeGoals_${rs.playerId}`}
                            className="input w-14 text-center"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                        Goles — {m.awayTeam.name}
                      </p>
                      {m.awayTeam.rosterSpots.map((rs) => (
                        <div key={rs.id} className="flex items-center justify-between py-0.5">
                          <span>{rs.player.fullName}</span>
                          <input
                            type="number"
                            min={0}
                            defaultValue={0}
                            name={`awayGoals_${rs.playerId}`}
                            className="input w-14 text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: league.primaryColor }}
                  >
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
