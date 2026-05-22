import { Resend } from 'resend'

export type ConfirmationEmailData = {
  to: string
  filename: string
  submittedAt: string
}

export function buildConfirmationEmail(data: ConfirmationEmailData) {
  const { filename, submittedAt } = data
  const formattedDate = new Date(submittedAt).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Edmonton',
  })

  const subject = 'Your logo submission has been received — NAHSAC Logo Contest'

  const text = `Thank you for submitting your logo design to the National Aboriginal Head Start Association of Canada Association of Canada Logo Contest!

We have received your submission and our team will be reviewing all entries.

Submitted: ${filename}
Date: ${formattedDate}

We will be in touch if your design is selected.

— The NAHSAC Team
contest@aahsa.ca`

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="font-family: Georgia, serif; color: #1B3A5C; max-width: 600px; margin: 0 auto; padding: 24px; background: #F8F4EF;">
  <div style="background: #1B3A5C; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #F8F4EF; margin: 0; font-size: 22px;">National Aboriginal Head Start Association of Canada</h1>
    <p style="color: #C4742A; margin: 4px 0 0; font-size: 16px;">Logo Contest</p>
  </div>
  <div style="background: #fff; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #E8E0D5; border-top: none;">
    <h2 style="color: #C4742A;">Thank you for your submission!</h2>
    <p>Thank you for submitting your logo design to the <strong>National Aboriginal Head Start Association of Canada Association of Canada Logo Contest</strong>!</p>
    <p>We have received your submission and our team will be reviewing all entries.</p>
    <table style="margin: 20px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 16px 6px 0; font-weight: bold; white-space: nowrap;">Submitted:</td>
        <td style="padding: 6px 0;">${filename}</td>
      </tr>
      <tr>
        <td style="padding: 6px 16px 6px 0; font-weight: bold; white-space: nowrap;">Date:</td>
        <td style="padding: 6px 0;">${formattedDate}</td>
      </tr>
    </table>
    <p>We will be in touch if your design is selected.</p>
    <hr style="border: none; border-top: 1px solid #E8E0D5; margin: 24px 0;">
    <p style="color: #666; font-size: 14px;">— The NAHSAC Team<br><a href="mailto:contest@aahsa.ca" style="color: #C4742A;">contest@aahsa.ca</a></p>
  </div>
</body>
</html>`

  return { subject, text, html }
}

export async function sendConfirmationEmail(data: ConfirmationEmailData) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { subject, text, html } = buildConfirmationEmail(data)
  return resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'contest@aahsa.ca',
    to: data.to,
    subject,
    text,
    html,
  })
}
