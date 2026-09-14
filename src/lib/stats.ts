import { prisma } from "@/lib/prisma";
import { MatchEventType, MatchStatus } from "@prisma/client";

export type StandingRow = {
  teamId: string;
  teamName: string;
  shortName: string | null;
  crestUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export async function getStandings(seasonId: string): Promise<StandingRow[]> {
  const teamSeasons = await prisma.teamSeason.findMany({
    where: { seasonId },
    include: { team: true },
  });

  const table = new Map<string, StandingRow>();
  for (const ts of teamSeasons) {
    table.set(ts.teamId, {
      teamId: ts.teamId,
      teamName: ts.team.name,
      shortName: ts.team.shortName,
      crestUrl: ts.team.crestUrl,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  }

  const matches = await prisma.match.findMany({
    where: { seasonId, status: MatchStatus.PLAYED },
  });

  for (const m of matches) {
    if (m.homeScore == null || m.awayScore == null) continue;
    const home = table.get(m.homeTeamId);
    const away = table.get(m.awayTeamId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (m.homeScore < m.awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of table.values()) {
    row.goalDiff = row.goalsFor - row.goalsAgainst;
  }

  return Array.from(table.values()).sort(
    (a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor,
  );
}

export type ScorerRow = {
  playerId: string;
  fullName: string;
  teamId: string;
  teamName: string;
  goals: number;
};

export async function getTopScorers(seasonId: string, limit = 10): Promise<ScorerRow[]> {
  const events = await prisma.matchEvent.findMany({
    where: { type: MatchEventType.GOAL, match: { seasonId } },
    include: { player: true, team: true },
  });

  const byPlayer = new Map<string, ScorerRow>();
  for (const e of events) {
    const key = `${e.playerId}-${e.teamId}`;
    const existing = byPlayer.get(key);
    if (existing) {
      existing.goals += 1;
    } else {
      byPlayer.set(key, {
        playerId: e.playerId,
        fullName: e.player.fullName,
        teamId: e.teamId,
        teamName: e.team.name,
        goals: 1,
      });
    }
  }

  return Array.from(byPlayer.values())
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit);
}

export async function getPlayerGlobalProfile(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      rosterSpots: {
        include: { team: { include: { league: true } } },
      },
    },
  });
  if (!player) return null;

  const events = await prisma.matchEvent.findMany({
    where: { playerId },
    include: { match: { include: { season: { include: { league: true } } } }, team: true },
  });

  const goals = events.filter((e) => e.type === MatchEventType.GOAL);
  const yellows = events.filter((e) => e.type === MatchEventType.YELLOW_CARD);
  const reds = events.filter((e) => e.type === MatchEventType.RED_CARD);

  const leaguesMap = new Map<
    string,
    { leagueName: string; leagueSlug: string; teamName: string; goals: number; matches: Set<string> }
  >();

  for (const rs of player.rosterSpots) {
    const key = `${rs.team.leagueId}-${rs.team.id}`;
    if (!leaguesMap.has(key)) {
      leaguesMap.set(key, {
        leagueName: rs.team.league.name,
        leagueSlug: rs.team.league.slug,
        teamName: rs.team.name,
        goals: 0,
        matches: new Set(),
      });
    }
  }

  for (const g of goals) {
    const key = `${g.match.season.leagueId}-${g.teamId}`;
    const entry = leaguesMap.get(key);
    if (entry) {
      entry.goals += 1;
      entry.matches.add(g.matchId);
    }
  }

  const matchesInvolved = new Set(events.map((e) => e.matchId));

  return {
    id: player.id,
    fullName: player.fullName,
    photoUrl: player.photoUrl,
    totalGoals: goals.length,
    totalYellowCards: yellows.length,
    totalRedCards: reds.length,
    matchesWithInvolvement: matchesInvolved.size,
    leagueBreakdown: Array.from(leaguesMap.values()).map((v) => ({
      leagueName: v.leagueName,
      leagueSlug: v.leagueSlug,
      teamName: v.teamName,
      goals: v.goals,
    })),
    leaguesCount: new Set(player.rosterSpots.map((rs) => rs.team.leagueId)).size,
  };
}
