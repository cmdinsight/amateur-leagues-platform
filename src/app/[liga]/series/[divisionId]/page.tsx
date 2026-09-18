import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeagueBySlug, getDivisionById } from "@/lib/leagues";
import { getDivisionTotals } from "@/lib/stats";
import { TotalsRow } from "@/components/TotalsRow";

export const dynamic = "force-dynamic";

const FORMAT_LABEL: Record<string, string> = {
  LIGA: "Liga (todos contra todos)",
  GRUPOS: "Fase de grupos",
  ELIMINACION: "Eliminación directa",
};

export default async function DivisionPage({
  params,
}: {
  params: Promise<{ liga: string; divisionId: string }>;
}) {
  const { liga, divisionId } = await params;
  const league = await getLeagueBySlug(liga);
  if (!league) notFound();

  const division = await getDivisionById(divisionId);
  if (!division || division.leagueId !== league.id) notFound();

  const totals = await getDivisionTotals(division.id);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-400">{league.name}</p>
        <h1 className="text-xl font-bold text-slate-900">{division.name}</h1>
      </div>

      <TotalsRow totals={totals} title="Histórico de la serie" />

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Torneos</h2>
        <div className="space-y-2">
          {division.tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/${liga}/torneos/${t.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition"
            >
              <div>
                <p className="font-semibold text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-400">{FORMAT_LABEL[t.format] ?? t.format}</p>
              </div>
              {t.isActive && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ background: "var(--league-primary)" }}
                >
                  Activo
                </span>
              )}
            </Link>
          ))}
          {division.tournaments.length === 0 && (
            <p className="text-sm text-slate-500">Esta serie aún no tiene torneos.</p>
          )}
        </div>
      </section>
    </div>
  );
}
