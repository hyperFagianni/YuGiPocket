import { RARITY_ORDER } from '@/data/rarity';
import type { RarityTier, TradeCardRef, TradeOfferPayload } from '@/types/domain';

const TRADE_CODE_PREFIX = 'YGP1:';

export function encodeTradeOffer(payload: TradeOfferPayload): string {
  return TRADE_CODE_PREFIX + JSON.stringify(payload);
}

/**
 * Parses and validates a trade code (from a scanned QR or a pasted string).
 * Returns null for anything malformed rather than throwing, since this is
 * meant to be called directly on untrusted user/scanner input.
 */
export function decodeTradeOffer(code: string): TradeOfferPayload | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith(TRADE_CODE_PREFIX)) {
    return null;
  }
  const jsonPart = trimmed.slice(TRADE_CODE_PREFIX.length);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonPart);
  } catch {
    return null;
  }
  return isValidTradeOfferPayload(parsed) ? parsed : null;
}

function isValidRarity(value: unknown): value is RarityTier {
  return typeof value === 'string' && (RARITY_ORDER as string[]).includes(value);
}

function isValidCardRef(value: unknown): value is TradeCardRef {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const ref = value as Record<string, unknown>;
  return (
    typeof ref.cardId === 'number' &&
    typeof ref.cardName === 'string' &&
    typeof ref.setId === 'string' &&
    isValidRarity(ref.rarity)
  );
}

function isValidTradeOfferPayload(value: unknown): value is TradeOfferPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const payload = value as Record<string, unknown>;
  if (payload.v !== 1) {
    return false;
  }
  if (!isValidCardRef(payload.offer)) {
    return false;
  }
  if (payload.request !== null && !isValidCardRef(payload.request)) {
    return false;
  }
  if (typeof payload.note !== 'string') {
    return false;
  }
  if (typeof payload.createdAt !== 'number') {
    return false;
  }
  return true;
}
