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
  revalidatePath(`/${slug}/divisiones`);
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
  revalidatePath(`/${slug}/divisiones/${divisionId}`);
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

  if (!homeTeamId || !awayTeamId || !dateStr || homeTeamId === awayTeamId) return;

  await prisma.match.create({
    data: {
      tournamentId,
      groupId,
      stage,
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

export async function submitResultAction(slug: string, matchId: string, formData: FormData) {
  await requireAuth(slug);

  const homeScore = Number(formData.get("homeScore") ?? 0);
  const awayScore = Number(formData.get("awayScore") ?? 0);

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;

  const goalsByPlayer: { playerId: string; teamId: string; count: number }[] = [];
  for (const [key, value] of formData.entries()) {
    const count = Number(value);
    if (!count) continue;
    if (key.startsWith("homeGoals_")) goalsByPlayer.push({ playerId: key.replace("homeGoals_", ""), teamId: match.homeTeamId, count });
    else if (key.startsWith("awayGoals_")) goalsByPlayer.push({ playerId: key.replace("awayGoals_", ""), teamId: match.awayTeamId, count });
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({ where: { id: matchId }, data: { homeScore, awayScore, status: MatchStatus.PLAYED } });
    await tx.matchEvent.deleteMany({ where: { matchId, type: MatchEventType.GOAL } });
    for (const g of goalsByPlayer) {
      for (let i = 0; i < g.count; i++) {
        await tx.matchEvent.create({ data: { matchId, playerId: g.playerId, teamId: g.teamId, type: MatchEventType.GOAL } });
      }
    }
  });

  revalidatePath(`/admin/${slug}/torneos/${match.tournamentId}`);
  revalidatePath(`/${slug}/torneos/${match.tournamentId}`);
  revalidatePath(`/${slug}`);
}
