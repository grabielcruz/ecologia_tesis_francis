import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
const SMTP_PORT = Number(process.env.SMTP_PORT || 2525);
const SMTP_SECURE =
  String(process.env.SMTP_SECURE || "false").toLowerCase() !== "false";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;

const isEmailEnabled = Boolean(SMTP_USER && SMTP_PASS && MAIL_FROM);

const transporter = isEmailEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const sendMail = async ({ to, subject, html, text }: SendMailParams) => {
  if (!transporter) {
    console.warn("SMTP no configurado: omitiendo envío de correo.");
    return;
  }

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    html,
    text,
  });
};

export const sendWelcomeEmail = async ({
  to,
  name,
}: {
  to: string;
  name: string;
}) => {
  const subject = "Bienvenido a Univerde";
  const text = `Hola ${name},\n\nTu cuenta en Univerde fue creada correctamente.\n\n¡Bienvenido!`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #123f3a;">
      <h2 style="margin: 0 0 12px;">Bienvenido a Univerde</h2>
      <p>Hola <strong>${name}</strong>,</p>
      <p>Tu cuenta fue creada correctamente y ya puedes iniciar sesión.</p>
      <p style="margin-top: 20px;">¡Gracias por unirte!</p>
    </div>
  `;

  await sendMail({ to, subject, html, text });
};

export const sendPasswordResetEmail = async ({
  to,
  name,
  resetLink,
}: {
  to: string;
  name: string;
  resetLink: string;
}) => {
  const subject = "Recuperación de contraseña - Univerde";
  const text = `Hola ${name},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nAbre este enlace para continuar:\n${resetLink}\n\nSi no fuiste tú, ignora este mensaje.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #123f3a;">
      <h2 style="margin: 0 0 12px;">Recuperación de contraseña</h2>
      <p>Hola <strong>${name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>
        <a href="${resetLink}" style="display: inline-block; background: #1fa886; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 700;">
          Restablecer contraseña
        </a>
      </p>
      <p>También puedes copiar este enlace en tu navegador:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Si no fuiste tú, ignora este mensaje.</p>
    </div>
  `;

  await sendMail({ to, subject, html, text });
};
