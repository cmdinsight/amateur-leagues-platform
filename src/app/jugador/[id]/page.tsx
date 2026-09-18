import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayerGlobalProfile } from "@/lib/stats";
import { Crest } from "@/components/Crest";

export const dynamic = "force-dynamic";

export default async function PlayerGlobalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPlayerGlobalProfile(id);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-slate-400 hover:underline">
        ← LigaPro
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <Crest name={profile.fullName} url={profile.photoUrl} size={64} />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{profile.fullName}</h1>
          <p className="text-sm text-slate-500">
            Historial global · activo en {profile.leaguesCount}{" "}
            {profile.leaguesCount === 1 ? "liga" : "ligas"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Partidos jugados" value={profile.matchesPlayed} />
        <StatBox label="Goles totales" value={profile.totalGoals} />
        <StatBox label="Tarjetas amarillas" value={profile.totalYellowCards} />
        <StatBox label="Tarjetas rojas" value={profile.totalRedCards} />
      </div>
      {profile.matchesAsGoalkeeper > 0 && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Jugó como arquero en {profile.matchesAsGoalkeeper}{" "}
          {profile.matchesAsGoalkeeper === 1 ? "partido" : "partidos"}.
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Trayectoria por liga y equipo
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          A diferencia de una plataforma por liga aislada, este historial sigue al jugador aunque
          cambie de equipo o de liga.
        </p>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          {profile.leagueBreakdown.map((lb, i) => (
            <Link
              key={i}
              href={`/${lb.leagueSlug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-800">{lb.teamName}</p>
                <p className="text-xs text-slate-400">
                  {lb.leagueName}
                  {lb.divisionName ? ` · ${lb.divisionName}` : ""}
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-700">{lb.goals} goles</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
