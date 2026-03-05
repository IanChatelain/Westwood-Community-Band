'use server';

import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { contactMessages, profiles } from '@/db/schema';
import { sendContactEmail } from '@/lib/email';
import { sanitizeSingleLine, sanitizeEmail, sanitizeString, validateEmail, validateRequired } from '@/lib/validation';

export async function listContactRecipients(): Promise<{ id: string; label: string }[]> {
  try {
    const rows = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        contactLabel: profiles.contactLabel,
      })
      .from(profiles)
      .where(
        and(
          eq(profiles.isContactRecipient, true),
          isNotNull(profiles.email),
        ),
      )
      .orderBy(profiles.username);

    return rows.map((r) => ({
      id: r.id,
      label: r.contactLabel || r.username,
    }));
  } catch (err) {
    console.error('listContactRecipients failed:', err);
    return [];
  }
}

export async function submitContactMessage(data: {
  senderName: string;
  senderEmail: string;
  subject: string | null;
  message: string;
  recipientLabel: string;
  recipientId: string;
  userAgent: string | null;
}): Promise<{ error: string | null }> {
  const senderName = sanitizeSingleLine(data.senderName, 100);
  const senderEmail = sanitizeEmail(data.senderEmail);
  const subject = data.subject ? sanitizeSingleLine(data.subject, 200) : null;
  const message = sanitizeString(data.message, 5000);
  const recipientLabel = sanitizeSingleLine(data.recipientLabel, 100);
  const recipientId = data.recipientId?.trim().slice(0, 100);
  const userAgent = data.userAgent ? data.userAgent.slice(0, 500) : null;

  const nameErr = validateRequired(senderName, 'Name');
  if (nameErr) return { error: nameErr };

  const emailErr = validateEmail(senderEmail);
  if (emailErr) return { error: emailErr };

  const msgErr = validateRequired(message, 'Message');
  if (msgErr) return { error: msgErr };

  if (!recipientId) return { error: 'Please select a recipient.' };

  try {
    const recipientRows = await db
      .select({
        email: profiles.email,
        username: profiles.username,
        contactLabel: profiles.contactLabel,
        isContactRecipient: profiles.isContactRecipient,
      })
      .from(profiles)
      .where(eq(profiles.id, recipientId));

    const recipient = recipientRows[0];
    if (!recipient || !recipient.isContactRecipient || !recipient.email) {
      return { error: 'The selected recipient is not available. Please choose another.' };
    }

    await db.insert(contactMessages).values({
      id: uuidv4(),
      senderName,
      senderEmail,
      subject,
      message,
      recipientLabel,
      recipientId,
      userAgent,
    });

    const emailResult = await sendContactEmail({
      toEmail: recipient.email,
      toName: recipient.contactLabel || recipient.username,
      senderName,
      senderEmail,
      subject: subject || `New message via website – ${recipientLabel}`,
      message,
      recipientLabel,
    });

    if (emailResult.error) {
      console.error('Email delivery failed (message was still saved):', emailResult.error);
      return { error: 'Your message was saved but we could not send the email notification. The team will still see your message.' };
    }

    return { error: null };
  } catch (err) {
    console.error('submitContactMessage failed:', err);
    return { error: 'Failed to send message. Please try again later.' };
  }
}
