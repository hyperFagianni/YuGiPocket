import { getDb } from '@/db/client';
import type { CardRecord, CardSetEntry, RarityTier } from '@/types/domain';
import type { CardPoolByRarity } from '@/services/packOpening';

interface CardRow {
  id: number;
  name: string;
  type: string;
  frame_type: string;
  race: string | null;
  attribute: string | null;
  level_or_rank: number | null;
  atk: number | null;
  def: number | null;
  description: string;
  image_url: string;
  image_url_small: string;
}

function mapRowToCard(row: CardRow): CardRecord {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    frameType: row.frame_type,
    race: row.race,
    attribute: row.attribute,
    levelOrRank: row.level_or_rank,
    atk: row.atk,
    def: row.def,
    description: row.description,
    imageUrl: row.image_url,
    imageUrlSmall: row.image_url_small,
  };
}

export async function upsertCards(cards: CardRecord[]): Promise<void> {
  if (cards.length === 0) return;
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const card of cards) {
      await db.runAsync(
        `INSERT INTO cards (id, name, type, frame_type, race, attribute, level_or_rank, atk, def, description, image_url, image_url_small)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name, type = excluded.type, frame_type = excluded.frame_type,
           race = excluded.race, attribute = excluded.attribute, level_or_rank = excluded.level_or_rank,
           atk = excluded.atk, def = excluded.def, description = excluded.description,
           image_url = excluded.image_url, image_url_small = excluded.image_url_small`,
        card.id,
        card.name,
        card.type,
        card.frameType,
        card.race,
        card.attribute,
        card.levelOrRank,
        card.atk,
        card.def,
        card.description,
        card.imageUrl,
        card.imageUrlSmall,
      );
    }
  });
}

export async function upsertCardSetEntries(entries: CardSetEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const entry of entries) {
      await db.runAsync(
        'INSERT OR IGNORE INTO card_sets (card_id, set_id, rarity) VALUES (?, ?, ?)',
        entry.cardId,
        entry.setId,
        entry.rarity,
      );
    }
  });
}

/** Replaces every card_sets row for a given set — used when re-seeding after a data refresh. */
export async function clearCardSetEntriesForSet(setId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM card_sets WHERE set_id = ?', setId);
}

export async function getCardById(cardId: number): Promise<CardRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CardRow>('SELECT * FROM cards WHERE id = ?', cardId);
  return row ? mapRowToCard(row) : null;
}

export async function getCardsByIds(cardIds: number[]): Promise<Map<number, CardRecord>> {
  if (cardIds.length === 0) return new Map();
  const db = await getDb();
  const placeholders = cardIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<CardRow>(`SELECT * FROM cards WHERE id IN (${placeholders})`, ...cardIds);
  return new Map(rows.map((row) => [row.id, mapRowToCard(row)]));
}

/** Card id pools grouped by rarity for a set — the input `openPack` needs to draw cards. */
export async function getCardPoolByRarityForSet(setId: string): Promise<CardPoolByRarity> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ card_id: number; rarity: RarityTier }>(
    'SELECT card_id, rarity FROM card_sets WHERE set_id = ?',
    setId,
  );
  const pool: CardPoolByRarity = {};
  for (const row of rows) {
    (pool[row.rarity] ??= []).push(row.card_id);
  }
  return pool;
}

export interface SetCardWithRarity {
  card: CardRecord;
  rarity: RarityTier;
}

/** Every card that belongs to a set, with its rarity in that set — the checklist source of truth. */
export async function getCardsForSet(setId: string): Promise<SetCardWithRarity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CardRow & { rarity: RarityTier }>(
    `SELECT cards.*, card_sets.rarity as rarity
     FROM card_sets
     JOIN cards ON cards.id = card_sets.card_id
     WHERE card_sets.set_id = ?
     ORDER BY cards.name ASC`,
    setId,
  );
  return rows.map((row) => ({ card: mapRowToCard(row), rarity: row.rarity }));
}

export async function countCardsForSet(setId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM card_sets WHERE set_id = ?',
    setId,
  );
  return row?.count ?? 0;
}
