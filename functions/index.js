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
const EVENTS_API_URL = "https://api.sociovia.com/api/email/events";

function esc(v) {
  if (v === undefined || v === null || v === "") return "—";
  return String(v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// Internal team alert — a plain email to ALERT_TO.
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

// CRM event — pushes the lead's own contact into the events pipeline so
// configured automations fire. `variables` values are coerced to strings
// (the API expects string values, per the documented payload shape).
async function sendEvent(token, eventName, email, name, variables) {
  const vars = {};
  for (const [k, v] of Object.entries(variables || {})) {
    if (v !== undefined && v !== null && v !== "") vars[k] = String(v);
  }
  const res = await fetch(EVENTS_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ event: eventName, email, name, variables: vars })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Events API responded ${res.status}: ${text}`);
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
    const token = EMAIL_API_TOKEN.value();
    try {
      await sendAlert(token, "Adtomate website — new lead", html);
    } catch (err) {
      logger.error("Failed to send lead alert email", err);
    }
    // Push the lead into the CRM events pipeline (uses the lead's own email).
    if (lead.email) {
      try {
        await sendEvent(token, "lead_captured", lead.email, lead.name || "", {
          business: lead.business,
          phone: lead.phone,
          service: lead.service,
          message: lead.message,
          source: lead.source,
          page: lead.page
        });
      } catch (err) {
        logger.error("Failed to send lead_captured event to CRM", err);
      }
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
    const token = EMAIL_API_TOKEN.value();
    try {
      await sendAlert(token, "Adtomate website — new assessment filled", html);
    } catch (err) {
      logger.error("Failed to send assessment alert email", err);
    }
    // Push the lead into the CRM events pipeline (uses the lead's own email).
    if (lead.email) {
      try {
        await sendEvent(token, "assessment_completed", lead.email, lead.name || "", {
          company: lead.company,
          role: lead.role,
          phone: lead.phone,
          website: lead.website,
          overall_score: lead.overallScore,
          profile: lead.profile,
          lead_tier: lead.leadTier,
          opportunity_areas: areas
        });
      } catch (err) {
        logger.error("Failed to send assessment_completed event to CRM", err);
      }
    }
  }
);
