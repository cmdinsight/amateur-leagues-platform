"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MatchEventType, MatchStatus, TournamentFormat } from "@prisma/client";

function adminCookieName(slug: string) {
  return `admin_${slug}`;
}

export async function loginAction(slug: string, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const league = await prisma.league.findUnique({ where: { slug } });
  if (!league || league.adminPassword !== password) {
    redirect(`/admin/${slug}?error=1`);
  }
  const store = await cookies();
  store.set(adminCookieName(slug), "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  redirect(`/admin/${slug}`);
}

export async function logoutAction(slug: string) {
  const store = await cookies();
  store.delete(adminCookieName(slug));
  redirect(`/admin/${slug}`);
}

export async function isAdminAuthed(slug: string) {
  const store = await cookies();
  return store.get(adminCookieName(slug))?.value === "1";
}

async function requireAuth(slug: string) {
  const authed = await isAdminAuthed(slug);
  if (!authed) redirect(`/admin/${slug}`);
}

export async function updateBrandingAction(slug: string, formData: FormData) {
  await requireAuth(slug);

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "#16a34a");
  const accentColor = String(formData.get("accentColor") ?? "#0f172a");

  await prisma.league.update({
    where: { slug },
    data: { name: name || undefined, city: city || null, logoUrl: logoUrl || null, primaryColor, accentColor },
  });

  revalidatePath(`/${slug}`, "layout");
  revalidatePath(`/admin/${slug}`);
}

export async function createDivisionAction(slug: string, leagueId: string, formData: FormData) {
  await requireAuth(slug);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.division.create({ data: { name, leagueId } });
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/series`);
}

export async function createTournamentAction(slug: string, divisionId: string, formData: FormData) {
  await requireAuth(slug);
  const name = String(formData.get("name") ?? "").trim();
  const format = String(formData.get("format") ?? "LIGA") as TournamentFormat;
  const maxTeamsRaw = String(formData.get("maxTeams") ?? "").trim();
  if (!name) return;

  await prisma.tournament.create({
    data: {
      name,
      divisionId,
      format,
      maxTeams: maxTeamsRaw ? Number(maxTeamsRaw) : null,
    },
  });

  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/series/${divisionId}`);
}

export async function createGroupAction(slug: string, tournamentId: string, formData: FormData) {
  await requireAuth(slug);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.group.create({ data: { name, tournamentId } });
  revalidatePath(`/admin/${slug}/torneos/${tournamentId}`);
}

export async function setTeamEntryAction(slug: string, tournamentId: string, teamId: string, formData: FormData) {
  await requireAuth(slug);
  const enrolled = formData.get("enrolled") === "on";
  const groupId = String(formData.get("groupId") ?? "").trim() || null;

  if (!enrolled) {
    await prisma.teamTournament.deleteMany({ where: { tournamentId, teamId } });
  } else {
    await prisma.teamTournament.upsert({
      where: { teamId_tournamentId: { teamId, tournamentId } },
      update: { groupId },
      create: { teamId, tournamentId, groupId },
    });
  }

  revalidatePath(`/admin/${slug}/torneos/${tournamentId}`);
  revalidatePath(`/${slug}`);
}

export async function scheduleMatchAction(slug: string, tournamentId: string, formData: FormData) {
  await requireAuth(slug);
  const homeTeamId = String(formData.get("homeTeamId") ?? "");
  const awayTeamId = String(formData.get("awayTeamId") ?? "");
  const dateStr = String(formData.get("matchDate") ?? "");
  const venue = String(formData.get("venue") ?? "").trim() || null;
  const stage = String(formData.get("stage") ?? "").trim() || null;
  const groupId = String(formData.get("groupId") ?? "").trim() || null;
  const roundRaw = String(formData.get("round") ?? "").trim();

  if (!homeTeamId || !awayTeamId || !dateStr || homeTeamId === awayTeamId) return;

  await prisma.match.create({
    data: {
      tournamentId,
      groupId,
      stage,
      round: roundRaw ? Number(roundRaw) : null,
      matchDate: new Date(dateStr),
      venue,
      homeTeamId,
      awayTeamId,
      status: MatchStatus.SCHEDULED,
    },
  });

  revalidatePath(`/admin/${slug}/torneos/${tournamentId}`);
  revalidatePath(`/${slug}/torneos/${tournamentId}`);
}

export async function toggleGroupFinishedAction(slug: string, tournamentId: string, groupId: string, formData: FormData) {
  await requireAuth(slug);
  const isFinished = formData.get("isFinished") === "on";
  await prisma.group.update({ where: { id: groupId }, data: { isFinished } });
  revalidatePath(`/admin/${slug}/torneos/${tournamentId}`);
  revalidatePath(`/${slug}/torneos/${tournamentId}`);
}

const EVENT_PREFIXES: { prefix: string; type: MatchEventType; side: "home" | "away" }[] = [
  { prefix: "homeGoals_", type: MatchEventType.GOAL, side: "home" },
  { prefix: "awayGoals_", type: MatchEventType.GOAL, side: "away" },
  { prefix: "homeYellow_", type: MatchEventType.YELLOW_CARD, side: "home" },
  { prefix: "awayYellow_", type: MatchEventType.YELLOW_CARD, side: "away" },
  { prefix: "homeRed_", type: MatchEventType.RED_CARD, side: "home" },
  { prefix: "awayRed_", type: MatchEventType.RED_CARD, side: "away" },
];

