import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendContactEmailParams {
  toEmail: string;
  toName: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  recipientLabel: string;
}

export async function sendContactEmail(params: SendContactEmailParams): Promise<{ error: string | null }> {
  const fromAddress = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !resend) {
    console.error('sendContactEmail: RESEND_API_KEY is not configured');
    return { error: 'Email service is not configured.' };
  }

  if (!fromAddress) {
    console.error('sendContactEmail: RESEND_FROM_EMAIL is not configured');
    return { error: 'Email service is not configured.' };
  }

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: params.toEmail,
      replyTo: params.senderEmail,
      subject: params.subject,
      text: [
        `New message via the website contact form`,
        ``,
        `From: ${params.senderName} <${params.senderEmail}>`,
        `To: ${params.recipientLabel}`,
        `Subject: ${params.subject}`,
        ``,
        `---`,
        ``,
        params.message,
      ].join('\n'),
    });

    if (error) {
      console.error('Resend API error:', error);
      return { error: 'Failed to deliver email.' };
    }

    return { error: null };
  } catch (err) {
    console.error('sendContactEmail unexpected error:', err);
    return { error: 'Failed to deliver email.' };
  }
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const fromAddress = process.env.RESEND_FROM_EMAIL;
  if (!resendApiKey || !resend || !fromAddress) {
    console.error('sendPasswordResetEmail: email service is not configured');
    return;
  }

  const { to, resetUrl } = params;
  const subject = 'Reset your Westwood Community Band admin password';
  const text = [
    'You requested to reset your admin password for the Westwood Community Band site.',
    '',
    'If you did not make this request, you can safely ignore this email.',
    '',
    'To reset your password, open this link:',
    '',
    `<${resetUrl}>`,
    '',
    'This link will expire in 1 hour.',
  ].join('\n');

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6;">
      <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Reset your admin password</h1>
      <p style="margin: 0 0 12px;">You requested to reset your admin password for the Westwood Community Band site.</p>
      <p style="margin: 0 0 12px;">If you did not make this request, you can safely ignore this email.</p>
      <p style="margin: 0 0 20px;">
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 18px; border-radius: 999px; background: #991b1b; color: #ffffff; text-decoration: none;">
          Reset password
        </a>
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #64748b;">Or copy and paste this URL into your browser:</p>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        <a href="${resetUrl}" style="color: #991b1b; word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="margin: 20px 0 0; font-size: 12px; color: #94a3b8;">This link will expire in 1 hour.</p>
    </div>
  `;

  try {
    await resend.emails.send({ from: fromAddress, to, subject, text, html });
  } catch (err) {
    console.error('sendPasswordResetEmail failed:', err);
  }
}
