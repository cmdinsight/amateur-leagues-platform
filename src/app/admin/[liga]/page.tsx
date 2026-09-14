import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueBySlug, getDivisions } from "@/lib/leagues";
import {
  isAdminAuthed,
  loginAction,
  logoutAction,
  updateBrandingAction,
  createDivisionAction,
  createTournamentAction,
} from "./actions";

export const dynamic = "force-dynamic";

const FORMAT_LABEL: Record<string, string> = {
  LIGA: "Liga (todos contra todos)",
  GRUPOS: "Fase de grupos",
  ELIMINACION: "Eliminación directa",
};

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
          <input name="password" type="password" placeholder="Contraseña" className="input w-full" required />
          {error && <p className="text-sm text-red-600">Contraseña incorrecta.</p>}
          <button className="w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">Entrar</button>
          <p className="text-xs text-slate-400">
            Demo: la contraseña por defecto de cada liga sembrada es <code>demo1234</code>.
          </p>
        </form>
      </div>
    );
  }

  const divisions = await getDivisions(league.id);
  const updateBranding = updateBrandingAction.bind(null, liga);
  const logout = logoutAction.bind(null, liga);
  const createDivision = createDivisionAction.bind(null, liga, league.id);

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
            <input name="name" defaultValue={league.name} className="input w-full" />
          </Field>
          <Field label="Ciudad">
            <input name="city" defaultValue={league.city ?? ""} className="input w-full" />
          </Field>
          <Field label="URL del logo">
            <input name="logoUrl" defaultValue={league.logoUrl ?? ""} className="input w-full" placeholder="https://..." />
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

      <section className="space-y-4">
        <h2 className="font-semibold text-slate-800">Divisiones y torneos</h2>

        {divisions.map((division) => {
          const createTournament = createTournamentAction.bind(null, liga, division.id);
          return (
            <div key={division.id} className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 font-semibold text-slate-800">{division.name}</p>

              <div className="mb-3 space-y-1">
                {division.tournaments.map((t) => (
                  <Link
                    key={t.id}
                    href={`/admin/${liga}/torneos/${t.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <span>
                      {t.name} <span className="text-slate-400">— {FORMAT_LABEL[t.format] ?? t.format}</span>
                    </span>
                    <span style={{ color: "var(--league-primary, #16a34a)" }} className="font-medium">
                      Gestionar →
                    </span>
                  </Link>
                ))}
                {division.tournaments.length === 0 && (
                  <p className="px-3 text-sm text-slate-500">Sin torneos todavía.</p>
                )}
              </div>

              <form action={createTournament} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                <Field label="Nuevo torneo">
                  <input name="name" required placeholder="Ej. Apertura 2027" className="input" />
                </Field>
                <Field label="Sistema">
                  <select name="format" className="input">
                    <option value="LIGA">Liga (todos contra todos)</option>
                    <option value="GRUPOS">Fase de grupos</option>
                    <option value="ELIMINACION">Eliminación directa</option>
                  </select>
                </Field>
                <Field label="Máx. equipos">
                  <input name="maxTeams" type="number" min={2} placeholder="Opcional" className="input w-28" />
                </Field>
                <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">Crear torneo</button>
              </form>
            </div>
          );
        })}

        <form action={createDivision} className="flex items-end gap-2 rounded-xl border border-dashed border-slate-300 p-4">
          <Field label="Nueva división">
            <input name="name" required placeholder="Ej. Tercera División" className="input" />
          </Field>
          <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">Crear división</button>
        </form>
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
