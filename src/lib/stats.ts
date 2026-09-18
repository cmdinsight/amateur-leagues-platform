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

function buildStandings(
  entries: { teamId: string; team: { name: string; shortName: string | null; crestUrl: string | null } }[],
  matches: { homeTeamId: string; awayTeamId: string; homeScore: number | null; awayScore: number | null }[],
): StandingRow[] {
  const table = new Map<string, StandingRow>();
  for (const e of entries) {
    table.set(e.teamId, {
      teamId: e.teamId,
      teamName: e.team.name,
      shortName: e.team.shortName,
      crestUrl: e.team.crestUrl,
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

  for (const row of table.values()) row.goalDiff = row.goalsFor - row.goalsAgainst;

  return Array.from(table.values()).sort(
    (a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor,
  );
}

export async function getStandings(tournamentId: string, groupId?: string): Promise<StandingRow[]> {
  const [entries, matches] = await Promise.all([
    prisma.teamTournament.findMany({
      where: { tournamentId, ...(groupId ? { groupId } : {}) },
      include: { team: true },
    }),
    prisma.match.findMany({
      where: { tournamentId, status: MatchStatus.PLAYED, ...(groupId ? { groupId } : {}) },
    }),
  ]);
  return buildStandings(entries, matches);
}

export type ScorerRow = {
  playerId: string;
  fullName: string;
  teamId: string;
  teamName: string;
  goals: number;
};

export async function getTopScorers(tournamentId: string, groupId?: string, limit = 10): Promise<ScorerRow[]> {
  const events = await prisma.matchEvent.findMany({
    where: {
      type: MatchEventType.GOAL,
      match: { tournamentId, ...(groupId ? { groupId } : {}) },
    },
    include: { player: true, team: true },
  });

  const byPlayer = new Map<string, ScorerRow>();
  for (const e of events) {
    const key = `${e.playerId}-${e.teamId}`;
    const existing = byPlayer.get(key);
    if (existing) existing.goals += 1;
    else byPlayer.set(key, { playerId: e.playerId, fullName: e.player.fullName, teamId: e.teamId, teamName: e.team.name, goals: 1 });
  }

  return Array.from(byPlayer.values())
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit);
}

export type GoalkeeperRow = {
  playerId: string;
  fullName: string;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  goalsConceded: number;
  average: number;
};

// Exact "imbatibles" ranking, built from MatchAppearance: the veedor marks
// who played as goalkeeper in each specific match, so we credit each keeper
// only with the goals their team conceded in the matches they actually kept.
export async function getGoalkeeperRanking(
  tournamentId: string,
  groupId?: string,
  limit = 10,
): Promise<GoalkeeperRow[]> {
  const appearances = await prisma.matchAppearance.findMany({
    where: {
      isGoalkeeper: true,
      match: { tournamentId, status: MatchStatus.PLAYED, ...(groupId ? { groupId } : {}) },
    },
    include: { player: true, team: true, match: true },
  });

  const byPlayer = new Map<string, GoalkeeperRow>();
  for (const a of appearances) {
    if (a.match.homeScore == null || a.match.awayScore == null) continue;
    const isHome = a.match.homeTeamId === a.teamId;
    const conceded = isHome ? a.match.awayScore : a.match.homeScore;

    const key = `${a.playerId}-${a.teamId}`;
    let row = byPlayer.get(key);
    if (!row) {
      row = {
        playerId: a.playerId,
        fullName: a.player.fullName,
        teamId: a.teamId,
        teamName: a.team.name,
        matchesPlayed: 0,
        goalsConceded: 0,
        average: 0,
      };
      byPlayer.set(key, row);
    }
    row.matchesPlayed += 1;
    row.goalsConceded += conceded;
  }

  const rows = Array.from(byPlayer.values()).map((row) => ({
    ...row,
    average: Math.round((row.goalsConceded / row.matchesPlayed) * 100) / 100,
  }));

  return rows.sort((a, b) => a.average - b.average || a.goalsConceded - b.goalsConceded).slice(0, limit);
}

export type SancionRow = {
  playerId: string;
  fullName: string;
  teamId: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
  suspended: boolean;
};

export async function getSanciones(tournamentId: string, groupId?: string): Promise<SancionRow[]> {
  const events = await prisma.matchEvent.findMany({
    where: {
      type: { in: [MatchEventType.YELLOW_CARD, MatchEventType.RED_CARD] },
      match: { tournamentId, ...(groupId ? { groupId } : {}) },
    },
    include: { player: true, team: true },
  });

  const byPlayer = new Map<string, SancionRow>();
  for (const e of events) {
    const key = `${e.playerId}-${e.teamId}`;
    let row = byPlayer.get(key);
    if (!row) {
      row = {
        playerId: e.playerId,
        fullName: e.player.fullName,
        teamId: e.teamId,
        teamName: e.team.name,
        yellowCards: 0,
        redCards: 0,
        suspended: false,
      };
      byPlayer.set(key, row);
    }
    if (e.type === MatchEventType.YELLOW_CARD) row.yellowCards += 1;
    else row.redCards += 1;
  }

  for (const row of byPlayer.values()) {
    row.suspended = row.redCards > 0 || row.yellowCards >= 3;
  }

  return Array.from(byPlayer.values()).sort(
    (a, b) => b.redCards - a.redCards || b.yellowCards - a.yellowCards,
  );
}

export type LeagueTotals = {
  totalGoals: number;
  totalMatchesPlayed: number;
  totalTeams: number;
  totalPlayers: number;
};

export async function getLeagueTotals(leagueId: string): Promise<LeagueTotals> {
  const [totalGoals, totalMatchesPlayed, totalTeams, totalPlayers] = await Promise.all([
    prisma.matchEvent.count({
      where: { type: MatchEventType.GOAL, match: { tournament: { division: { leagueId } } } },
    }),
    prisma.match.count({
      where: { status: MatchStatus.PLAYED, tournament: { division: { leagueId } } },
    }),
    prisma.team.count({ where: { leagueId } }),
    prisma.rosterSpot.findMany({ where: { team: { leagueId } }, select: { playerId: true }, distinct: ["playerId"] }),
  ]);

  return {
    totalGoals,
    totalMatchesPlayed,
    totalTeams,
    totalPlayers: Array.isArray(totalPlayers) ? totalPlayers.length : 0,
  };
}

export async function getDivisionTotals(divisionId: string): Promise<LeagueTotals> {
  const [totalGoals, totalMatchesPlayed, teamIds] = await Promise.all([
    prisma.matchEvent.count({
      where: { type: MatchEventType.GOAL, match: { tournament: { divisionId } } },
    }),
    prisma.match.count({ where: { status: MatchStatus.PLAYED, tournament: { divisionId } } }),
    prisma.teamTournament.findMany({
      where: { tournament: { divisionId } },
      select: { teamId: true },
      distinct: ["teamId"],
    }),
  ]);

  const uniqueTeamIds = teamIds.map((t) => t.teamId);
  const totalPlayers =
    uniqueTeamIds.length === 0
      ? 0
      : (
          await prisma.rosterSpot.findMany({
            where: { teamId: { in: uniqueTeamIds } },
            select: { playerId: true },
            distinct: ["playerId"],
          })
        ).length;

  return { totalGoals, totalMatchesPlayed, totalTeams: uniqueTeamIds.length, totalPlayers };
}

export type TournamentTotals = LeagueTotals & {
  totalMatchesScheduled: number;
  totalYellowCards: number;
  totalRedCards: number;
  avgGoalsPerMatch: number;
};

export async function getTournamentTotals(tournamentId: string, groupId?: string): Promise<TournamentTotals> {
  const matchScope = { tournamentId, ...(groupId ? { groupId } : {}) };

  const [totalGoals, totalYellowCards, totalRedCards, totalMatchesPlayed, totalMatchesScheduled, entries] =
    await Promise.all([
      prisma.matchEvent.count({ where: { type: MatchEventType.GOAL, match: matchScope } }),
      prisma.matchEvent.count({ where: { type: MatchEventType.YELLOW_CARD, match: matchScope } }),
      prisma.matchEvent.count({ where: { type: MatchEventType.RED_CARD, match: matchScope } }),
      prisma.match.count({ where: { ...matchScope, status: MatchStatus.PLAYED } }),
      prisma.match.count({ where: { ...matchScope, status: MatchStatus.SCHEDULED } }),
      prisma.teamTournament.findMany({
        where: { tournamentId, ...(groupId ? { groupId } : {}) },
        select: { teamId: true },
      }),
    ]);

  const teamIds = entries.map((e) => e.teamId);
  const totalPlayers =
    teamIds.length === 0
      ? 0
      : (
          await prisma.rosterSpot.findMany({
            where: { teamId: { in: teamIds } },
            select: { playerId: true },
            distinct: ["playerId"],
          })
        ).length;

  return {
    totalGoals,
    totalMatchesPlayed,
    totalMatchesScheduled,
    totalTeams: teamIds.length,
    totalPlayers,
    totalYellowCards,
    totalRedCards,
    avgGoalsPerMatch: totalMatchesPlayed === 0 ? 0 : Math.round((totalGoals / totalMatchesPlayed) * 100) / 100,
  };
}

export async function getTeamCareer(teamId: string) {
  const matches = await prisma.match.findMany({
    where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }], status: MatchStatus.PLAYED },
  });

  let played = 0,
    won = 0,
    drawn = 0,
    lost = 0,
    goalsFor = 0,
    goalsAgainst = 0;

  for (const m of matches) {
    if (m.homeScore == null || m.awayScore == null) continue;
    const isHome = m.homeTeamId === teamId;
    const gf = isHome ? m.homeScore : m.awayScore;
    const ga = isHome ? m.awayScore : m.homeScore;
    played += 1;
    goalsFor += gf;
    goalsAgainst += ga;
    if (gf > ga) won += 1;
    else if (gf < ga) lost += 1;
    else drawn += 1;
  }

  return { played, won, drawn, lost, goalsFor, goalsAgainst, goalDiff: goalsFor - goalsAgainst };
}

