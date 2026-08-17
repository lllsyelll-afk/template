import { Job } from "../types";
import { createEmailAdapter } from "../../email";

export interface EmailJobData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, unknown>;
}

export async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { to, subject, html, text } = job.data;
  if (!to || !subject) {
    throw new Error("Invalid email job data: 'to' and 'subject' are required");
  }

  const emailAdapter = createEmailAdapter();
  await emailAdapter.sendEmail(
    to,
    subject,
    html || text || subject,
  );

  console.log(`[queue:email] Sent email to ${to} (Subject: "${subject}")`);
}
