import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { usersTable } from './schema/user.table';

const db = drizzle(process.env.DATABASE_URL!);

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

  async create(userData: Omit<typeof usersTable.$inferInsert, 'id'>): Promise<CreatedUser> {
    const [createdUser] = await db.insert(usersTable).values(userData).returning({
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
