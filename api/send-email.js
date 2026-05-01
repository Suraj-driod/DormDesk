import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "DormDesk <onboarding@resend.dev>";
const APP_NAME = "DormDesk";
const BRAND_COLOR = "#00B8D4";
const BRAND_GRADIENT = "linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)";

// ── Email templates ──────────────────────────────────────────────────────────

function baseLayout(content, preheader = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>${APP_NAME}</title>
<style>
  body{margin:0;padding:0;background:#f4f7fa;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .wrapper{width:100%;background:#f4f7fa;padding:40px 0}
  .card{max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)}
  .header{background:${BRAND_GRADIENT};padding:32px 40px;text-align:center}
  .header h1{margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-.3px}
  .header p{margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.85);font-weight:500}
  .body{padding:32px 40px}
  .body h2{margin:0 0 8px;font-size:18px;font-weight:700;color:#1a1a2e}
  .body p{margin:0 0 16px;font-size:14px;line-height:1.65;color:#4a4a68}
  .detail-card{background:#f8fafc;border:1px solid #e8ecf1;border-radius:12px;padding:20px;margin:20px 0}
  .detail-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
  .detail-label{color:#8892a4;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:.5px}
  .detail-value{color:#1a1a2e;font-weight:600;text-align:right}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
  .badge-high{background:#fff0f0;color:#dc2626;border:1px solid #fecaca}
  .badge-medium{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
  .badge-low{background:#ecfdf5;color:#059669;border:1px solid #a7f3d0}
  .badge-critical{background:#7f1d1d;color:#fff;border:1px solid #991b1b}
  .cta{display:inline-block;padding:12px 32px;background:${BRAND_GRADIENT};color:#fff !important;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;margin:8px 0;box-shadow:0 4px 14px rgba(0,184,212,.35)}
  .footer{padding:24px 40px;text-align:center;border-top:1px solid #f0f2f5}
  .footer p{margin:0;font-size:11px;color:#a0a5b8;line-height:1.6}
  .divider{height:1px;background:#f0f2f5;margin:20px 0}
  @media(max-width:600px){.body,.header,.footer{padding-left:24px !important;padding-right:24px !important}}
</style>
</head>
<body>
<span style="display:none;font-size:1px;color:#f4f7fa;max-height:0;overflow:hidden">${preheader}</span>
<div class="wrapper">
  <div class="card">
    ${content}
  </div>
  <div style="text-align:center;padding:20px">
    <p style="margin:0;font-size:11px;color:#a0a5b8">&copy; ${new Date().getFullYear()} ${APP_NAME}. Your hostel management companion.</p>
  </div>
</div>
</body>
</html>`;
}

function priorityBadge(priority) {
  const p = (priority || "low").toLowerCase();
  const cls = p === "critical" ? "badge-critical" : p === "high" ? "badge-high" : p === "medium" ? "badge-medium" : "badge-low";
  return `<span class="badge ${cls}">${p}</span>`;
}

const templates = {
  issue_reported: ({ issue, reporterName, adminName }) => ({
    subject: `🚨 New Issue Reported: ${issue.title}`,
    html: baseLayout(`
      <div class="header">
        <h1>🚨 New Issue Reported</h1>
        <p>A student has reported a new issue in your hostel</p>
      </div>
      <div class="body">
        <p>Hi <strong>${adminName || "Admin"}</strong>,</p>
        <p>A new issue has been reported and requires your attention. Please review and assign it to a caretaker.</p>
        
        <div class="detail-card">
          <div class="detail-row">
            <span class="detail-label">Issue Title</span>
            <span class="detail-value">${issue.title}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category</span>
            <span class="detail-value" style="text-transform:capitalize">${issue.category || "General"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Priority</span>
            <span class="detail-value">${priorityBadge(issue.priority)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location</span>
            <span class="detail-value">${issue.hostel || ""} · Block ${issue.block || "—"} · ${issue.room_no || "—"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reported By</span>
            <span class="detail-value">${reporterName || "Student"}</span>
          </div>
        </div>

        ${issue.description ? `<p style="background:#f8fafc;border-left:3px solid ${BRAND_COLOR};padding:12px 16px;border-radius:0 8px 8px 0;font-style:italic;color:#4a4a68;font-size:13px">"${issue.description}"</p>` : ""}
        
        <div style="text-align:center;margin-top:24px">
          <a href="${process.env.VITE_APP_URL || "https://dormdesk.vercel.app"}/admin/issues" class="cta">Review & Assign →</a>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated notification from ${APP_NAME}.<br/>You received this because you are the admin of this hostel.</p>
      </div>
    `, `New issue: ${issue.title} — ${issue.category}`),
  }),

  issue_assigned: ({ issue, caretakerName, adminName }) => ({
    subject: `🔧 New Assignment: ${issue.title}`,
    html: baseLayout(`
      <div class="header">
        <h1>🔧 You've Been Assigned</h1>
        <p>A new maintenance task requires your attention</p>
      </div>
      <div class="body">
        <p>Hi <strong>${caretakerName || "Caretaker"}</strong>,</p>
        <p><strong>${adminName || "Admin"}</strong> has assigned you a new issue. Please review the details below and begin work at your earliest convenience.</p>
        
        <div class="detail-card">
          <div class="detail-row">
            <span class="detail-label">Issue Title</span>
            <span class="detail-value">${issue.title}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category</span>
            <span class="detail-value" style="text-transform:capitalize">${issue.category || "General"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Priority</span>
            <span class="detail-value">${priorityBadge(issue.priority)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location</span>
            <span class="detail-value">${issue.hostel || ""} · Block ${issue.block || "—"} · ${issue.room_no || "—"}</span>
          </div>
        </div>

        ${issue.description ? `<p style="background:#f8fafc;border-left:3px solid ${BRAND_COLOR};padding:12px 16px;border-radius:0 8px 8px 0;font-style:italic;color:#4a4a68;font-size:13px">"${issue.description}"</p>` : ""}
        
        <div style="text-align:center;margin-top:24px">
          <a href="${process.env.VITE_APP_URL || "https://dormdesk.vercel.app"}/caretaker/assignments" class="cta">View My Assignments →</a>
        </div>

        <div class="divider"></div>
        <p style="font-size:12px;color:#8892a4;margin:0">Remember to submit proof of completion once the work is done. The admin will review your submission before marking the issue as resolved.</p>
      </div>
      <div class="footer">
        <p>This is an automated notification from ${APP_NAME}.<br/>You received this because a task was assigned to you.</p>
      </div>
    `, `New assignment: ${issue.title}`),
  }),

  issue_resolved: ({ issue, studentName }) => ({
    subject: `✅ Issue Resolved: ${issue.title}`,
    html: baseLayout(`
      <div class="header" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%)">
        <h1>✅ Your Issue Has Been Resolved</h1>
        <p>The caretaker has fixed your reported issue</p>
      </div>
      <div class="body">
        <p>Hi <strong>${studentName || "Student"}</strong>,</p>
        <p>Great news! Your reported issue has been reviewed and marked as <strong style="color:#059669">Resolved</strong> by the admin. The caretaker has submitted proof of completion which has been verified.</p>
        
        <div class="detail-card">
          <div class="detail-row">
            <span class="detail-label">Issue Title</span>
            <span class="detail-value">${issue.title}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category</span>
            <span class="detail-value" style="text-transform:capitalize">${issue.category || "General"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location</span>
            <span class="detail-value">${issue.hostel || ""} · Block ${issue.block || "—"} · ${issue.room_no || "—"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value"><span class="badge" style="background:#ecfdf5;color:#059669;border:1px solid #a7f3d0">RESOLVED</span></span>
          </div>
        </div>

        <div style="background:linear-gradient(135deg,#f0feff,#e0f7fa);border:1px solid #b2ebf2;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#00838f">⭐ Your feedback matters!</p>
          <p style="margin:0 0 16px;font-size:12px;color:#4a4a68">Help us improve by rating the resolution quality.</p>
          <a href="${process.env.VITE_APP_URL || "https://dormdesk.vercel.app"}/feed/post/${issue.id}" class="cta">Give Feedback →</a>
        </div>
        
        <p style="font-size:12px;color:#8892a4;margin:0">If the issue persists or wasn't resolved properly, you can report it as unsatisfactory in your feedback and we'll reopen it.</p>
      </div>
      <div class="footer">
        <p>This is an automated notification from ${APP_NAME}.<br/>You received this because you reported this issue.</p>
      </div>
    `, `Your issue "${issue.title}" has been resolved — give feedback`),
  }),
};

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { to, template, data } = req.body;

    if (!to || !template) {
      return res.status(400).json({ error: "Missing required fields: to, template" });
    }

    const templateFn = templates[template];
    if (!templateFn) {
      return res.status(400).json({ error: `Unknown template: ${template}` });
    }

    const { subject, html } = templateFn(data || {});

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    return res.status(200).json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({ error: error.message || "Failed to send email" });
  }
}
