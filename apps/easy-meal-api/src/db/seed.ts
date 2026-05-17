import { db, pool } from '@/db/index';
import { seedMeals } from '@/db/schema/meals.seed';

async function main() {
  const result = await seedMeals(db);

  console.info(`Seeded meals: inserted=${result.inserted}, skipped=${result.skipped}`);
}

try {
  await main();
} finally {
  await pool.end();
}
