import { sql, type InferSelectModel, type Column, type SQL } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import { getTableName as getDrizzleTableName } from 'drizzle-orm/table';
import { db } from '../db';

export type SearchMode = 'any' | 'all' | 'phrase' | 'web';

export const allowedSearchModes: SearchMode[] = ['any', 'all', 'phrase', 'web'];

/**
 * Controls how the keyword string is interpreted in full-text search.
 *
 * - `any`    OR logic — matches rows containing at least one keyword
 * - `all`    AND logic — matches rows containing all keywords in any order
 * - `phrase` Exact phrase — keywords must appear consecutively in order
 * - `web`    Natural language — supports quoted phrases, `-` for negation, and OR
 */

export function searchByKeywordCondition(
  keyword: string,
  searchColumn: Column,
  mode: SearchMode = 'web',
): SQL | undefined {
  const normalized = keyword.replace(/\+/g, ' ').trim();

  if (!normalized) {
    return undefined;
  }

  const searchVector = sql`to_tsvector('english', ${searchColumn})`;

  switch (mode) {
    case 'any': {
      const tsQuery = normalized.split(/\s+/).filter(Boolean).join(' | ');

      return tsQuery ? sql`${searchVector} @@ to_tsquery('english', ${tsQuery})` : undefined;
    }

    case 'all':
      return sql`${searchVector} @@ plainto_tsquery('english', ${normalized})`;

    case 'phrase':
      return sql`${searchVector} @@ phraseto_tsquery('english', ${normalized})`;

    case 'web':
    default:
      return sql`${searchVector} @@ websearch_to_tsquery('english', ${normalized})`;
  }
}

/**
 * Runs a PostgreSQL full-text search against a single column of any table.
 *
 * @param keyword      - The search string from the user (Express decodes `+` as space automatically)
 * @param searchColumn - The drizzle column to index with `to_tsvector`, e.g. `mealsTable.title`
 * @param table        - The drizzle table to query
 * @param mode         - Search mode controlling the tsquery variant used (default: `web`)
 * @returns Matching rows typed to the given table's select shape
 */
export async function searchByKeyword<TTable extends AnyPgTable>(
  keyword: string,
  searchColumn: Column,
  table: TTable,
  mode: SearchMode = 'web',
): Promise<InferSelectModel<TTable>[]> {
  try {
    const whereClause = searchByKeywordCondition(keyword, searchColumn, mode);

    if (!whereClause) {
      return [];
    }

    // Cast needed: drizzle's .from() has a conditional type that can't resolve against a generic TTable
    return (await db
      .select()
      .from(table as AnyPgTable)
      .where(whereClause)) as InferSelectModel<TTable>[];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to search ${getDrizzleTableName(table)} in database: ${message}`, {
      cause: error,
    });
  }
}
