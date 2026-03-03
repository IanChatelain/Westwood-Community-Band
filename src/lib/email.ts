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
