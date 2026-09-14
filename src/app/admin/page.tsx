import Link from "next/link";
import { getAllLeagues } from "@/lib/leagues";

export default async function AdminIndexPage() {
  const leagues = await getAllLeagues();

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-xl font-bold text-slate-900">Panel de administración</h1>
      <p className="mt-1 text-sm text-slate-500">Elige la liga que quieres administrar.</p>
      <div className="mt-6 space-y-2">
        {leagues.map((l) => (
          <Link
            key={l.id}
            href={`/admin/${l.slug}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:shadow-sm"
          >
            <span className="font-medium text-slate-800">{l.name}</span>
            <span className="h-3 w-3 rounded-full" style={{ background: l.primaryColor }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
