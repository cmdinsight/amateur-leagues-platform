import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug, getDivisions } from "@/lib/leagues";

export const dynamic = "force-dynamic";

export default async function DivisionesPage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const divisions = await getDivisions(league.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Divisiones</h1>
      <div className="space-y-3">
        {divisions.map((division) => (
          <Link
            key={division.id}
            href={`/${liga}/divisiones/${division.id}`}
            className="block rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition"
          >
            <p className="font-bold text-slate-900">{division.name}</p>
            <p className="text-xs text-slate-400">
              {division.tournaments.length} {division.tournaments.length === 1 ? "torneo" : "torneos"}
            </p>
          </Link>
        ))}
        {divisions.length === 0 && <p className="text-sm text-slate-500">Aún no hay divisiones creadas.</p>}
      </div>
    </div>
  );
}
