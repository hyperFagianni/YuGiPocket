# YuGiPocket

Simulatore di apertura buste Yu-Gi-Oh!, gratuito e non monetizzato. Progetto amatoriale, **non affiliato con Konami**
(vedi la schermata Info nell'app).

Realizzato con Expo (managed workflow) + React Native + TypeScript + Expo Router, database locale con
`expo-sqlite`, cache immagini con `expo-file-system`, scambio carte via QR con `expo-camera` /
`react-native-qrcode-svg`.

## Vincoli rispettati

- **Nessun acquisto in-app, nessuna pubblicità, nessun abbonamento.** Nessuna dipendenza è stata aggiunta per
  monetizzazione o tracking pubblicitario (verificabile: `package.json` non contiene SDK di ads/IAP/analytics).
- **Offline-first.** L'unica chiamata di rete è verso l'API pubblica di [YGOPRODeck](https://db.ygoprodeck.com/api-guide/)
  per popolare la cache locale la prima volta che serve un'espansione — non ad ogni apertura busta. Dopo il primo
  download, l'app funziona interamente offline.
- **Immagini mai in hotlink.** Ogni immagine carta viene scaricata una sola volta con `expo-file-system` e salvata
  in `Paths.document/card-images/`; da lì in poi viene sempre mostrato il file locale (vedi `src/services/imageCache.ts`
  e `src/components/CardImage.tsx`), come richiesto dalle policy di YGOPRODeck contro l'hotlink continuo del loro CDN.
- **Nessun pull rate spacciato per ufficiale.** Konami non pubblica percentuali reali; le stime usate sono descritte
  in dettaglio, con fonti, nella schermata Info e in `src/data/sets/*.ts`.

## Avvio in sviluppo

Requisiti: Node.js 20+, un dispositivo con Expo Go (compatibile con Expo SDK 54) oppure un emulatore Android/iOS.

```bash
npm install
npx expo start
```

Scansiona il QR mostrato nel terminale con l'app Expo Go, oppure premi `a` per aprire un emulatore Android già
avviato.

## Verifiche di qualità

```bash
npm run typecheck   # tsc --noEmit, nessun errore
npm test            # Jest: logica di estrazione carte + cooldown 12h + codice di scambio
```

I test in `__tests__/packOpening.test.ts` includono una verifica statistica: su un campione di 200.000 aperture
simulate, la frequenza osservata per ciascuna rarità deve avvicinarsi a `hitSlotOdds` entro una tolleranza del 2%.

## Build per test / pubblicazione

- **Sviluppo locale rapido:** `npx expo start` + Expo Go (vedi sopra).
- **Build di test (consigliata):** [EAS Build](https://docs.expo.dev/build/introduction/) (gratuito, circa 15 build
  Android/mese nel piano free):
  ```bash
  npx eas login
  npx eas build:configure
  npx eas build --platform android --profile preview
  ```
- **Build locale alternativa:** `npx expo prebuild` seguito da build Gradle/Android Studio nella cartella `android/`
  generata.
- **Pubblicazione:** carica l'AAB generato da EAS Build su Google Play Console, in un canale di closed/internal
  testing (obbligatorio anche per account personali) prima di promuovere in produzione.

### Nota nota per chi sviluppa su Windows

Il binario `hermesc.exe` per Windows incluso in questa versione di React Native (0.81.5) ha un bug che rifiuta la
sintassi dei campi privati di classe (`#campo`) usata internamente da React Native stesso (`DOMRectReadOnly.js`),
con errore `private properties are not supported`. Questo blocca **solo** la precompilazione locale del bytecode
Hermes su Windows (`npx expo export`, oppure una build Gradle locale in modalità release). Non è un problema del
codice di questa app: è stato riprodotto isolatamente compilando un file di test minimale con la stessa toolchain.
Non influisce su:
- `npx expo start` + Expo Go (il bundle JS non viene precompilato in bytecode Hermes in questa modalità);
- EAS Build (build nel cloud su worker Linux, con un binario Hermes diverso e funzionante).

Se serve una build di release locale su Windows e si incontra questo errore, usare EAS Build invece di una build
Gradle locale.

## Espansioni incluse e affidabilità dei pull rate

L'app parte con 3 espansioni, ciascuna con una struttura busta verificata (numero di carte, slot garantiti) e
percentuali di rarità stimate dalla community con livelli di affidabilità diversi. Il dettaglio completo, con fonti,
è visibile anche nell'app (tab Info) e nei singoli file di configurazione (`src/data/sets/`).

| Set | Anno | Carte/busta | Struttura busta | Affidabilità odds |
|---|---|---|---|---|
| Legend of Blue Eyes White Dragon (LOB) | 2002 | 9 | Solida (1 slot garantito Rara+) | Stimata, fonti in parziale disaccordo su Ultra Rara (1/12 vs stime storiche 1/24) |
| Metal Raiders (MRD) | 2002 | 9 | Solida (1 slot garantito Rara+) | La meno solida delle tre: PSA dichiara esplicitamente "nessun tasso verificato" per la Rara Segreta |
| Rise of the Duelist (ROTD) | 2020 | 9 | Solida (1 slot garantito Super Rara+, niente "Rara" standard dal 2020) | Stima generica "epoca moderna", non verificata come specifica di questo set |

Nessuna delle percentuali è un dato Konami ufficiale — Konami non ne pubblica. Vanno lette come stime ragionevoli,
non come garanzie.

**Nota su Rise of the Duelist:** il set include 5 carte in variante "Starlight Rare". 4 hanno anche una stampa a
rarità inferiore, inclusa nella simulazione; 1 carta esiste solo in Starlight Rare e **non è ottenibile in questa
app**, perché non esiste una stima community affidabile del suo vero tasso di estrazione — includerla con un numero
inventato sarebbe stato disonesto.

Per aggiungere un'espansione futura basta creare un nuovo file in `src/data/sets/` con la stessa forma (`setId`,
`ygoSetName` esatto come compare su YGOPRODeck, struttura busta, `hitSlotOdds`, `sourceNote`) e registrarlo in
`src/data/sets/index.ts` — i dati delle carte (metadati, rarità, immagini) vengono popolati automaticamente al primo
avvio via API, senza bisogno di compilare a mano liste di carte.

## Limiti noti dello scambio tra amici

Lo scambio è **completamente locale**, senza server né identità condivisa tra dispositivi:

1. Chi propone lo scambio genera un codice/QR (schermata "Crea proposta di scambio") con la carta offerta e,
   opzionalmente, quella richiesta in cambio.
2. L'altra persona scansiona il QR o incolla il codice testuale (schermata "Accetta una proposta"), vede
   un'anteprima e conferma.
3. **Non esiste alcuna verifica reciproca automatica.** Quando l'accettante conferma, il suo dispositivo aggiorna
   subito la propria collezione (aggiunge la carta offerta, rimuove quella eventualmente richiesta). Chi ha
   proposto lo scambio deve poi, separatamente e sul proprio dispositivo, premere "Segna scambio come completato"
   nella schermata dove ha generato il codice, per aggiornare anche la propria collezione allo stesso modo.
4. Se una delle due persone non conferma onestamente (es. accetta la carta ma non segna lo scambio come completato
   dal lato di chi la offre), le due collezioni finiscono disallineate — l'app non ha modo di rilevarlo o
   impedirlo. È un sistema basato sulla fiducia tra amici, non una transazione garantita, ed è dichiarato
   esplicitamente nell'interfaccia della schermata Scambio.
5. Se il codice fa riferimento a una carta di un'espansione non ancora scaricata sul dispositivo che accetta, lo
   scambio viene bloccato con un messaggio esplicito invece di essere accettato "alla cieca".

## Struttura del progetto

```
src/
  app/                  Schermate (Expo Router: file-based routing)
  components/           Componenti UI condivisi (CardImage, RarityBadge, ...)
  constants/             Tema colori/spaziature
  context/               AppDataProvider: inizializzazione DB + seeding al primo avvio
  data/                  Rarità e configurazione delle espansioni (fonti e pull rate)
  db/                    Schema SQLite, client, repository (cards, collection, config)
  hooks/                 useCooldown, useCollection
  services/              Logica pura testabile: apertura buste, cooldown, codice di scambio,
                         fetch/normalizzazione dati YGOPRODeck, cache immagini
  types/                 Tipi di dominio condivisi
__tests__/               Test Jest sulla logica pura (nessuna dipendenza da React Native/SQLite)
```

## Dati che meritano una verifica manuale supplementare

- **Tutti i pull rate numerici** (vedi tabella sopra e i `sourceNote` in-app): sono stime, non dati Konami. In
  particolare l'Ultra Rara di LOB (fonti in disaccordo 1/12 vs 1/24 storico), la Rara Segreta di MRD (PSA dichiara
  esplicitamente nessun dato verificato) e l'intera distribuzione di ROTD (stima generica, non specifica del set).
- La suddivisione tra Rara e Super Rara nello slot garantito di LOB/MRD è stata derivata proporzionalmente al
  numero di carte reali di ciascuna rarità nel set, non da una fonte diretta sulle percentuali — un'approssimazione
  ragionevole ma non una fonte primaria.
