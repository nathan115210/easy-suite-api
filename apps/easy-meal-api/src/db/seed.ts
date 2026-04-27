import { db, pool } from './index';
import { seedMeals } from './schema/meals.seed';

async function main() {
  const result = await seedMeals(db);

  console.info(`Seeded meals: inserted=${result.inserted}, skipped=${result.skipped}`);
}

try {
  await main();
} finally {
  await pool.end();
}
