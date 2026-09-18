import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  isPlatformAuthed,
  platformLoginAction,
  platformLogoutAction,
  deleteContactRequestAction,
  createLeagueAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; leagueName?: string; city?: string }>;
}) {
  const { error, created, leagueName, city } = await searchParams;
  const authed = await isPlatformAuthed();

  if (!authed) {
    return (
      <div className="mx-auto mt-16 max-w-sm px-4">
        <Link href="/" className="text-sm text-slate-400 hover:underline">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Solicitudes — CMD Tech</h1>
        <form action={platformLoginAction} className="mt-4 space-y-3">
          <input name="password" type="password" placeholder="Contraseña" className="input w-full" required />
          {error && <p className="text-sm text-red-600">Contraseña incorrecta.</p>}
          <button className="w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">Entrar</button>
        </form>
      </div>
    );
  }

  const [requests, createdLeague] = await Promise.all([
    prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" } }),
    created ? prisma.league.findUnique({ where: { slug: created } }) : null,
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-10">
      <div>
        <Link href="/" className="text-sm text-slate-400 hover:underline">
          ← Inicio
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Panel de CMD Tech</h1>
          <form action={platformLogoutAction}>
            <button className="text-sm text-slate-400 hover:underline">Cerrar sesión</button>
          </form>
        </div>
      </div>

      {createdLeague && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-semibold text-emerald-800">¡Liga creada! Estos son los accesos para el cliente:</p>
          <ul className="mt-2 space-y-1 text-emerald-900">
            <li>
              Link del panel: <code className="rounded bg-white px-1.5 py-0.5">/admin/{createdLeague.slug}</code>
            </li>
            <li>
              Identificador de liga: <code className="rounded bg-white px-1.5 py-0.5">{createdLeague.slug}</code>
            </li>
            <li>
              Contraseña: <code className="rounded bg-white px-1.5 py-0.5">{createdLeague.adminPassword}</code>
            </li>
          </ul>
          <p className="mt-2 text-xs text-emerald-700">
            Copiá estos datos y envíaselos al cliente — no vuelven a mostrarse acá.
          </p>
        </div>
      )}

      <section id="crear-liga" className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-1 font-semibold text-slate-800">Crear liga nueva</h2>
        <p className="mb-4 text-sm text-slate-500">
          Da de alta un cliente: le asigna un identificador de liga (usado en la URL y para entrar a
          su panel) y una contraseña de administrador.
        </p>
        {error === "liga" && <p className="mb-3 text-sm text-red-600">Completá al menos el nombre de la liga.</p>}
        <form action={createLeagueAction} className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Nombre de la liga</span>
            <input name="name" required defaultValue={leagueName} className="input w-full" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Identificador (opcional)</span>
            <input name="slug" placeholder="Se genera del nombre si lo dejás vacío" className="input w-full" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Ciudad (opcional)</span>
            <input name="city" defaultValue={city} className="input w-full" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Contraseña (opcional)</span>
            <input name="adminPassword" placeholder="Se genera una si la dejás vacía" className="input w-full" />
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Crear liga
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-800">Solicitudes de clientes ({requests.length})</h2>
        {requests.map((r) => {
          const deleteRequest = deleteContactRequestAction.bind(null, r.id);
          return (
            <div key={r.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{r.leagueName}</p>
                  <p className="text-sm text-slate-500">
                    {r.fullName} {r.city ? `· ${r.city}` : ""}
                  </p>
                  <p className="text-sm text-slate-500">{r.contact}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Link
                    href={`/admin/solicitudes?leagueName=${encodeURIComponent(r.leagueName)}&city=${encodeURIComponent(r.city ?? "")}#crear-liga`}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    Convertir en liga
                  </Link>
                  <form action={deleteRequest}>
                    <button className="text-xs font-semibold text-red-600 hover:underline">Borrar</button>
                  </form>
                </div>
              </div>
              {r.message && <p className="mt-2 text-sm text-slate-600">{r.message}</p>}
              <p className="mt-2 text-xs text-slate-400">{r.createdAt.toLocaleString("es-UY")}</p>
            </div>
          );
        })}
        {requests.length === 0 && <p className="text-sm text-slate-500">Todavía no hay solicitudes.</p>}
      </section>
    </div>
  );
}
