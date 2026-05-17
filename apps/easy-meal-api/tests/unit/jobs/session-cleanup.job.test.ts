const mockEnv = {
  SESSION_CLEANUP_ENABLED: true,
  SESSION_CLEANUP_INTERVAL_MS: 1000,
};

const mockDeleteExpiredSessions = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@/config/env', () => ({
  env: mockEnv,
}));

jest.mock('@/db/session.repository', () => ({
  sessionRepository: {
    deleteExpiredSessions: mockDeleteExpiredSessions,
  },
}));

jest.mock('@easy-suite/utils', () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
  },
}));

import { startSessionCleanupJob, stopSessionCleanupJob } from '@/jobs/session-cleanup.job';

describe('session cleanup job', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockEnv.SESSION_CLEANUP_ENABLED = true;
    mockEnv.SESSION_CLEANUP_INTERVAL_MS = 1000;
    mockDeleteExpiredSessions.mockResolvedValue(2);
  });

  afterEach(() => {
    stopSessionCleanupJob();
    jest.useRealTimers();
  });

  it('runs cleanup immediately on startup and then on interval', async () => {
    startSessionCleanupJob();

    await Promise.resolve();
    expect(mockDeleteExpiredSessions).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(mockDeleteExpiredSessions).toHaveBeenCalledTimes(2);
  });

  it('does not start cleanup when disabled', async () => {
    mockEnv.SESSION_CLEANUP_ENABLED = false;

    startSessionCleanupJob();
    await Promise.resolve();

    expect(mockDeleteExpiredSessions).not.toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith('Session cleanup job is disabled by configuration');
  });

  it('logs and continues when cleanup fails', async () => {
    mockDeleteExpiredSessions.mockRejectedValueOnce(new Error('cleanup failed'));

    startSessionCleanupJob();
    await Promise.resolve();

    expect(mockLoggerError).toHaveBeenCalled();
  });
});
