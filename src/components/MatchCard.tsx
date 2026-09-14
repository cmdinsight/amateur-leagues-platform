import { Crest } from "./Crest";
import { formatMatchDate } from "@/lib/format";

type MatchLike = {
  id: string;
  matchDate: Date;
  status: "SCHEDULED" | "PLAYED" | "POSTPONED";
  venue: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { name: string; crestUrl: string | null };
  awayTeam: { name: string; crestUrl: string | null };
};

export function MatchCard({ match }: { match: MatchLike }) {
  const played = match.status === "PLAYED";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <Crest name={match.homeTeam.name} url={match.homeTeam.crestUrl} size={26} />
        <span className="truncate font-medium text-slate-800">{match.homeTeam.name}</span>
      </div>

      <div className="flex flex-col items-center px-2 shrink-0">
        {played ? (
          <span className="text-lg font-bold text-slate-900">
            {match.homeScore} – {match.awayScore}
          </span>
        ) : (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ background: "var(--league-primary, #16a34a)" }}
          >
            VS
          </span>
        )}
        <span className="mt-1 text-[11px] text-slate-400 whitespace-nowrap">
          {formatMatchDate(match.matchDate)}
        </span>
        {match.venue && <span className="text-[11px] text-slate-400">{match.venue}</span>}
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
        <span className="truncate text-right font-medium text-slate-800">{match.awayTeam.name}</span>
        <Crest name={match.awayTeam.name} url={match.awayTeam.crestUrl} size={26} />
      </div>
    </div>
  );
}
