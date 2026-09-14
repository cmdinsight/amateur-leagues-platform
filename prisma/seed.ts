import { PrismaClient, MatchEventType, MatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

type PlayerSeed = { name: string; number: number; position: string };

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function buildLeague(opts: {
  slug: string;
  name: string;
  city: string;
  sport: string;
  primaryColor: string;
  accentColor: string;
  seasonName: string;
  teams: { name: string; short: string; players: PlayerSeed[] }[];
  // players (by full name) that should also appear on another league's roster,
  // to demonstrate the global player history feature.
  sharedPlayers?: Record<string, string>; // fullName -> existing Player id
}) {
  const league = await prisma.league.create({
    data: {
      slug: opts.slug,
      name: opts.name,
      city: opts.city,
      sport: opts.sport,
      primaryColor: opts.primaryColor,
      accentColor: opts.accentColor,
      adminPassword: "demo1234",
    },
  });

  const season = await prisma.season.create({
    data: {
      name: opts.seasonName,
      startDate: daysFromNow(-30),
      isActive: true,
      leagueId: league.id,
    },
  });

  const teamRecords: { id: string; name: string }[] = [];
  const rosterByTeam: Record<string, { playerId: string; name: string }[]> = {};

  for (const t of opts.teams) {
    const team = await prisma.team.create({
      data: { name: t.name, shortName: t.short, leagueId: league.id },
    });
    await prisma.teamSeason.create({ data: { teamId: team.id, seasonId: season.id } });
    teamRecords.push({ id: team.id, name: t.name });
    rosterByTeam[team.id] = [];

    for (const p of t.players) {
      let playerId = opts.sharedPlayers?.[p.name];
      if (!playerId) {
        const player = await prisma.player.create({ data: { fullName: p.name } });
        playerId = player.id;
      }
      await prisma.rosterSpot.create({
        data: { playerId, teamId: team.id, number: p.number, position: p.position },
      });
      rosterByTeam[team.id].push({ playerId, name: p.name });
    }
  }

  return { league, season, teamRecords, rosterByTeam };
}

async function playMatch(
  seasonId: string,
  home: { id: string; name: string },
  away: { id: string; name: string },
  homeScore: number,
  awayScore: number,
  scorers: { home: { playerId: string; minute: number }[]; away: { playerId: string; minute: number }[] },
  daysAgo: number,
) {
  const match = await prisma.match.create({
    data: {
      seasonId,
      matchDate: daysFromNow(-daysAgo),
      status: MatchStatus.PLAYED,
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeScore,
      awayScore,
      venue: "Cancha Central",
    },
  });

  for (const g of scorers.home) {
    await prisma.matchEvent.create({
      data: { matchId: match.id, playerId: g.playerId, teamId: home.id, type: MatchEventType.GOAL, minute: g.minute },
    });
  }
  for (const g of scorers.away) {
    await prisma.matchEvent.create({
      data: { matchId: match.id, playerId: g.playerId, teamId: away.id, type: MatchEventType.GOAL, minute: g.minute },
    });
  }
  return match;
}

async function main() {
  await prisma.matchEvent.deleteMany();
  await prisma.match.deleteMany();
  await prisma.rosterSpot.deleteMany();
  await prisma.teamSeason.deleteMany();
  await prisma.team.deleteMany();
  await prisma.season.deleteMany();
  await prisma.player.deleteMany();
  await prisma.league.deleteMany();

  // A star player who plays in TWO different leagues at once —
  // this is what shows off the cross-league global career profile.
  const estrella = await prisma.player.create({ data: { fullName: "Diego \"Motor\" Herrera" } });

  const guadalupe = await buildLeague({
    slug: "guadalupe",
    name: "Liga del Rey Guadalupe",
    city: "Guadalupe, N.L.",
    sport: "futbol7",
    primaryColor: "#16a34a",
    accentColor: "#0f172a",
    seasonName: "Apertura 2026",
    sharedPlayers: { 'Diego "Motor" Herrera': estrella.id },
    teams: [
      {
        name: "Halcones FC",
        short: "HAL",
        players: [
          { name: 'Diego "Motor" Herrera', number: 9, position: "Delantero" },
          { name: "Marco Villanueva", number: 1, position: "Portero" },
          { name: "Iván Salazar", number: 5, position: "Defensa" },
          { name: "Pedro Luna", number: 7, position: "Mediocampo" },
          { name: "Oscar Reyes", number: 4, position: "Defensa" },
        ],
      },
      {
        name: "Real Cemento",
        short: "RCE",
        players: [
          { name: "Braulio Nava", number: 11, position: "Delantero" },
          { name: "Toño Campos", number: 1, position: "Portero" },
          { name: "Chuy Robles", number: 8, position: "Mediocampo" },
          { name: "Fer Quintero", number: 3, position: "Defensa" },
          { name: "Ricardo Peña", number: 6, position: "Mediocampo" },
        ],
      },
      {
        name: "Atlético Norte",
        short: "ATN",
        players: [
          { name: "Beto Cantú", number: 10, position: "Mediocampo" },
          { name: "Gil Ortega", number: 1, position: "Portero" },
          { name: "Sami Cavazos", number: 2, position: "Defensa" },
          { name: "Uriel Ramos", number: 9, position: "Delantero" },
          { name: "Nacho Farías", number: 5, position: "Defensa" },
        ],
      },
      {
        name: "Deportivo Fénix",
        short: "FEN",
        players: [
          { name: "Kevin Solís", number: 7, position: "Mediocampo" },
          { name: "Adán Vega", number: 1, position: "Portero" },
          { name: "Memo Alanís", number: 4, position: "Defensa" },
          { name: "Luis Bravo", number: 9, position: "Delantero" },
          { name: "Caleb Rangel", number: 8, position: "Mediocampo" },
        ],
      },
    ],
  });

  const [hal, rce, atn, fen] = guadalupe.teamRecords;
  const rosterOf = (teamId: string) => guadalupe.rosterByTeam[teamId];
  const findPlayer = (teamId: string, name: string) =>
    rosterOf(teamId).find((p) => p.name === name)!.playerId;

  await playMatch(guadalupe.season.id, hal, rce, 3, 1, {
    home: [
      { playerId: findPlayer(hal.id, 'Diego "Motor" Herrera'), minute: 12 },
      { playerId: findPlayer(hal.id, 'Diego "Motor" Herrera'), minute: 44 },
      { playerId: findPlayer(hal.id, "Pedro Luna"), minute: 67 },
    ],
    away: [{ playerId: findPlayer(rce.id, "Braulio Nava"), minute: 55 }],
  }, 21);

  await playMatch(guadalupe.season.id, atn, fen, 2, 2, {
    home: [
      { playerId: findPlayer(atn.id, "Uriel Ramos"), minute: 20 },
      { playerId: findPlayer(atn.id, "Beto Cantú"), minute: 39 },
    ],
    away: [
      { playerId: findPlayer(fen.id, "Luis Bravo"), minute: 30 },
      { playerId: findPlayer(fen.id, "Luis Bravo"), minute: 78 },
    ],
  }, 21);

  await playMatch(guadalupe.season.id, hal, atn, 4, 0, {
    home: [
      { playerId: findPlayer(hal.id, 'Diego "Motor" Herrera'), minute: 8 },
      { playerId: findPlayer(hal.id, 'Diego "Motor" Herrera'), minute: 15 },
      { playerId: findPlayer(hal.id, "Iván Salazar"), minute: 50 },
      { playerId: findPlayer(hal.id, "Pedro Luna"), minute: 61 },
    ],
    away: [],
  }, 14);

  await playMatch(guadalupe.season.id, rce, fen, 1, 1, {
    home: [{ playerId: findPlayer(rce.id, "Chuy Robles"), minute: 33 }],
    away: [{ playerId: findPlayer(fen.id, "Luis Bravo"), minute: 70 }],
  }, 14);

  await playMatch(guadalupe.season.id, fen, hal, 1, 2, {
    home: [{ playerId: findPlayer(fen.id, "Kevin Solís"), minute: 40 }],
    away: [
      { playerId: findPlayer(hal.id, 'Diego "Motor" Herrera'), minute: 25 },
      { playerId: findPlayer(hal.id, "Oscar Reyes"), minute: 58 },
    ],
  }, 7);

  await playMatch(guadalupe.season.id, atn, rce, 3, 2, {
    home: [
      { playerId: findPlayer(atn.id, "Uriel Ramos"), minute: 10 },
      { playerId: findPlayer(atn.id, "Uriel Ramos"), minute: 42 },
      { playerId: findPlayer(atn.id, "Beto Cantú"), minute: 66 },
    ],
    away: [
      { playerId: findPlayer(rce.id, "Braulio Nava"), minute: 20 },
      { playerId: findPlayer(rce.id, "Ricardo Peña"), minute: 80 },
    ],
  }, 7);

  // Upcoming scheduled matches
  await prisma.match.create({
    data: { seasonId: guadalupe.season.id, matchDate: daysFromNow(3), status: MatchStatus.SCHEDULED, homeTeamId: hal.id, awayTeamId: fen.id, venue: "Cancha Central" },
  });
  await prisma.match.create({
    data: { seasonId: guadalupe.season.id, matchDate: daysFromNow(3), status: MatchStatus.SCHEDULED, homeTeamId: rce.id, awayTeamId: atn.id, venue: "Cancha Norte" },
  });

  // ---- Second league, different brand colors, sharing the star player ----
  const centenario = await buildLeague({
    slug: "centenario",
    name: "Liga Centenario",
    city: "Montevideo",
    sport: "futbol7",
    primaryColor: "#2563eb",
    accentColor: "#f97316",
    seasonName: "Clausura 2026",
    sharedPlayers: { 'Diego "Motor" Herrera': estrella.id },
    teams: [
      {
        name: "Los Andes 7",
        short: "AND",
        players: [
          { name: 'Diego "Motor" Herrera', number: 9, position: "Delantero" },
          { name: "Nico Ferreira", number: 1, position: "Portero" },
          { name: "Pablo Quintana", number: 6, position: "Defensa" },
          { name: "Martín Soto", number: 10, position: "Mediocampo" },
        ],
      },
      {
        name: "Cordón United",
        short: "COR",
        players: [
          { name: "Facu Lima", number: 7, position: "Mediocampo" },
          { name: "Gonza Pintos", number: 1, position: "Portero" },
          { name: "Bruno Acosta", number: 9, position: "Delantero" },
          { name: "Rodri Fossati", number: 3, position: "Defensa" },
        ],
      },
      {
        name: "Parque Rodó FC",
        short: "PRO",
        players: [
          { name: "Seba Dutra", number: 11, position: "Delantero" },
          { name: "Lucas Bianchi", number: 1, position: "Portero" },
          { name: "Iker Suárez", number: 5, position: "Defensa" },
          { name: "Tomi Correa", number: 8, position: "Mediocampo" },
        ],
      },
    ],
  });

  const [and, cor, pro] = centenario.teamRecords;
  const rosterOfC = (teamId: string) => centenario.rosterByTeam[teamId];
  const findPlayerC = (teamId: string, name: string) =>
    rosterOfC(teamId).find((p) => p.name === name)!.playerId;

  await playMatch(centenario.season.id, and, cor, 2, 1, {
    home: [
      { playerId: findPlayerC(and.id, 'Diego "Motor" Herrera'), minute: 18 },
      { playerId: findPlayerC(and.id, "Martín Soto"), minute: 60 },
    ],
    away: [{ playerId: findPlayerC(cor.id, "Bruno Acosta"), minute: 35 }],
  }, 10);

  await playMatch(centenario.season.id, pro, and, 1, 3, {
    home: [{ playerId: findPlayerC(pro.id, "Seba Dutra"), minute: 22 }],
    away: [
      { playerId: findPlayerC(and.id, 'Diego "Motor" Herrera'), minute: 5 },
      { playerId: findPlayerC(and.id, 'Diego "Motor" Herrera'), minute: 47 },
      { playerId: findPlayerC(and.id, "Martín Soto"), minute: 71 },
    ],
  }, 5);

  await prisma.match.create({
    data: { seasonId: centenario.season.id, matchDate: daysFromNow(4), status: MatchStatus.SCHEDULED, homeTeamId: cor.id, awayTeamId: pro.id, venue: "Parque de los Aliados" },
  });

  console.log("Seed complete:");
  console.log(`  League 1: ${guadalupe.league.name} (/${guadalupe.league.slug})`);
  console.log(`  League 2: ${centenario.league.name} (/${centenario.league.slug})`);
  console.log(`  Shared global player: Diego "Motor" Herrera -> /jugador/${estrella.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
