import { Resend } from "resend";

const NOTIFY_EMAIL = process.env.CONTACT_NOTIFY_EMAIL ?? "administracion@coberturamedicad.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "notificaciones@coberturamedicad.com";

export async function notifyContactRequest(data: {
  fullName: string;
  leagueName: string;
  city: string | null;
  contact: string;
  message: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `Nueva solicitud de liga: ${data.leagueName}`,
    text: [
      `Nombre: ${data.fullName}`,
      `Liga/torneo: ${data.leagueName}`,
      `Ciudad: ${data.city ?? "-"}`,
      `Contacto: ${data.contact}`,
      `Mensaje: ${data.message ?? "-"}`,
    ].join("\n"),
  });
}
