import { prisma } from "@/lib/prisma";

export function getLeagueBySlug(slug: string) {
  return prisma.league.findUnique({ where: { slug } });
}

export function getActiveSeason(leagueId: string) {
  return prisma.season.findFirst({
    where: { leagueId, isActive: true },
    orderBy: { startDate: "desc" },
  });
}

export function getAllLeagues() {
  return prisma.league.findMany({ orderBy: { createdAt: "asc" } });
}
