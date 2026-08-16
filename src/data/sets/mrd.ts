import type { SetConfig } from '@/types/domain';

export const mrdConfig: SetConfig = {
  setId: 'mrd',
  setCode: 'MRD',
  ygoSetName: 'Metal Raiders',
  displayName: 'Metal Raiders (2002)',
  releaseYear: 2002,
  cardsPerPack: 9,
  hitSlots: 1,
  rarityTiers: ['common', 'rare', 'superRare', 'ultraRare', 'secretRare'],
  hitSlotOdds: {
    rare: 0.6,
    superRare: 0.28,
    ultraRare: 0.08,
    secretRare: 0.04,
  },
  oddsConfidence: 'structure-confirmed-odds-uncertain',
  sourceNote:
    'Konami non ha mai pubblicato pull rate ufficiali per questo set. Struttura busta (9 carte, 1 slot garantito Rara-o-superiore, coerente con l\'era di Legend of Blue Eyes White Dragon) e composizione del set (100 Comuni, 22 Rare, 10 Super Rare, 10 Ultra Rare, 2 Rare Segrete su 144 carte) sono documentate. L\'Ultra Rara (~1/12 buste) usa la stessa stima community citata per LOB, coerente con l\'epoca. La Rara Segreta è il dato più incerto di questo set: PSA (psacard.com, articolo "PSA Set Registry: Metal Raiders") dichiara esplicitamente che non esiste un tasso di inserimento verificato, riportando solo un folklore da collezionisti secondo cui circa 2 box su 3 (~66%) contengono almeno una Rara Segreta; il valore per-busta qui (~4%) è una conversione matematica approssimativa di quella stima di box, non un dato verificato in alcuna fonte. La suddivisione tra Rara e Super Rara è derivata proporzionalmente dal numero di carte di ciascuna rarità nel set reale. Alcune Comuni esistono anche in varianti "Short Print" / "Super Short Print": l\'app le tratta come Comuni normali.',
};