export async function getPlayerGlobalProfile(playerId: string) {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return null;

  const [rosterSpots, events, appearances] = await Promise.all([
    prisma.rosterSpot.findMany({
      where: { playerId },
      include: { team: { include: { league: true } } },
    }),
    prisma.matchEvent.findMany({
      where: { playerId },
      include: {
        team: { include: { league: true } },
        match: { include: { tournament: { include: { division: { include: { league: true } } } } } },
      },
    }),
    prisma.matchAppearance.findMany({ where: { playerId }, select: { matchId: true, isGoalkeeper: true } }),
  ]);

  const goals = events.filter((e) => e.type === MatchEventType.GOAL);
  const yellows = events.filter((e) => e.type === MatchEventType.YELLOW_CARD);
  const reds = events.filter((e) => e.type === MatchEventType.RED_CARD);

  type Entry = {
    teamId: string;
    teamName: string;
    leagueName: string;
    leagueSlug: string;
    divisionName?: string;
    goals: number;
    matches: Set<string>;
  };
  const breakdown = new Map<string, Entry>();

  // Seed with current roster memberships, even if the player hasn't scored there yet.
  for (const rs of rosterSpots) {
    breakdown.set(rs.teamId, {
      teamId: rs.teamId,
      teamName: rs.team.name,
      leagueName: rs.team.league.name,
      leagueSlug: rs.team.league.slug,
      goals: 0,
      matches: new Set(),
    });
  }

  for (const g of goals) {
    let entry = breakdown.get(g.teamId);
    if (!entry) {
      entry = {
        teamId: g.teamId,
        teamName: g.team.name,
        leagueName: g.team.league.name,
        leagueSlug: g.team.league.slug,
        goals: 0,
        matches: new Set(),
      };
      breakdown.set(g.teamId, entry);
    }
    entry.divisionName = g.match.tournament.division.name;
    entry.goals += 1;
    entry.matches.add(g.matchId);
  }

  const matchesInvolved = new Set(events.map((e) => e.matchId));
  const leagueIds = new Set(rosterSpots.map((rs) => rs.team.leagueId));
  const matchesPlayed = new Set(appearances.map((a) => a.matchId)).size;
  const matchesAsGoalkeeper = appearances.filter((a) => a.isGoalkeeper).length;

  return {
    id: player.id,
    fullName: player.fullName,
    photoUrl: player.photoUrl,
    totalGoals: goals.length,
    totalYellowCards: yellows.length,
    totalRedCards: reds.length,
    matchesWithInvolvement: matchesInvolved.size,
    matchesPlayed,
    matchesAsGoalkeeper,
    leagueBreakdown: Array.from(breakdown.values()).map((v) => ({
      leagueName: v.leagueName,
      leagueSlug: v.leagueSlug,
      teamName: v.teamName,
      divisionName: v.divisionName,
      goals: v.goals,
    })),
    leaguesCount: leagueIds.size,
  };
}
