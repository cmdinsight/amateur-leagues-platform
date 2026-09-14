import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import { Crest } from "@/components/Crest";

export const dynamic = "force-dynamic";

export default async function EquiposPage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const teams = await prisma.team.findMany({
    where: { leagueId: league.id },
    include: { _count: { select: { rosterSpots: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Equipos</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((t) => (
          <Link
            key={t.id}
            href={`/${liga}/equipos/${t.id}`}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition"
          >
            <Crest name={t.name} url={t.crestUrl} size={40} />
            <div>
              <p className="font-semibold text-slate-800">{t.name}</p>
              <p className="text-xs text-slate-400">{t._count.rosterSpots} jugadores</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
