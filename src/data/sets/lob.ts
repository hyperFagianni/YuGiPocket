import type { SetConfig } from '@/types/domain';

export const lobConfig: SetConfig = {
  setId: 'lob',
  setCode: 'LOB',
  ygoSetName: 'Legend of Blue Eyes White Dragon',
  displayName: 'Legend of Blue Eyes White Dragon (2002)',
  releaseYear: 2002,
  cardsPerPack: 9,
  hitSlots: 1,
  rarityTiers: ['common', 'rare', 'superRare', 'ultraRare', 'secretRare'],
  hitSlotOdds: {
    rare: 0.61,
    superRare: 0.28,
    ultraRare: 0.08,
    secretRare: 0.03,
  },
  oddsConfidence: 'structure-confirmed-odds-estimated',
  sourceNote:
    'Konami non ha mai pubblicato pull rate ufficiali per questo set. La struttura della busta (9 carte, di cui 1 slot garantito Rara-o-superiore, come riportato da ygoprodeck.com/article/set-theory-legend-of-blue-eyes-white-dragon-8227) e la composizione del set (82 Comuni, 22 Rare, 10 Super Rare, 10 Ultra Rare, 2 Rare Segrete su 126 carte) sono documentate. La probabilità di Ultra Rara (~1/12 buste) e Rara Segreta (~1/31, arrotondata) derivano da stime della community (Yu-Gi-Oh Fandom Wiki, thread storici sui "pull ratios"): fonti più datate citavano invece 1/24 per le Ultra Rare, quindi trattale come stime soggette a incertezza e non come dati verificati. La suddivisione tra Rara e Super Rara nello slot garantito è stata derivata in proporzione al numero di carte di ciascuna rarità nel set reale, non da una fonte diretta sulle percentuali. Alcune Comuni di questo set esistono anche in varianti "Short Print" / "Super Short Print" (tirature ridotte, un vezzo dei set di questa epoca): l\'app le tratta come Comuni normali ai fini della simulazione.',
};
