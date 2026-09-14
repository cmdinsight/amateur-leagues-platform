import { prisma } from "@/lib/prisma";

export function getLeagueBySlug(slug: string) {
  return prisma.league.findUnique({ where: { slug } });
}

export function getAllLeagues() {
  return prisma.league.findMany({ orderBy: { createdAt: "asc" } });
}

export function getDivisions(leagueId: string) {
  return prisma.division.findMany({
    where: { leagueId },
    orderBy: { name: "asc" },
    include: {
      tournaments: {
        orderBy: { startDate: "desc" },
      },
    },
  });
}

export function getDivisionById(divisionId: string) {
  return prisma.division.findUnique({
    where: { id: divisionId },
    include: { league: true, tournaments: { orderBy: { startDate: "desc" } } },
  });
}

export function getTournamentById(tournamentId: string) {
  return prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      division: { include: { league: true } },
      groups: true,
      entries: { include: { team: true, group: true } },
    },
  });
}