export async function submitResultAction(slug: string, matchId: string, formData: FormData) {
  await requireAuth(slug);

  const homeScore = Number(formData.get("homeScore") ?? 0);
  const awayScore = Number(formData.get("awayScore") ?? 0);

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;

  const events: { playerId: string; teamId: string; type: MatchEventType; count: number }[] = [];
  for (const [key, value] of formData.entries()) {
    const count = Number(value);
    if (!count) continue;
    for (const { prefix, type, side } of EVENT_PREFIXES) {
      if (key.startsWith(prefix)) {
        events.push({
          playerId: key.replace(prefix, ""),
          teamId: side === "home" ? match.homeTeamId : match.awayTeamId,
          type,
          count,
        });
      }
    }
  }

  // Convocatoria: which players from each team's roster actually played this
  // match, marked by the veedor before capturing goals/cards. A player with
  // a goal/card recorded is always counted as having played, even if the
  // "Jugó" checkbox was missed, so stats are never silently lost.
  const homeKeeperId = String(formData.get("homeKeeper") ?? "").trim() || null;
  const awayKeeperId = String(formData.get("awayKeeper") ?? "").trim() || null;

  const playedHome = new Set<string>();
  const playedAway = new Set<string>();
  for (const [key, value] of formData.entries()) {
    if (value !== "on") continue;
    if (key.startsWith("homePlayed_")) playedHome.add(key.replace("homePlayed_", ""));
    if (key.startsWith("awayPlayed_")) playedAway.add(key.replace("awayPlayed_", ""));
  }
  for (const e of events) {
    if (e.teamId === match.homeTeamId) playedHome.add(e.playerId);
    else playedAway.add(e.playerId);
  }
  if (homeKeeperId) playedHome.add(homeKeeperId);
  if (awayKeeperId) playedAway.add(awayKeeperId);

  const appearances: { playerId: string; teamId: string; isGoalkeeper: boolean }[] = [
    ...[...playedHome].map((playerId) => ({
      playerId,
      teamId: match.homeTeamId,
      isGoalkeeper: playerId === homeKeeperId,
    })),
    ...[...playedAway].map((playerId) => ({
      playerId,
      teamId: match.awayTeamId,
      isGoalkeeper: playerId === awayKeeperId,
    })),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.match.update({ where: { id: matchId }, data: { homeScore, awayScore, status: MatchStatus.PLAYED } });
    await tx.matchEvent.deleteMany({
      where: { matchId, type: { in: [MatchEventType.GOAL, MatchEventType.YELLOW_CARD, MatchEventType.RED_CARD] } },
    });
    for (const e of events) {
      for (let i = 0; i < e.count; i++) {
        await tx.matchEvent.create({ data: { matchId, playerId: e.playerId, teamId: e.teamId, type: e.type } });
      }
    }
    await tx.matchAppearance.deleteMany({ where: { matchId } });
    for (const a of appearances) {
      await tx.matchAppearance.create({ data: { matchId, ...a } });
    }
  });

  revalidatePath(`/admin/${slug}/torneos/${match.tournamentId}`);
  revalidatePath(`/${slug}/torneos/${match.tournamentId}`);
  revalidatePath(`/${slug}`);
}

// ---------------- Sponsors ----------------

export async function createSponsorAction(slug: string, leagueId: string, formData: FormData) {
  await requireAuth(slug);
  const name = String(formData.get("name") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null;
  if (!name || !logoUrl) return;
  await prisma.sponsor.create({ data: { leagueId, name, logoUrl, linkUrl } });
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/${slug}`, "layout");
}

export async function deleteSponsorAction(slug: string, sponsorId: string) {
  await requireAuth(slug);
  await prisma.sponsor.delete({ where: { id: sponsorId } });
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/${slug}`, "layout");
}

// ---------------- Photos ----------------

export async function createPhotoAction(slug: string, leagueId: string, formData: FormData) {
  await requireAuth(slug);
  const url = String(formData.get("url") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim() || null;
  if (!url) return;
  await prisma.photo.create({ data: { leagueId, url, caption } });
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/${slug}/galeria`);
}

export async function deletePhotoAction(slug: string, photoId: string) {
  await requireAuth(slug);
  await prisma.photo.delete({ where: { id: photoId } });
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/${slug}/galeria`);
}

// ---------------- News ----------------

export async function createNewsAction(slug: string, leagueId: string, formData: FormData) {
  await requireAuth(slug);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  await prisma.newsPost.create({ data: { leagueId, title, body } });
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/noticias`);
}

export async function deleteNewsAction(slug: string, postId: string) {
  await requireAuth(slug);
  await prisma.newsPost.delete({ where: { id: postId } });
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/noticias`);
}

// ---------------- Free agents (jugadores libres / busco equipo) ----------------

export async function createFreeAgentAction(slug: string, leagueId: string, formData: FormData) {
  const type = String(formData.get("type") ?? "JUGADOR_LIBRE") as "JUGADOR_LIBRE" | "BUSCO_EQUIPO";
  const fullName = String(formData.get("fullName") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim() || null;
  const contact = String(formData.get("contact") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || null;
  if (!fullName || !contact) return;

  await prisma.freeAgentListing.create({ data: { leagueId, type, fullName, position, contact, message } });
  revalidatePath(`/${slug}/jugadores-libres`);
}

export async function deleteFreeAgentAction(slug: string, listingId: string) {
  await requireAuth(slug);
  await prisma.freeAgentListing.delete({ where: { id: listingId } });
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/${slug}/jugadores-libres`);
}
