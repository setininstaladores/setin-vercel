// Función de Vercel: recibe el formulario de presupuesto y lo envía por correo con Resend.
// Variables de entorno: RESEND_API_KEY (obligatoria), MAIL_FROM y MAIL_TO (opcionales).

const MAX_FILE = 4 * 1024 * 1024; // Vercel limita cada envío a 4,5 MB.
const ALLOWED = /\.(jpe?g|png|webp|heic|pdf)$/i;
const REQUIRED = ["nombre", "email", "telefono", "tipo_servicio", "ciudad", "mensaje"];

const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, code: "invalid" });
  }

  const value = (name) => String(form.get(name) ?? "").trim();

  // Campo trampa para robots: se responde como si hubiera ido bien y no se envía nada.
  if (value("sitio-web-alternativo")) return json(200, { ok: true });

  const invalid = REQUIRED.filter((name) => !value(name));
  if (value("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email"))) invalid.push("email");
  if (!value("rgpd")) invalid.push("rgpd");
  if (invalid.length) return json(422, { ok: false, code: "invalid", fields: [...new Set(invalid)] });
  if (value("mensaje").length > 2000) return json(422, { ok: false, code: "invalid", fields: ["mensaje"] });

  const attachments = [];
  const file = form.get("fotos");
  if (file && typeof file === "object" && file.size > 0) {
    if (file.size > MAX_FILE) return json(413, { ok: false, code: "too_large", fields: ["fotos"] });
    if (!ALLOWED.test(file.name)) return json(422, { ok: false, code: "bad_type", fields: ["fotos"] });
    attachments.push({ filename: file.name, content: Buffer.from(await file.arrayBuffer()).toString("base64") });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("Falta la variable de entorno RESEND_API_KEY");
    return json(500, { ok: false, code: "failed" });
  }

  const text = [
    "Nueva solicitud de presupuesto desde la web",
    "",
    `Nombre: ${value("nombre")}`,
    `Empresa: ${value("empresa")}`,
    `Email: ${value("email")}`,
    `Teléfono: ${value("telefono")}`,
    `Servicio: ${value("tipo_servicio")}`,
    `Ciudad: ${value("ciudad")}`,
    `Fecha estimada: ${value("fecha")}`,
    "",
    "Mensaje:",
    value("mensaje"),
  ].join("\n");

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Web SETIN <instaladores@setininstaladores.com>",
      to: [process.env.MAIL_TO || "instaladores@setininstaladores.com"],
      reply_to: value("email"),
      subject: `Presupuesto web: ${value("tipo_servicio")} – ${value("empresa")} ${value("nombre")}`.replace(/\s+/g, " "),
      text,
      attachments,
    }),
  });

  if (!sent.ok) {
    console.error("Resend respondió", sent.status, await sent.text());
    return json(502, { ok: false, code: "failed" });
  }
  return json(200, { ok: true });
}
