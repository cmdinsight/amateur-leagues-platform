import { notFound } from "next/navigation";
import { getLeagueBySlug } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GaleriaPage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const photos = await prisma.photo.findMany({ where: { leagueId: league.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Galería</h1>
      {photos.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay fotos publicadas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <figure key={p.id} className="overflow-hidden rounded-xl border border-slate-200">
              <img src={p.url} alt={p.caption ?? ""} className="aspect-square w-full object-cover" />
              {p.caption && <figcaption className="px-2 py-1 text-xs text-slate-500">{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
