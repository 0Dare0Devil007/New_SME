import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EndorsementEmailData {
  smeName: string;
  endorserName: string;
  endorserPosition?: string | null;
  skillName: string;
  comment?: string | null;
  profileUrl: string;
  preferencesUrl: string;
}

interface SendEmailParams {
  to: string;
  recipientName: string;
  subject: string;
  type: "ENDORSEMENT";
  data: EndorsementEmailData;
}

/**
 * Generate HTML for endorsement email
 */
function generateEndorsementEmailHTML(data: EndorsementEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .message {
      margin-bottom: 24px;
      line-height: 1.7;
    }
    .endorser {
      font-weight: 600;
      color: #2563eb;
    }
    .skill {
      font-weight: 600;
      color: #7c3aed;
    }
    .comment-box {
      background-color: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .comment-label {
      font-weight: 600;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .comment-text {
      color: #334155;
      font-style: italic;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      font-weight: 500;
      margin: 16px 0;
      text-align: center;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 New Endorsement Received!</h1>
    </div>
    <div class="content">
      <div class="greeting">Hi ${data.smeName},</div>
      <div class="message">
        <span class="endorser">${data.endorserName}</span>${
    data.endorserPosition ? ` (${data.endorserPosition})` : ""
  } just endorsed your skill in <span class="skill">${data.skillName}</span>!
      </div>
      ${
        data.comment
          ? `
      <div class="comment-box">
        <div class="comment-label">Comment</div>
        <div class="comment-text">"${data.comment}"</div>
      </div>
      `
          : ""
      }
      <div style="text-align: center;">
        <a href="${data.profileUrl}" class="button">View Your Profile</a>
      </div>
    </div>
    <div class="footer">
      <div>SME Directory - Learning Hub & Expert Network</div>
      <div class="divider"></div>
      <div>
        <a href="${data.preferencesUrl}">Manage email preferences</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version for endorsement email
 */
function generateEndorsementEmailText(data: EndorsementEmailData): string {
  let text = `Hi ${data.smeName},\n\n`;
  text += `${data.endorserName}`;
  if (data.endorserPosition) {
    text += ` (${data.endorserPosition})`;
  }
  text += ` just endorsed your skill in ${data.skillName}!\n\n`;

  if (data.comment) {
    text += `Comment: "${data.comment}"\n\n`;
  }

  text += `View your profile: ${data.profileUrl}\n\n`;
  text += `---\n`;
  text += `Manage email preferences: ${data.preferencesUrl}`;

  return text;
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  params: SendEmailParams
): Promise<void> {
  try {
    // Skip if no API key configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping email notification");
      return;
    }

    let html: string;
    let text: string;

    if (params.type === "ENDORSEMENT") {
      html = generateEndorsementEmailHTML(params.data);
      text = generateEndorsementEmailText(params.data);
    } else {
      throw new Error(`Unsupported email type: ${params.type}`);
    }

    const fromEmail =
      process.env.NOTIFICATION_FROM_EMAIL || "noreply@yourdomain.com";

    await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html,
      text,
    });

    console.log(`Email notification sent to ${params.to}`);
  } catch (error) {
    console.error("Error sending email notification:", error);
    // Don't throw - we don't want to fail the operation if email fails
  }
}
