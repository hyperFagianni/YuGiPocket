import { decodeTradeOffer, encodeTradeOffer } from '@/services/tradeCode';
import type { TradeOfferPayload } from '@/types/domain';

const samplePayload: TradeOfferPayload = {
  v: 1,
  offer: { cardId: 89631139, cardName: 'Blue-Eyes White Dragon', setId: 'lob', rarity: 'ultraRare' },
  request: { cardId: 44519536, cardName: 'Dark Magician', setId: 'lob', rarity: 'ultraRare' },
  note: 'Cerco anche altre Ultra Rare di LOB',
  createdAt: 1_700_000_000_000,
};

describe('encodeTradeOffer / decodeTradeOffer', () => {
  it('round-trips a full offer with a requested card', () => {
    const code = encodeTradeOffer(samplePayload);
    expect(decodeTradeOffer(code)).toEqual(samplePayload);
  });

  it('round-trips an offer with no specific card requested', () => {
    const payload: TradeOfferPayload = { ...samplePayload, request: null };
    const code = encodeTradeOffer(payload);
    expect(decodeTradeOffer(code)).toEqual(payload);
  });

  it('tolerates surrounding whitespace from copy/paste', () => {
    const code = `  ${encodeTradeOffer(samplePayload)}  \n`;
    expect(decodeTradeOffer(code)).toEqual(samplePayload);
  });

  it('rejects a code missing the expected prefix', () => {
    expect(decodeTradeOffer(JSON.stringify(samplePayload))).toBeNull();
  });

  it('rejects malformed JSON after a valid prefix', () => {
    expect(decodeTradeOffer('YGP1:{not-json')).toBeNull();
  });

  it('rejects a payload with an invalid rarity', () => {
    const bad = { ...samplePayload, offer: { ...samplePayload.offer, rarity: 'mythic' } };
    expect(decodeTradeOffer('YGP1:' + JSON.stringify(bad))).toBeNull();
  });

  it('rejects a payload missing required fields', () => {
    const bad = { v: 1, offer: { cardId: 1 } };
    expect(decodeTradeOffer('YGP1:' + JSON.stringify(bad))).toBeNull();
  });

  it('rejects an unrelated arbitrary string', () => {
    expect(decodeTradeOffer('this is not a trade code')).toBeNull();
  });
});
