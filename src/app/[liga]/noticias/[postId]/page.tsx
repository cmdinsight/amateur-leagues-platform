import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ liga: string; postId: string }>;
}) {
  const { liga, postId } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const post = await prisma.newsPost.findFirst({ where: { id: postId, leagueId: league.id } });
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl space-y-3">
      <Link href={`/${liga}/noticias`} className="text-sm text-slate-400 hover:underline">
        ← Noticias
      </Link>
      <p className="text-xs text-slate-400">{formatDate(post.publishedAt)}</p>
      <h1 className="text-2xl font-bold text-slate-900">{post.title}</h1>
      <p className="whitespace-pre-wrap text-slate-700">{post.body}</p>
    </article>
  );
}
