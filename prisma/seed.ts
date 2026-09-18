import { PrismaClient, MatchEventType, MatchStatus, TournamentFormat } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number, hour = 16) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.freeAgentListing.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.matchAppearance.deleteMany();
  await prisma.match.deleteMany();
  await prisma.teamTournament.deleteMany();
  await prisma.group.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.division.deleteMany();
  await prisma.rosterSpot.deleteMany();
  await prisma.team.deleteMany();
  await prisma.player.deleteMany();
  await prisma.league.deleteMany();

  // ---------------- Liga del Rey Guadalupe ----------------
  const guadalupe = await prisma.league.create({
    data: {
      slug: "guadalupe",
      name: "Liga del Rey Guadalupe",
      city: "Guadalupe, N.L.",
      primaryColor: "#16a34a",
      accentColor: "#0f172a",
    },
  });

  const divGua1 = await prisma.division.create({ data: { name: "Primera División", leagueId: guadalupe.id } });
  const divGua2 = await prisma.division.create({ data: { name: "Segunda División", leagueId: guadalupe.id } });

  const trnGua1 = await prisma.tournament.create({
    data: { name: "Apertura 2026", divisionId: divGua1.id, format: TournamentFormat.LIGA, maxTeams: 8, startDate: daysFromNow(-30) },
  });
  const trnGua2 = await prisma.tournament.create({
    data: { name: "Apertura 2026", divisionId: divGua2.id, format: TournamentFormat.LIGA, maxTeams: 8, startDate: daysFromNow(-20) },
  });

  const teamsPrimera = await Promise.all(
    [
      ["Halcones FC", "HAL"],
      ["Real Cemento", "RCE"],
      ["Atlético Norte", "ATN"],
      ["Deportivo Fénix", "FEN"],
    ].map(([name, shortName]) => prisma.team.create({ data: { name, shortName, leagueId: guadalupe.id } })),
  );
  const [hal, rce, atn, fen] = teamsPrimera;

  const teamsSegunda = await Promise.all(
    [
      ["Juventud Sur", "JSU"],
      ["Unión Central", "UCE"],
      ["Estrella Azul", "EAZ"],
    ].map(([name, shortName]) => prisma.team.create({ data: { name, shortName, leagueId: guadalupe.id } })),
  );
  const [jsu, uce, eaz] = teamsSegunda;

  for (const t of teamsPrimera) await prisma.teamTournament.create({ data: { teamId: t.id, tournamentId: trnGua1.id } });
  for (const t of teamsSegunda) await prisma.teamTournament.create({ data: { teamId: t.id, tournamentId: trnGua2.id } });

  const diego = await prisma.player.create({ data: { fullName: 'Diego "Motor" Herrera' } });
  const players: Record<string, { id: string }> = { diego };

  async function addPlayer(key: string, fullName: string, teamId: string, number: number, position: string) {
    const existing = players[key] ?? (await prisma.player.create({ data: { fullName } }));
    players[key] = existing;
    await prisma.rosterSpot.create({ data: { playerId: existing.id, teamId, number, position } });
    return existing;
  }

  await prisma.rosterSpot.create({ data: { playerId: diego.id, teamId: hal.id, number: 9, position: "Delantero" } });
  const marco = await addPlayer("marco", "Marco Villanueva", hal.id, 1, "Portero");
  const ivan = await addPlayer("ivan", "Iván Salazar", hal.id, 5, "Defensa");
  const pedro = await addPlayer("pedro", "Pedro Luna", hal.id, 7, "Mediocampo");
  const oscar = await addPlayer("oscar", "Oscar Reyes", hal.id, 4, "Defensa");

  const braulio = await addPlayer("braulio", "Braulio Nava", rce.id, 11, "Delantero");
  await addPlayer("tono", "Toño Campos", rce.id, 1, "Portero");
  const chuy = await addPlayer("chuy", "Chuy Robles", rce.id, 8, "Mediocampo");

  const emilio = await addPlayer("emilio", "Emilio Torres", atn.id, 6, "Mediocampo");
  const beto = await addPlayer("beto", "Beto Cantú", atn.id, 10, "Mediocampo");
  await addPlayer("gil", "Gil Ortega", atn.id, 1, "Portero");
  const uriel = await addPlayer("uriel", "Uriel Ramos", atn.id, 9, "Delantero");

  const kevin = await addPlayer("kevin", "Kevin Solís", fen.id, 7, "Mediocampo");
  await addPlayer("adan", "Adán Vega", fen.id, 1, "Portero");
  const luis = await addPlayer("luis", "Luis Bravo", fen.id, 9, "Delantero");

  const santi = await addPlayer("santi", "Santi Elizondo", jsu.id, 10, "Mediocampo");
  const dario = await addPlayer("dario", "Darío Quintanilla", jsu.id, 9, "Delantero");
  const nayo = await addPlayer("nayo", "Nayo Escamilla", uce.id, 7, "Mediocampo");
  const ceci = await addPlayer("ceci", "Cecilio Aranda", uce.id, 9, "Delantero");
  const ramiro = await addPlayer("ramiro", "Ramiro Peláez", eaz.id, 5, "Defensa");
  const facundo2 = await addPlayer("facundo2", "Facundo Vidal", eaz.id, 9, "Delantero");

  async function playMatch(
    tournamentId: string,
    home: { id: string },
    away: { id: string },
    hs: number,
    as_: number,
    daysAgo: number,
    homeGoals: { id: string }[] = [],
    awayGoals: { id: string }[] = [],
    opts: { groupId?: string; stage?: string; round?: number; cards?: { player: { id: string }; team: { id: string }; type: MatchEventType }[] } = {},
  ) {
    const match = await prisma.match.create({
      data: {
        tournamentId,
        groupId: opts.groupId,
        stage: opts.stage,
        round: opts.round,
        matchDate: daysFromNow(-daysAgo),
        status: MatchStatus.PLAYED,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: hs,
        awayScore: as_,
        venue: "Cancha Central",
      },
    });
    for (const p of homeGoals) await prisma.matchEvent.create({ data: { matchId: match.id, playerId: p.id, teamId: home.id, type: MatchEventType.GOAL } });
    for (const p of awayGoals) await prisma.matchEvent.create({ data: { matchId: match.id, playerId: p.id, teamId: away.id, type: MatchEventType.GOAL } });
    for (const c of opts.cards ?? [])
      await prisma.matchEvent.create({ data: { matchId: match.id, playerId: c.player.id, teamId: c.team.id, type: c.type } });

    // The seed doesn't know a real per-match lineup, so assume each team's
    // full registered roster played, with the roster's "Portero" as keeper —
    // this backfills MatchAppearance so imbatibles/partidos-jugados work on
    // demo data too, same as the manual Neon backfill for already-seeded rows.
    const roster = await prisma.rosterSpot.findMany({ where: { teamId: { in: [home.id, away.id] } } });
    for (const rs of roster) {
      await prisma.matchAppearance.create({
        data: {
          matchId: match.id,
          playerId: rs.playerId,
          teamId: rs.teamId,
          isGoalkeeper: rs.position?.toLowerCase() === "portero",
        },
      });
    }

    return match;
  }

  await playMatch(trnGua1.id, hal, rce, 3, 1, 21, [diego, diego, pedro], [braulio], {
    round: 1,
    cards: [{ player: braulio, team: rce, type: MatchEventType.YELLOW_CARD }],
  });
  await playMatch(trnGua1.id, atn, fen, 2, 2, 21, [uriel, beto], [luis, luis], {
    round: 1,
    cards: [
      { player: uriel, team: atn, type: MatchEventType.YELLOW_CARD },
      { player: luis, team: fen, type: MatchEventType.YELLOW_CARD },
    ],
  });
  await playMatch(trnGua1.id, hal, atn, 4, 0, 14, [diego, diego, ivan, pedro], [], { round: 2 });
  await playMatch(trnGua1.id, rce, fen, 1, 1, 14, [chuy], [luis], {
    round: 2,
    cards: [{ player: luis, team: fen, type: MatchEventType.YELLOW_CARD }],
  });
  await playMatch(trnGua1.id, fen, hal, 1, 2, 7, [kevin], [diego, oscar], { round: 3 });
  // Emilio scores for Real Cemento here, then later for Atlético Norte — shows cross-team movement.
  await playMatch(trnGua1.id, atn, rce, 3, 2, 7, [uriel, uriel, beto], [braulio, emilio], {
    round: 3,
    cards: [{ player: emilio, team: rce, type: MatchEventType.RED_CARD }],
  });
  // Luis reaches 3 yellow cards here — shows the "Suspendido" flag in Sanciones.
  await playMatch(trnGua1.id, atn, fen, 2, 1, 2, [emilio, uriel], [luis], {
    round: 4,
    cards: [{ player: luis, team: fen, type: MatchEventType.YELLOW_CARD }],
  });
  await prisma.match.create({ data: { tournamentId: trnGua1.id, round: 5, matchDate: daysFromNow(3), homeTeamId: hal.id, awayTeamId: fen.id, venue: "Cancha Central" } });
  await prisma.match.create({ data: { tournamentId: trnGua1.id, round: 5, matchDate: daysFromNow(3), homeTeamId: rce.id, awayTeamId: atn.id, venue: "Cancha Norte" } });

  await playMatch(trnGua2.id, jsu, uce, 2, 1, 10, [dario, santi], [ceci], { round: 1 });
  await playMatch(trnGua2.id, eaz, jsu, 0, 3, 10, [], [dario, dario, santi], { round: 1 });
  await playMatch(trnGua2.id, uce, eaz, 2, 2, 3, [ceci, nayo], [facundo2, facundo2], { round: 2 });
  await prisma.match.create({ data: { tournamentId: trnGua2.id, round: 3, matchDate: daysFromNow(4), homeTeamId: jsu.id, awayTeamId: eaz.id } });

  // ---------------- Liga Centenario (with a GRUPOS tournament) ----------------
  const centenario = await prisma.league.create({
    data: { slug: "centenario", name: "Liga Centenario", city: "Montevideo", primaryColor: "#2563eb", accentColor: "#f97316" },
  });
  const divCen1 = await prisma.division.create({ data: { name: "Primera División", leagueId: centenario.id } });
  const trnCen1 = await prisma.tournament.create({
    data: { name: "Clausura 2026", divisionId: divCen1.id, format: TournamentFormat.GRUPOS, maxTeams: 8, startDate: daysFromNow(-15) },
  });
  const grpA = await prisma.group.create({ data: { name: "Grupo A", tournamentId: trnCen1.id } });
  const grpB = await prisma.group.create({ data: { name: "Grupo B", tournamentId: trnCen1.id, isFinished: true } });

  const and = await prisma.team.create({ data: { name: "Los Andes 7", shortName: "AND", leagueId: centenario.id } });
  const cor = await prisma.team.create({ data: { name: "Cordón United", shortName: "COR", leagueId: centenario.id } });
  const pro = await prisma.team.create({ data: { name: "Parque Rodó FC", shortName: "PRO", leagueId: centenario.id } });
  const mal = await prisma.team.create({ data: { name: "Malvín SC", shortName: "MAL", leagueId: centenario.id } });

  await prisma.teamTournament.create({ data: { teamId: and.id, tournamentId: trnCen1.id, groupId: grpA.id } });
  await prisma.teamTournament.create({ data: { teamId: cor.id, tournamentId: trnCen1.id, groupId: grpA.id } });
  await prisma.teamTournament.create({ data: { teamId: pro.id, tournamentId: trnCen1.id, groupId: grpB.id } });
  await prisma.teamTournament.create({ data: { teamId: mal.id, tournamentId: trnCen1.id, groupId: grpB.id } });

  // Diego "Motor" Herrera also plays here — this is what shows off the
  // cross-league global career profile.
  await prisma.rosterSpot.create({ data: { playerId: diego.id, teamId: and.id, number: 9, position: "Delantero" } });
  const nico = await addPlayer("nico", "Nico Ferreira", and.id, 1, "Portero");
  const martin = await addPlayer("martin", "Martín Soto", and.id, 10, "Mediocampo");
  await addPlayer("pablo", "Pablo Quintana", and.id, 6, "Defensa");
  const bruno = await addPlayer("bruno", "Bruno Acosta", cor.id, 9, "Delantero");
  await addPlayer("facu", "Facu Lima", cor.id, 7, "Mediocampo");
  await addPlayer("gonza", "Gonza Pintos", cor.id, 1, "Portero");
  const seba = await addPlayer("seba", "Seba Dutra", pro.id, 11, "Delantero");
  const iker = await addPlayer("iker", "Iker Suárez", pro.id, 5, "Defensa");
  await addPlayer("lucas", "Lucas Bianchi", pro.id, 1, "Portero");
  await prisma.rosterSpot.create({ data: { playerId: ramiro.id, teamId: mal.id, number: 4, position: "Defensa" } });

  await playMatch(trnCen1.id, and, cor, 2, 1, 12, [diego, martin], [bruno], { groupId: grpA.id, stage: "Fase de grupos" });
  await playMatch(trnCen1.id, pro, mal, 3, 0, 12, [seba, seba, iker], [], { groupId: grpB.id, stage: "Fase de grupos" });
  await playMatch(trnCen1.id, cor, and, 1, 3, 5, [bruno], [diego, diego, martin], { groupId: grpA.id, stage: "Fase de grupos" });
  await playMatch(trnCen1.id, mal, pro, 1, 1, 5, [ramiro], [seba], { groupId: grpB.id, stage: "Fase de grupos" });
  await prisma.match.create({
    data: { tournamentId: trnCen1.id, groupId: grpA.id, stage: "Semifinal", matchDate: daysFromNow(6), homeTeamId: and.id, awayTeamId: cor.id },
  });

  await prisma.sponsor.createMany({
    data: [
      { leagueId: guadalupe.id, name: "Casmu", logoUrl: "https://placehold.co/240x80/16a34a/ffffff/png?text=CASMU" },
      { leagueId: guadalupe.id, name: "Kelme", logoUrl: "https://placehold.co/240x80/0f172a/ffffff/png?text=KELME" },
      { leagueId: centenario.id, name: "Naker", logoUrl: "https://placehold.co/240x80/2563eb/ffffff/png?text=NAKER" },
      { leagueId: centenario.id, name: "Matesuru", logoUrl: "https://placehold.co/240x80/f97316/ffffff/png?text=MATESURU" },
    ],
  });

  await prisma.photo.createMany({
    data: [
      { leagueId: guadalupe.id, url: "https://placehold.co/600x600/16a34a/ffffff/png?text=Fecha+3", caption: "Fecha 3 - Halcones FC" },
      { leagueId: guadalupe.id, url: "https://placehold.co/600x600/0f172a/ffffff/png?text=Gol", caption: "Festejo de gol" },
      { leagueId: centenario.id, url: "https://placehold.co/600x600/2563eb/ffffff/png?text=Clausura", caption: "Clausura 2026" },
    ],
  });

  await prisma.newsPost.createMany({
    data: [
      {
        leagueId: guadalupe.id,
        title: "Arranca la fecha 5 del Apertura",
        body: "Este fin de semana se juega la fecha 5 con Halcones FC como líder invicto. No te la pierdas.",
      },
      {
        leagueId: guadalupe.id,
        title: "Nueva Segunda División",
        body: "Sumamos una Segunda División con tres equipos nuevos: Juventud Sur, Unión Central y Estrella Azul.",
      },
      {
        leagueId: centenario.id,
        title: "Definiciones en la fase de grupos",
        body: "El Grupo B ya cerró su fase de grupos. Los Andes 7 y Cordón United se juegan el pase en semifinal.",
      },
    ],
  });

  await prisma.freeAgentListing.createMany({
    data: [
      {
        leagueId: guadalupe.id,
        type: "JUGADOR_LIBRE",
        fullName: "Rodrigo Elizondo",
        position: "Delantero",
        contact: "rodrigo.elizondo@example.com",
        message: "Disponible fines de semana.",
      },
      {
        leagueId: guadalupe.id,
        type: "BUSCO_EQUIPO",
        fullName: "Atlético Vintage",
        position: "Defensa",
        contact: "5215512345678",
        message: "Buscamos 2 defensas para el Apertura.",
      },
      {
        leagueId: centenario.id,
        type: "JUGADOR_LIBRE",
        fullName: "Bruno Machado",
        position: "Portero",
        contact: "099123456",
      },
    ],
  });

  console.log("Seed complete:");
  console.log(`  ${guadalupe.name} (/${guadalupe.slug}) — 2 divisiones`);
  console.log(`  ${centenario.name} (/${centenario.slug}) — 1 división con fase de grupos`);
  console.log(`  Jugador global compartido: Diego "Motor" Herrera -> /jugador/${diego.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
