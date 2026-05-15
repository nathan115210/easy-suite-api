import { eq } from 'drizzle-orm';
import { usersTable } from './schema/user.table';
import { db } from './index';

type DbExecutor = Pick<typeof db, 'insert'>;

type CreatedUser = {
  id: string;
  username: string;
  email: string;
};

export const userRepository = {
  async findByEmail(email: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return user ?? null;
  },
  async findByUsername(username: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    return user ?? null;
  },

  async findById(id: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return user ?? null;
  },

  async create(
    userData: Omit<typeof usersTable.$inferInsert, 'id'>,
    executor: DbExecutor = db,
  ): Promise<CreatedUser> {
    const [createdUser] = await executor.insert(usersTable).values(userData).returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
    });

    if (!createdUser) {
      throw new Error('Failed to create user');
    }

    return createdUser;
  },
};
