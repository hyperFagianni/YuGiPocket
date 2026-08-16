import type { SetConfig } from '@/types/domain';

export const rotdConfig: SetConfig = {
  setId: 'rotd',
  setCode: 'ROTD',
  ygoSetName: 'Rise of the Duelist',
  displayName: 'Rise of the Duelist (2020)',
  releaseYear: 2020,
  cardsPerPack: 9,
  hitSlots: 1,
  // Konami discontinued the plain "Rare" tier starting with Eternity Code (May 2020),
  // just before this set — Super Rare became the new floor "hit" rarity.
  rarityTiers: ['common', 'superRare', 'ultraRare', 'secretRare'],
  hitSlotOdds: {
    superRare: 0.75,
    ultraRare: 0.167,
    secretRare: 0.083,
  },
  oddsConfidence: 'structure-confirmed-odds-uncertain',
  sourceNote:
    'Konami non ha mai pubblicato pull rate ufficiali per questo set. Struttura busta (9 carte/busta, 24 buste/box, 1 slot garantito Super Rara-o-superiore) e composizione (50 Comuni, 26 Super Rare, 14 Ultra Rare, 10 Rare Segrete su 100 carte) sono documentate (Yugipedia, listati retailer). A partire da Eternity Code (poco prima di questo set) Konami ha eliminato la rarità "Rara" standard, sostituita da Super Rara come nuova rarità minima garantita nello slot "hit" — per questo motivo il set non ha carte Rare comuni. Le percentuali riportate (~75% Super Rara, ~16.7% Ultra Rara, ~8.3% Rara Segreta nello slot garantito) sono una stima generica "epoca moderna" raccolta da fonti community (tcgzen.com/pack-odds) e NON sono verificate come specifiche di questo set: trattale con cautela, sono il dato meno solido tra i tre set inclusi nell\'app.',
  excludedCardsNote:
    'Questo set include anche 5 carte in variante "Starlight Rare" (rarità premium introdotta proprio con questo set). Per 4 di esse esiste anche una stampa a rarità inferiore (Super Rara, Ultra Rara o Rara Segreta), inclusa nella simulazione; 1 carta esiste invece solo in versione Starlight Rare e non è ottenibile in questa app, perché non esiste una stima community affidabile del suo tasso di estrazione reale e inventare un numero sarebbe fuorviante.',
};
