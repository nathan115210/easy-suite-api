import { and, eq, gt } from 'drizzle-orm';
import { userSessionsTable } from './schema';
import { db } from './index';

type CreatedSession = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
};

export const sessionRepository = {
  async createSession(sessionData: { userId: string; expiresAt: Date }): Promise<CreatedSession> {
    const { userId, expiresAt } = sessionData;
    const [createdSession] = await db
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
};
