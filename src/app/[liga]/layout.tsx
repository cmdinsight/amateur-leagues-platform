import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueBySlug } from "@/lib/leagues";
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
              { href: `/${liga}/divisiones`, label: "Divisiones" },
              { href: `/${liga}/equipos`, label: "Equipos" },
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

      <footer className="border-t border-slate-100 bg-slate-50 py-4 text-center text-xs text-slate-400">
        <p>
          {league.name} · powered by{" "}
          <Link href="/" className="font-medium hover:underline">
            LigaPro
          </Link>{" "}
          · creado por{" "}
          <a href="https://cmdtech.uy" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
            CMD Tech
          </a>
        </p>
      </footer>
    </div>
  );
}
