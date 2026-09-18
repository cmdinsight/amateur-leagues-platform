import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export default async function NoticiasPage({ params }: { params: Promise<{ liga: string }> }) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const posts = await prisma.newsPost.findMany({ where: { leagueId: league.id }, orderBy: { publishedAt: "desc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Noticias</h1>
      {posts.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay noticias publicadas.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${liga}/noticias/${post.id}`}
              className="block rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition"
            >
              <p className="text-xs text-slate-400">{formatDate(post.publishedAt)}</p>
              <p className="font-semibold text-slate-900">{post.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{post.body}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
