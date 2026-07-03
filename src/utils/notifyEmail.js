import { logActivity } from '@/utils/activityLogger';

/**
 * Simulated email notification for demo purposes — no real email is sent.
 * Records the "send" as an activity_log row so it appears in project history,
 * and returns a small descriptor the caller can echo back to the UI to trigger
 * a toast.
 */
export async function simulateEmailNotification(projectId, toEmail, subject, actorName, actorRole) {
  await logActivity(
    projectId,
    actorName,
    actorRole,
    'email_notification',
    `Simulated email to ${toEmail}: ${subject}`,
  );
  return { success: true, to: toEmail, subject };
}
