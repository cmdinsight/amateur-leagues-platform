"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function goToLeagueAdminAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  if (!slug) redirect("/admin?error=1");

  const league = await prisma.league.findUnique({ where: { slug } });
  if (!league) redirect("/admin?error=1");

  redirect(`/admin/${slug}`);
}

// ---------------- Contact requests (leads from the marketing homepage) ----------------

export async function createContactRequestAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const leagueName = String(formData.get("leagueName") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;
  const contact = String(formData.get("contact") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || null;
  if (!fullName || !leagueName || !contact) return;

  await prisma.contactRequest.create({ data: { fullName, leagueName, city, contact, message } });
  redirect("/?solicitud=ok#solicitar");
}

// ---------------- Platform-level auth (CMD Tech, not a specific league) ----------------

const PLATFORM_COOKIE = "platform_admin";

export async function platformLoginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== (process.env.PLATFORM_ADMIN_PASSWORD ?? "cmdtech2026")) {
    redirect("/admin/solicitudes?error=1");
  }
  const store = await cookies();
  store.set(PLATFORM_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  redirect("/admin/solicitudes");
}

export async function platformLogoutAction() {
  const store = await cookies();
  store.delete(PLATFORM_COOKIE);
  redirect("/admin/solicitudes");
}

export async function isPlatformAuthed() {
  const store = await cookies();
  return store.get(PLATFORM_COOKIE)?.value === "1";
}

export async function deleteContactRequestAction(requestId: string) {
  const authed = await isPlatformAuthed();
  if (!authed) redirect("/admin/solicitudes");
  await prisma.contactRequest.delete({ where: { id: requestId } });
  revalidatePath("/admin/solicitudes");
}
