const nodemailer = require("nodemailer");

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

async function sendWelcomeBackEmail(user) {
  const transporter = getTransporter();
  const firstName = user.name.trim().split(/\s+/)[0] || "traveler";
  const safeFirstName = escapeHtml(firstName);
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const clientOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
  const dashboardUrl = `${clientOrigin}/home`;

  return transporter.sendMail({
    // Email apps display this name in the inbox. The authenticated address is
    // still available in expanded sender details, as required by email clients.
    from: { name: "TravelBuddy", address: from },
    to: user.email,
    subject: "Welcome back to TravelBuddy ✈️",
    text: `Welcome back, ${firstName}!\n\nYour next adventure is waiting. Meet Maya, who is headed to Lisbon this May, and Jordan, who is planning a Kyoto food tour in June.\n\nExplore your matches: ${dashboardUrl}`,
    html: `
      <!doctype html>
      <html lang="en">
        <body style="margin:0;padding:0;background-color:#f0fdfa;font-family:Arial,Helvetica,sans-serif;color:#172554;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0fdfa;padding:28px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(13,148,136,.15);">
                  <tr>
                    <td style="padding:28px 32px;background:linear-gradient(135deg,#14b8a6 0%,#0891b2 55%,#2563eb 100%);color:#ffffff;">
                      <p style="margin:0 0 10px;font-size:15px;font-weight:700;letter-spacing:.5px;">✈&nbsp; TRAVELBUDDY</p>
                      <h1 style="margin:0;font-size:30px;line-height:1.2;">Welcome back, ${safeFirstName}!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <p style="margin:0 0 26px;font-size:18px;line-height:1.55;color:#334155;">Your next adventure is waiting. Here are a couple of travelers who could make it even better.</p>

                      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f766e;">Suggested travel matches</p>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:12px;border:1px solid #ccfbf1;border-radius:12px;background-color:#f0fdfa;">
                        <tr>
                          <td style="padding:16px;width:42px;vertical-align:top;font-size:28px;">🧳</td>
                          <td style="padding:16px 16px 16px 0;">
                            <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#0f172a;">Maya R.</p>
                            <p style="margin:0;font-size:15px;line-height:1.45;color:#475569;">Lisbon escape · May 12–18<br>Food, architecture &amp; coastal walks</p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;border:1px solid #cffafe;border-radius:12px;background-color:#ecfeff;">
                        <tr>
                          <td style="padding:16px;width:42px;vertical-align:top;font-size:28px;">🍜</td>
                          <td style="padding:16px 16px 16px 0;">
                            <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#0f172a;">Jordan K.</p>
                            <p style="margin:0;font-size:15px;line-height:1.45;color:#475569;">Kyoto food tour · June 3–10<br>Markets, temples &amp; local favorites</p>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="border-radius:9px;background-color:#0d9488;">
                            <a href="${dashboardUrl}" style="display:inline-block;padding:14px 22px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Explore your matches</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">TravelBuddy connects you with people who want to explore the world, together.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`,
  });
}

module.exports = { sendWelcomeBackEmail };
