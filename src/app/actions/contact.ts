'use server';

import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { contactMessages, profiles } from '@/db/schema';
import { sendContactEmail } from '@/lib/email';

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
  try {
    await db.insert(contactMessages).values({
      id: uuidv4(),
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      subject: data.subject,
      message: data.message,
      recipientLabel: data.recipientLabel,
      recipientId: data.recipientId,
      userAgent: data.userAgent,
    });

    const recipientRows = await db
      .select({
        email: profiles.email,
        username: profiles.username,
        contactLabel: profiles.contactLabel,
      })
      .from(profiles)
      .where(eq(profiles.id, data.recipientId));

    const recipient = recipientRows[0];
    if (recipient?.email) {
      const emailResult = await sendContactEmail({
        toEmail: recipient.email,
        toName: recipient.contactLabel || recipient.username,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        subject: data.subject || `New message via website – ${data.recipientLabel}`,
        message: data.message,
        recipientLabel: data.recipientLabel,
      });

      if (emailResult.error) {
        console.error('Email delivery failed (message was still saved):', emailResult.error);
        return { error: 'Your message was saved but we could not send the email notification. The team will still see your message.' };
      }
    }

    return { error: null };
  } catch (err) {
    console.error('submitContactMessage failed:', err);
    return { error: 'Failed to send message. Please try again later.' };
  }
}
