import Link from "next/link";

export const metadata = { title: "Política de privacidad — CMD Tech" };

const SECTIONS = [
  { id: "quienes-somos", title: "1. Quiénes somos" },
  { id: "que-datos", title: "2. Qué datos recopilamos" },
  { id: "para-que", title: "3. Para qué usamos tus datos" },
  { id: "base-legal", title: "4. Base legal" },
  { id: "con-quien", title: "5. Con quién compartimos datos" },
  { id: "conservacion", title: "6. Cuánto tiempo los conservamos" },
  { id: "derechos", title: "7. Tus derechos" },
  { id: "seguridad", title: "8. Seguridad de la información" },
  { id: "menores", title: "9. Datos de menores de edad" },
  { id: "cookies", title: "10. Cookies" },
  { id: "cambios", title: "11. Cambios a esta política" },
  { id: "contacto", title: "12. Contacto" },
];

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" className="text-sm text-slate-400 hover:underline">
        ← Volver al inicio
      </Link>

      <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Política de privacidad</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: 18 de septiembre de 2026.</p>
      <p className="mt-4 text-slate-600">
        Esta política explica qué datos personales recopilamos a través de esta plataforma
        (formulario de solicitud, paneles de administración y sitios públicos de cada liga),
        para qué los usamos, con quién los compartimos y qué derechos tenés sobre ellos.
      </p>

      <nav className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Índice
        </p>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-slate-600 hover:text-slate-900 hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10 text-slate-600">
        <Section id="quienes-somos" title="1. Quiénes somos">
          <p>
            Esta plataforma es desarrollada y operada por{" "}
            <a href="https://cmdtech.uy" target="_blank" rel="noopener noreferrer" className="font-medium text-slate-800 hover:underline">
              CMD Tech
            </a>
            , responsable del tratamiento de los datos personales que se describen en esta
            política. Ofrecemos el software a organizadores de ligas y torneos deportivos
            amateur (nuestros &ldquo;clientes&rdquo;), quienes a su vez lo usan para gestionar sus
            propias ligas, equipos y jugadores.
          </p>
        </Section>

        <Section id="que-datos" title="2. Qué datos recopilamos">
          <p>Según cómo uses la plataforma, recopilamos distintos tipos de datos:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-slate-800">Formulario &ldquo;Solicitá tu liga&rdquo;:</strong> tu
              nombre, el nombre de tu liga o torneo, tu ciudad (opcional), un medio de contacto
              (email o teléfono) y el mensaje que nos dejes.
            </li>
            <li>
              <strong className="text-slate-800">Panel de administración de una liga:</strong> la
              contraseña que usás para entrar, y los datos que cargás sobre tu liga (nombre,
              colores, logo, sponsors, noticias, fotos) y sobre sus equipos y jugadores (nombres,
              números de camiseta, posición, fotos, resultados de partidos, goles y tarjetas).
            </li>
            <li>
              <strong className="text-slate-800">
                Formulario público &ldquo;Jugadores libres / busco equipo&rdquo;:
              </strong>{" "}
              el nombre, posición y contacto que decidís publicar para que otros te encuentren.
            </li>
            <li>
              <strong className="text-slate-800">Datos técnicos:</strong> información básica de
              uso del sitio recogida automáticamente por nuestro proveedor de hosting (Vercel),
              como direcciones IP y registros de errores, usada solo para operar y dar
              mantenimiento a la plataforma.
            </li>
          </ul>
        </Section>

        <Section id="para-que" title="3. Para qué usamos tus datos">
          <ul className="list-disc space-y-2 pl-5">
            <li>Contactarte para coordinar la puesta en marcha de tu liga en la plataforma.</li>
            <li>
              Mostrar públicamente el contenido de cada liga (tablas de posiciones, goleadores,
              plantillas, noticias, galería) tal como lo carga cada organizador desde su panel.
            </li>
            <li>Dar soporte técnico y responder consultas.</li>
            <li>Mantener y mejorar el funcionamiento y la seguridad de la plataforma.</li>
          </ul>
        </Section>

        <Section id="base-legal" title="4. Base legal">
          <p>
            Tratamos tus datos con tu consentimiento (al completar un formulario y aceptar esta
            política) y, en el caso de los organizadores de liga, en el marco de la relación
            contractual para prestarles el servicio. Los datos que un organizador carga sobre sus
            equipos y jugadores se procesan bajo su responsabilidad como administrador de esa
            liga.
          </p>
        </Section>

        <Section id="con-quien" title="5. Con quién compartimos datos">
          <p>No vendemos ni compartimos tus datos con terceros para fines de marketing. Sí usamos proveedores de infraestructura que procesan datos por nuestra cuenta, únicamente para operar la plataforma:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-slate-800">Vercel</strong> — hospedaje de la aplicación y
              almacenamiento de archivos (logos, escudos, fotos) subidos desde los paneles de
              administración.
            </li>
            <li>
              <strong className="text-slate-800">Neon</strong> — base de datos donde se guarda la
              información de ligas, equipos, jugadores y solicitudes.
            </li>
            <li>
              <strong className="text-slate-800">Resend</strong> — envío del email interno que nos
              avisa cuando llega una nueva solicitud de liga.
            </li>
          </ul>
          <p className="mt-3">
            Los contenidos que un organizador de liga hace públicos (equipos, jugadores, fotos,
            resultados) son visibles para cualquier visitante del sitio de esa liga, ya que ese es
            el propósito del servicio.
          </p>
        </Section>

        <Section id="conservacion" title="6. Cuánto tiempo los conservamos">
          <p>
            Guardamos las solicitudes de contacto hasta que las resolvemos o hasta que nos pidas
            que las eliminemos. Los datos de una liga, sus equipos y jugadores se conservan
            mientras esa liga esté activa en la plataforma, y se eliminan a pedido del organizador
            o si se da de baja el servicio.
          </p>
        </Section>

        <Section id="derechos" title="7. Tus derechos">
          <p>Sobre tus datos personales, podés pedirnos en cualquier momento:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Acceder a los datos que tenemos sobre vos.</li>
            <li>Corregir datos incorrectos o desactualizados.</li>
            <li>Eliminar tus datos (por ejemplo, una solicitud de contacto o tu ficha de jugador).</li>
            <li>Retirar tu consentimiento para futuros contactos.</li>
          </ul>
          <p className="mt-3">
            Para ejercer estos derechos, escribinos por los medios indicados en la sección de{" "}
            <a href="#contacto" className="font-medium text-slate-800 hover:underline">
              Contacto
            </a>
            . Si tu pedido es sobre datos cargados en una liga específica (por ejemplo, tu ficha de
            jugador), también podés pedírselo directamente al organizador de esa liga.
          </p>
        </Section>

        <Section id="seguridad" title="8. Seguridad de la información">
          <p>
            Aplicamos medidas razonables para proteger tus datos, como conexiones cifradas
            (HTTPS) y acceso a los paneles de administración protegido con contraseña. Ningún
            sistema es 100% infalible, pero trabajamos para mantener la plataforma segura y
            actualizada.
          </p>
        </Section>

        <Section id="menores" title="9. Datos de menores de edad">
          <p>
            Algunas ligas amateur incluyen categorías juveniles, por lo que es posible que un
            organizador cargue el nombre y datos deportivos de un jugador menor de edad. Es
            responsabilidad de cada organizador de liga contar con la autorización correspondiente
            de madres, padres o tutores antes de publicar esa información. Si sos madre, padre o
            tutor y querés que se elimine o corrija la información de un menor, contactanos.
          </p>
        </Section>

        <Section id="cookies" title="10. Cookies">
          <p>
            Usamos únicamente una cookie técnica de sesión para mantener iniciada la sesión de un
            administrador de liga después de ingresar su contraseña. No usamos cookies de
            publicidad ni de seguimiento entre sitios.
          </p>
        </Section>

        <Section id="cambios" title="11. Cambios a esta política">
          <p>
            Podemos actualizar esta política a medida que la plataforma evolucione. Si hacemos
            cambios importantes, actualizaremos la fecha al inicio de esta página.
          </p>
        </Section>

        <Section id="contacto" title="12. Contacto">
          <p>
            ¿Preguntas, pedidos sobre tus datos o algo que no quedó claro? Escribinos a través de{" "}
            <a href="https://cmdtech.uy" target="_blank" rel="noopener noreferrer" className="font-medium text-slate-800 hover:underline">
              cmdtech.uy
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}
