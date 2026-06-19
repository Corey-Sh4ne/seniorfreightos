'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { query } from '@/db/index';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';
import { DEFAULT_RATE_CARD } from '@/models/RateCard';
import { INSTALL_TASK_RATES } from '@/utils/pricingEngine';

const JSON_PATH = path.join(process.cwd(), 'src/data/rateCard.json');

async function rateCardTableExists() {
  try {
    const { rows } = await query(
      `SELECT EXISTS(SELECT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'rate_cards')`,
    );
    return rows[0].exists;
  } catch {
    return false;
  }
}

async function readJsonRateCard() {
  try {
    return JSON.parse(await readFile(JSON_PATH, 'utf8'));
  } catch {
    return { ...DEFAULT_RATE_CARD, installTaskRates: { ...INSTALL_TASK_RATES } };
  }
}

async function writeJsonRateCard(data) {
  await mkdir(path.dirname(JSON_PATH), { recursive: true });
  await writeFile(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function loadRateCard() {
  if (await rateCardTableExists()) {
    try {
      const { rows } = await query('SELECT * FROM rate_cards LIMIT 1');
      if (rows.length > 0) {
        const r = rows[0];
        return {
          receivingPerLb:     parseFloat(r.receiving_per_lb),
          storagePerLbPerDay: parseFloat(r.storage_per_lb_per_day),
          freightPerLb:       parseFloat(r.freight_per_lb),
          freightMinimum:     parseFloat(r.freight_minimum),
          fuelSurchargePct:   parseFloat(r.fuel_surcharge_pct),
          rushSurchargePct:   parseFloat(r.rush_surcharge_pct),
          overheadPct:        parseFloat(r.overhead_pct),
          marginPct:          parseFloat(r.margin_pct),
          installTaskRates:   r.install_task_rates ?? { ...INSTALL_TASK_RATES },
        };
      }
    } catch {
      // Column may not exist yet — fall through to JSON
    }
  }
  return readJsonRateCard();
}

export async function saveRateCard(prevState, formData) {
  const { sessionClaims } = await auth();
  if (sessionClaims?.metadata?.role !== 'admin') {
    return { error: 'Unauthorized. Admin role required.' };
  }

  const num = (key) => { const v = parseFloat(formData.get(key)); return isNaN(v) ? null : v; };
  const pct = (key) => { const v = parseFloat(formData.get(key)); return isNaN(v) ? null : v / 100; };

  const rates = {
    receivingPerLb:     num('receivingPerLb'),
    storagePerLbPerDay: num('storagePerLbPerDay'),
    freightPerLb:       num('freightPerLb'),
    freightMinimum:     num('freightMinimum'),
    fuelSurchargePct:   pct('fuelSurchargePct'),
    rushSurchargePct:   pct('rushSurchargePct'),
    overheadPct:        pct('overheadPct'),
    marginPct:          pct('marginPct'),
  };

  const installTaskRates = {};
  for (const key of Object.keys(INSTALL_TASK_RATES)) {
    installTaskRates[key] = num(`install_${key}`);
  }

  for (const [k, v] of Object.entries({ ...rates, ...installTaskRates })) {
    if (v === null || v < 0) {
      return { error: `Invalid value for "${k}". Must be a non-negative number.` };
    }
  }

  const full = { ...rates, installTaskRates };

  if (await rateCardTableExists()) {
    try {
      const existing = await query('SELECT id FROM rate_cards LIMIT 1');
      if (existing.rows.length > 0) {
        await query(
          `UPDATE rate_cards
             SET receiving_per_lb=$1, storage_per_lb_per_day=$2, freight_per_lb=$3,
                 freight_minimum=$4, fuel_surcharge_pct=$5, rush_surcharge_pct=$6,
                 overhead_pct=$7, margin_pct=$8
           WHERE id=$9`,
          [
            rates.receivingPerLb, rates.storagePerLbPerDay, rates.freightPerLb,
            rates.freightMinimum, rates.fuelSurchargePct, rates.rushSurchargePct,
            rates.overheadPct, rates.marginPct, existing.rows[0].id,
          ],
        );
      } else {
        await query(
          `INSERT INTO rate_cards
             (receiving_per_lb, storage_per_lb_per_day, freight_per_lb,
              freight_minimum, fuel_surcharge_pct, rush_surcharge_pct, overhead_pct, margin_pct)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            rates.receivingPerLb, rates.storagePerLbPerDay, rates.freightPerLb,
            rates.freightMinimum, rates.fuelSurchargePct, rates.rushSurchargePct,
            rates.overheadPct, rates.marginPct,
          ],
        );
      }
      await writeJsonRateCard(full);
      revalidatePath('/rate-card');
      return { success: true };
    } catch (err) {
      console.error('DB rate card save failed, falling back to JSON:', err);
    }
  }

  await writeJsonRateCard(full);
  revalidatePath('/rate-card');
  return { success: true };
}
