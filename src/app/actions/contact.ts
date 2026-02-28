'use server';

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db';
import { contactMessages } from '@/db/schema';

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
    return { error: null };
  } catch (err) {
    console.error('submitContactMessage failed:', err);
    return { error: 'Failed to send message. Please try again later.' };
  }
}
