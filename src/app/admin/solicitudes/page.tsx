import { prisma } from "@/lib/prisma";
import { isPlatformAuthed, platformLoginAction, platformLogoutAction, deleteContactRequestAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const authed = await isPlatformAuthed();

  if (!authed) {
    return (
      <div className="mx-auto mt-16 max-w-sm px-4">
        <h1 className="text-xl font-bold text-slate-900">Solicitudes — CMD Tech</h1>
        <form action={platformLoginAction} className="mt-4 space-y-3">
          <input name="password" type="password" placeholder="Contraseña" className="input w-full" required />
          {error && <p className="text-sm text-red-600">Contraseña incorrecta.</p>}
          <button className="w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">Entrar</button>
        </form>
      </div>
    );
  }

  const requests = await prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Solicitudes de clientes ({requests.length})</h1>
        <form action={platformLogoutAction}>
          <button className="text-sm text-slate-400 hover:underline">Cerrar sesión</button>
        </form>
      </div>
      <div className="space-y-3">
        {requests.map((r) => {
          const deleteRequest = deleteContactRequestAction.bind(null, r.id);
          return (
            <div key={r.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{r.leagueName}</p>
                  <p className="text-sm text-slate-500">
                    {r.fullName} {r.city ? `· ${r.city}` : ""}
                  </p>
                  <p className="text-sm text-slate-500">{r.contact}</p>
                </div>
                <form action={deleteRequest}>
                  <button className="text-xs font-semibold text-red-600 hover:underline">Borrar</button>
                </form>
              </div>
              {r.message && <p className="mt-2 text-sm text-slate-600">{r.message}</p>}
              <p className="mt-2 text-xs text-slate-400">{r.createdAt.toLocaleString("es-UY")}</p>
            </div>
          );
        })}
        {requests.length === 0 && <p className="text-sm text-slate-500">Todavía no hay solicitudes.</p>}
      </div>
    </div>
  );
}
