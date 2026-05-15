import type { db } from './index';

export type DbExecutor = Pick<typeof db, 'insert'>;
