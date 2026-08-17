export type RarityTier = 'common' | 'rare' | 'superRare' | 'ultraRare' | 'secretRare';

export type RarityWeights = Partial<Record<RarityTier, number>>;

export type OddsConfidence = 'structure-confirmed-odds-estimated' | 'structure-confirmed-odds-uncertain';

export interface SetConfig {
  /** Internal id used everywhere in the app (db rows, routes, config lookups). */
  setId: string;
  /** YGOPRODeck set_code prefix, e.g. "LOB". Used for display only. */
  setCode: string;
  /** Exact `set_name` as returned by YGOPRODeck's card_sets entries — used to match cards to this set. */
  ygoSetName: string;
  displayName: string;
  releaseYear: number;
  cardsPerPack: number;
  /** Number of slots per pack guaranteed to be rare-or-better (drawn from hitSlotOdds instead of always common). */
  hitSlots: number;
  /** Rarity tiers that exist in this set, ordered from most common to rarest. */
  rarityTiers: RarityTier[];
  /** Probability distribution across non-common tiers for a single guaranteed "hit" slot. Must sum to ~1. */
  hitSlotOdds: RarityWeights;
  oddsConfidence: OddsConfidence;
  /** Mandatory human-readable disclosure of where the odds come from and how certain they are. */
  sourceNote: string;
  /** Optional note about real cards from this set that are deliberately excluded from the simulation. */
  excludedCardsNote?: string;
}

export interface CardRecord {
  id: number;
  name: string;
  type: string;
  frameType: string;
  race: string | null;
  attribute: string | null;
  levelOrRank: number | null;
  atk: number | null;
  def: number | null;
  description: string;
  imageUrl: string;
  imageUrlSmall: string;
}

export interface CardSetEntry {
  cardId: number;
  setId: string;
  rarity: RarityTier;
}

export interface CollectionEntry {
  cardId: number;
  setId: string;
  rarity: RarityTier;
  quantity: number;
  firstObtainedAt: number;
}

export interface CollectionCardView extends CardRecord {
  setId: string;
  rarity: RarityTier;
  quantity: number;
  firstObtainedAt: number | null;
}

export interface DrawnCard {
  cardId: number;
  rarity: RarityTier;
}

export interface PulledCard {
  card: CardRecord;
  setId: string;
  rarity: RarityTier;
}

export interface TradeCardRef {
  cardId: number;
  cardName: string;
  setId: string;
  rarity: RarityTier;
}

export interface TradeOfferPayload {
  v: 2;
  /** Carte cedute dal proponente, in presenza — una o più, l'altra carta si negozia di persona. */
  offer: TradeCardRef[];
  note: string;
  createdAt: number;
}

/** Riferimento a una carta richiesta in un annuncio della bacheca online: `cardId`/`rarity` nulli
 * significano "qualsiasi carta di questo set", non necessariamente una specifica. */
export interface TradeListingCardRef {
  cardId: number | null;
  cardName: string | null;
  setId: string;
  rarity: RarityTier | null;
}

export type TradeListingStatus = 'open' | 'accepted' | 'completed' | 'cancelled';

export interface TradeListing {
  id: string;
  ownerId: string;
  ownerNickname: string;
  status: TradeListingStatus;
  offeredCards: TradeCardRef[];
  requestedCards: TradeListingCardRef[];
  counterCards: TradeCardRef[];
  acceptedBy: string | null;
  confirmedByOwner: boolean;
  confirmedByAccepter: boolean;
  note: string;
  createdAt: number;
}
