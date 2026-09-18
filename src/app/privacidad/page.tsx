import Link from "next/link";

export const metadata = { title: "Política de privacidad — CMD Tech" };

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/" className="text-sm text-slate-400 hover:underline">
        ← Volver
      </Link>
      <h1 className="mt-2 text-xl font-bold text-slate-900">Política de privacidad</h1>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <p>
          Cuando completás el formulario de &ldquo;Solicitá tu liga&rdquo; recopilamos tu nombre, el
          nombre de tu liga o torneo, tu ciudad (si la indicás), un medio de contacto (email o
          teléfono) y el mensaje que nos dejes.
        </p>
        <p>Usamos estos datos únicamente para contactarte y coordinar la puesta en marcha de tu liga en la plataforma. No los compartimos ni los vendemos a terceros.</p>
        <p>
          Si organizás una liga en la plataforma, los datos que cargás de tus equipos y jugadores
          (nombres, números, fotos, resultados) son de tu liga y se muestran públicamente en el sitio
          de tu liga, tal como lo configurás desde tu panel de administración.
        </p>
        <p>
          Podés pedirnos que eliminemos tu solicitud o los datos de tu liga escribiéndonos a través de{" "}
          <a href="https://cmdtech.uy" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
            cmdtech.uy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
