import { normalizeRarity } from '@/data/rarity';
import type { CardRecord, CardSetEntry, SetConfig } from '@/types/domain';

const API_BASE = 'https://db.ygoprodeck.com/api/v7';

interface YgoApiCardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
}

interface YgoApiCardImage {
  id: number;
  image_url: string;
  image_url_small: string;
}

interface YgoApiCard {
  id: number;
  name: string;
  type: string;
  frameType: string;
  race?: string;
  attribute?: string;
  level?: number;
  atk?: number;
  def?: number;
  desc: string;
  card_images: YgoApiCardImage[];
  card_sets?: YgoApiCardSet[];
}

interface YgoApiResponse {
  data?: YgoApiCard[];
  error?: string;
}

export class YgoprodeckError extends Error {}

/** Used to detect upstream data changes; see docs/README notes on when we act on it. */
export async function fetchDbVersion(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/checkDBVer.php`);
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ database_version?: string }>;
    return json[0]?.database_version ?? null;
  } catch {
    return null;
  }
}

export interface FetchedSetData {
  cards: CardRecord[];
  cardSetEntries: CardSetEntry[];
}

/**
 * Fetches every card ever printed in `config.ygoSetName` and normalizes it into our
 * local schema. Deliberately scoped to a single set (via the `cardset` query param)
 * instead of the entire YGOPRODeck database (13000+ cards): this app only ever needs
 * cards belonging to its configured sets, so downloading everything would just waste
 * the player's mobile data for no benefit.
 */
export async function fetchSetData(config: SetConfig): Promise<FetchedSetData> {
  const url = `${API_BASE}/cardinfo.php?cardset=${encodeURIComponent(config.ygoSetName)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new YgoprodeckError(`YGOPRODeck ha risposto con errore ${res.status} per "${config.displayName}"`);
  }
  const json = (await res.json()) as YgoApiResponse;
  if (json.error || !json.data) {
    throw new YgoprodeckError(json.error ?? `Nessuna carta trovata per il set "${config.displayName}"`);
  }

  const cards: CardRecord[] = [];
  const cardSetEntries: CardSetEntry[] = [];
  const seenEntries = new Set<string>();

  for (const apiCard of json.data) {
    const image = apiCard.card_images?.[0];
    if (!image) continue; // never trust a third-party API to always have every field

    cards.push({
      id: apiCard.id,
      name: apiCard.name,
      type: apiCard.type,
      frameType: apiCard.frameType,
      race: apiCard.race ?? null,
      attribute: apiCard.attribute ?? null,
      levelOrRank: apiCard.level ?? null,
      atk: apiCard.atk ?? null,
      def: apiCard.def ?? null,
      description: apiCard.desc,
      imageUrl: image.image_url,
      imageUrlSmall: image.image_url_small,
    });

    for (const cardSet of apiCard.card_sets ?? []) {
      if (cardSet.set_name !== config.ygoSetName) continue;
      const rarity = normalizeRarity(cardSet.set_rarity);
      if (!rarity) continue; // e.g. Starlight Rare — deliberately not simulated, see set config sourceNote
      const dedupeKey = `${apiCard.id}:${rarity}`;
      if (seenEntries.has(dedupeKey)) continue; // short-print variants reprint the same card at the same rarity
      seenEntries.add(dedupeKey);
      cardSetEntries.push({ cardId: apiCard.id, setId: config.setId, rarity });
    }
  }

  return { cards, cardSetEntries };
}
