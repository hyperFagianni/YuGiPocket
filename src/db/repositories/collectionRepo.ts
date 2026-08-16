import { getDb } from '@/db/client';
import type { CollectionCardView, RarityTier } from '@/types/domain';

export async function addCardToCollection(
  cardId: number,
  setId: string,
  rarity: RarityTier,
  obtainedAt: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO collection (card_id, set_id, rarity, quantity, first_obtained_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(card_id, set_id) DO UPDATE SET quantity = quantity + 1`,
    cardId,
    setId,
    rarity,
    obtainedAt,
  );
}

/** Decrements ownership by one (floor 0) — used when a card is given away in a trade. */
export async function removeOneFromCollection(cardId: number, setId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE collection SET quantity = MAX(0, quantity - 1) WHERE card_id = ? AND set_id = ?',
    cardId,
    setId,
  );
}

export async function getOwnedQuantity(cardId: number, setId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ quantity: number }>(
    'SELECT quantity FROM collection WHERE card_id = ? AND set_id = ?',
    cardId,
    setId,
  );
  return row?.quantity ?? 0;
}

export interface CollectionFilters {
  setId?: string;
  rarity?: RarityTier;
  onlyOwned?: boolean;
}

/**
 * Every card the collection screen needs to render: joins cards + card_sets (so cards
 * never pulled still show up with quantity 0, for the completion checklist) with
 * whatever the player actually owns.
 */
export async function getCollectionView(filters: CollectionFilters = {}): Promise<CollectionCardView[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (filters.setId) {
    conditions.push('card_sets.set_id = ?');
    params.push(filters.setId);
  }
  if (filters.rarity) {
    conditions.push('card_sets.rarity = ?');
    params.push(filters.rarity);
  }
  if (filters.onlyOwned) {
    conditions.push('COALESCE(collection.quantity, 0) > 0');
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await db.getAllAsync<{
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
    set_id: string;
    rarity: RarityTier;
    quantity: number | null;
    first_obtained_at: number | null;
  }>(
    `SELECT cards.*, card_sets.set_id as set_id, card_sets.rarity as rarity,
            collection.quantity as quantity, collection.first_obtained_at as first_obtained_at
     FROM card_sets
     JOIN cards ON cards.id = card_sets.card_id
     LEFT JOIN collection ON collection.card_id = card_sets.card_id AND collection.set_id = card_sets.set_id
     ${whereClause}
     ORDER BY cards.name ASC`,
    ...params,
  );

  return rows.map((row) => ({
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
    setId: row.set_id,
    rarity: row.rarity,
    quantity: row.quantity ?? 0,
    firstObtainedAt: row.first_obtained_at,
  }));
}
