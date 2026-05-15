import { and, eq, gt, lt } from 'drizzle-orm';
import { userSessionsTable } from './schema';
import { db } from './index';

type DbExecutor = Pick<typeof db, 'insert'>;

type CreatedSession = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
};

export const sessionRepository = {
  async createSession(
    sessionData: { userId: string; expiresAt: Date },
    executor: DbExecutor = db,
  ): Promise<CreatedSession> {
    const { userId, expiresAt } = sessionData;
    const [createdSession] = await executor
      .insert(userSessionsTable)
      .values({
        userId,
        expiresAt,
      })
      .returning({
        id: userSessionsTable.id,
        userId: userSessionsTable.userId,
        expiresAt: userSessionsTable.expiresAt,
        createdAt: userSessionsTable.createdAt,
      });

    if (!createdSession) {
      throw new Error('Failed to create session');
    }

    return createdSession;
  },

  async findValidSessionById(sessionId: string) {
    const [validSession] = await db
      .select()
      .from(userSessionsTable)
      .where(and(eq(userSessionsTable.id, sessionId), gt(userSessionsTable.expiresAt, new Date())))
      .limit(1);
    return validSession ?? null;
  },
  async deleteById(sessionId: string) {
    await db.delete(userSessionsTable).where(eq(userSessionsTable.id, sessionId));
  },

  async deleteAllByUserId(userId: string) {
    await db.delete(userSessionsTable).where(eq(userSessionsTable.userId, userId));
  },

  async deleteExpiredSessions(now: Date = new Date()): Promise<number> {
    const deletedSessions = await db
      .delete(userSessionsTable)
      .where(lt(userSessionsTable.expiresAt, now))
      .returning({ id: userSessionsTable.id });

    return deletedSessions.length;
  },
};
