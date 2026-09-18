import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueBySlug } from "@/lib/leagues";
import { prisma } from "@/lib/prisma";
import { Crest } from "@/components/Crest";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ liga: string }>;
}) {
  const { liga } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const sponsors = await prisma.sponsor.findMany({ where: { leagueId: league.id }, orderBy: { createdAt: "asc" } });

  return (
    <div
      className="flex min-h-screen flex-col"
      style={
        {
          "--league-primary": league.primaryColor,
          "--league-accent": league.accentColor,
        } as React.CSSProperties
      }
    >
      <header
        className="text-white"
        style={{ background: `linear-gradient(120deg, ${league.primaryColor}, ${league.accentColor})` }}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-4">
          <Crest name={league.name} url={league.logoUrl} size={40} />
          <div className="mr-auto">
            <p className="text-lg font-bold leading-tight">{league.name}</p>
            {league.city && <p className="text-xs text-white/80">{league.city}</p>}
          </div>
          <nav className="flex flex-wrap gap-1 text-sm font-medium">
            {[
              { href: `/${liga}`, label: "Inicio" },
              { href: `/${liga}/series`, label: "Series" },
              { href: `/${liga}/equipos`, label: "Equipos" },
              { href: `/${liga}/galeria`, label: "Galería" },
              { href: `/${liga}/noticias`, label: "Noticias" },
              { href: `/${liga}/jugadores-libres`, label: "Jugadores Libres" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 hover:bg-white/15 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

      {sponsors.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 py-6">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-4">
            {sponsors.map((s) =>
              s.linkUrl ? (
                <a key={s.id} href={s.linkUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.logoUrl} alt={s.name} className="h-8 object-contain opacity-80 hover:opacity-100" />
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={s.id} src={s.logoUrl} alt={s.name} className="h-8 object-contain opacity-80" />
              ),
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-slate-100 bg-slate-50 py-4 text-center text-xs text-slate-400">
        <p>
          {league.name} · creado por{" "}
          <a href="https://cmdtech.uy" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
            CMD Tech
          </a>
        </p>
      </footer>
    </div>
  );
}
