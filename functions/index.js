// Adtomate — server-side alert emails.
//
// Fires whenever the public website writes a new document to `leads` or
// `assessment_leads` (see ../assets/js/firebase.js). Runs here, not in the
// browser, specifically so the Sociovia email API token never ships in
// client-side JS — anyone can view-source a static site, so a secret used
// there is not a secret.
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const EMAIL_API_TOKEN = defineSecret("EMAIL_API_TOKEN");
const ALERT_TO = "sociovia.ai@gmail.com";
const EMAIL_API_URL = "https://api.sociovia.com/api/email/send";

function esc(v) {
  if (v === undefined || v === null || v === "") return "—";
  return String(v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

async function sendAlert(token, subject, html) {
  const res = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: ALERT_TO, subject, html })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Email API responded ${res.status}: ${text}`);
  }
}

exports.onLeadCreated = onDocumentCreated(
  { document: "leads/{leadId}", secrets: [EMAIL_API_TOKEN] },
  async (event) => {
    const lead = event.data.data();
    const html = `
      <h2>Adtomate website — new lead</h2>
      <p><b>Name:</b> ${esc(lead.name)}</p>
      <p><b>Business:</b> ${esc(lead.business)}</p>
      <p><b>Phone:</b> ${esc(lead.phone)}</p>
      <p><b>Email:</b> ${esc(lead.email)}</p>
      <p><b>Service:</b> ${esc(lead.service)}</p>
      <p><b>Message:</b> ${esc(lead.message)}</p>
      <p><b>Page:</b> ${esc(lead.page)}</p>
    `;
    try {
      await sendAlert(EMAIL_API_TOKEN.value(), "Adtomate website — new lead", html);
    } catch (err) {
      logger.error("Failed to send lead alert email", err);
    }
  }
);

exports.onAssessmentCreated = onDocumentCreated(
  { document: "assessment_leads/{leadId}", secrets: [EMAIL_API_TOKEN] },
  async (event) => {
    const lead = event.data.data();
    const areas = Array.isArray(lead.opportunityAreas) ? lead.opportunityAreas.join(", ") : "—";
    const html = `
      <h2>Adtomate website — new assessment filled</h2>
      <p><b>Name:</b> ${esc(lead.name)}</p>
      <p><b>Company:</b> ${esc(lead.company)}</p>
      <p><b>Role:</b> ${esc(lead.role)}</p>
      <p><b>Email:</b> ${esc(lead.email)}</p>
      <p><b>Phone:</b> ${esc(lead.phone)}</p>
      <p><b>Website:</b> ${esc(lead.website)}</p>
      <p><b>Overall readiness:</b> ${esc(lead.overallScore)}/100 — ${esc(lead.profile)}</p>
      <p><b>Lead tier:</b> ${esc(lead.leadTier)}</p>
      <p><b>Top opportunity areas:</b> ${esc(areas)}</p>
    `;
    try {
      await sendAlert(EMAIL_API_TOKEN.value(), "Adtomate website — new assessment filled", html);
    } catch (err) {
      logger.error("Failed to send assessment alert email", err);
    }
  }
);
