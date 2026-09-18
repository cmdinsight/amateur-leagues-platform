import Link from "next/link";
import { goToLeagueAdminAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-bold text-slate-900">Panel de administración</h1>
      <p className="mt-1 text-sm text-slate-500">Ingresá el identificador de tu liga para administrarla.</p>
      <form action={goToLeagueAdminAction} className="mt-6 space-y-3">
        <input
          name="slug"
          required
          placeholder="Ej. guadalupe"
          className="input w-full"
          autoCapitalize="off"
          autoCorrect="off"
        />
        {error && <p className="text-sm text-red-600">No encontramos una liga con ese identificador.</p>}
        <button className="w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">Continuar</button>
      </form>
      <p className="mt-6 text-sm text-slate-400">
        ¿Todavía no tenés tu liga en la plataforma?{" "}
        <Link href="/#solicitar" className="font-medium text-slate-600 hover:underline">
          Solicitala acá
        </Link>
        .
      </p>
    </div>
  );
}
