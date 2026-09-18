"use client";

import { useState, useTransition } from "react";

const STEPS = [
  {
    title: "¡Bienvenido a tu panel!",
    body: "Este es un recorrido rápido por lo que podés hacer acá. Te lleva menos de un minuto.",
  },
  {
    title: "Marca de tu liga",
    body: "Arriba de todo podés cambiar el nombre, ciudad, colores y logo de tu liga — se aplican al instante en todo tu sitio público.",
  },
  {
    title: "Series y torneos",
    body: "Creá una o más series (por ejemplo, Primera y Segunda división) y, dentro de cada una, los torneos que jueguen (liga, grupos o eliminación directa).",
  },
  {
    title: "Equipos y jugadores",
    body: "En la sección Equipos creás tus equipos y cargás jugadores — nuevos o sumando uno que ya juega en otro equipo de tu liga, sin perder su historial.",
  },
  {
    title: "Sponsors, galería y noticias",
    body: "Sumá el contenido de tu liga: logos de sponsors, fotos y noticias, todo se muestra en el sitio público de tu liga.",
  },
  {
    title: "Cerrar un partido",
    body: "Entrando a un torneo podés programar partidos y, al cerrar el resultado, marcar quién jugó cada partido y quién fue arquero antes de cargar goles y tarjetas.",
  },
];

export function OnboardingTour({ dismissAction }: { dismissAction: () => Promise<void> }) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function finish() {
    startTransition(() => {
      dismissAction();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === step ? "bg-slate-900" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <h2 className="text-lg font-bold text-slate-900">{current.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{current.body}</p>
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={finish}
            disabled={isPending}
            className="text-sm text-slate-400 hover:underline disabled:opacity-50"
          >
            Saltar tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Atrás
              </button>
            )}
            {isLast ? (
              <button
                onClick={finish}
                disabled={isPending}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Empezar
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
