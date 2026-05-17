import type { db } from '@/db/index';

export type DbExecutor = Pick<typeof db, 'insert'>;
