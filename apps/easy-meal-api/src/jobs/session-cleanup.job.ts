import { logger } from '@easy-suite/utils';
import { env } from '../config/env';
import { sessionRepository } from '../db/session.repository';

let cleanupTimer: NodeJS.Timeout | null = null;

async function runSessionCleanup(): Promise<void> {
  const startedAt = Date.now();

  try {
    const deletedCount = await sessionRepository.deleteExpiredSessions();
    const durationMs = Date.now() - startedAt;

    logger.info(
      { deletedCount, durationMs },
      'Session cleanup completed: expired sessions removed',
    );
  } catch (error) {
    logger.error({ err: error }, 'Session cleanup failed');
  }
}

export function startSessionCleanupJob(): void {
  if (!env.SESSION_CLEANUP_ENABLED) {
    logger.info('Session cleanup job is disabled by configuration');
    return;
  }

  if (cleanupTimer) {
    return;
  }

  void runSessionCleanup();

  cleanupTimer = setInterval(() => {
    void runSessionCleanup();
  }, env.SESSION_CLEANUP_INTERVAL_MS);

  cleanupTimer.unref?.();

  logger.info({ intervalMs: env.SESSION_CLEANUP_INTERVAL_MS }, 'Session cleanup job started');
}

export function stopSessionCleanupJob(): void {
  if (!cleanupTimer) {
    return;
  }

  clearInterval(cleanupTimer);
  cleanupTimer = null;
}
