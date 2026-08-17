import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { ensureAnonymousSession, getLocalNickname } from '@/services/identity';
import { db } from '@/services/firebase';
import type { TradeCardRef, TradeListing, TradeListingCardRef } from '@/types/domain';

function requireDb() {
  if (!db) throw new Error('Bacheca online non configurata su questo build.');
  return db;
}

function toMillis(value: Timestamp | undefined): number {
  return value?.toMillis?.() ?? Date.now();
}

function mapDoc(id: string, data: DocumentData): TradeListing {
  return {
    id,
    ownerId: data.ownerId,
    ownerNickname: data.ownerNickname ?? 'Sconosciuto',
    status: data.status,
    offeredCards: data.offeredCards ?? [],
    requestedCards: data.requestedCards ?? [],
    counterCards: data.counterCards ?? [],
    acceptedBy: data.acceptedBy ?? null,
    confirmedByOwner: Boolean(data.confirmedByOwner),
    confirmedByAccepter: Boolean(data.confirmedByAccepter),
    note: data.note ?? '',
    createdAt: toMillis(data.createdAt),
  };
}

export async function fetchOpenListings(): Promise<TradeListing[]> {
  const database = requireDb();
  const snap = await getDocs(
    query(collection(database, 'listings'), where('status', '==', 'open'), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => mapDoc(d.id, d.data()));
}

export async function fetchMyListings(): Promise<TradeListing[]> {
  const database = requireDb();
  const userId = await ensureAnonymousSession();
  const [ownedSnap, acceptedSnap] = await Promise.all([
    getDocs(query(collection(database, 'listings'), where('ownerId', '==', userId))),
    getDocs(query(collection(database, 'listings'), where('acceptedBy', '==', userId))),
  ]);
  const byId = new Map<string, TradeListing>();
  for (const d of ownedSnap.docs) byId.set(d.id, mapDoc(d.id, d.data()));
  for (const d of acceptedSnap.docs) byId.set(d.id, mapDoc(d.id, d.data()));
  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchListingById(id: string): Promise<TradeListing | null> {
  const database = requireDb();
  const snap = await getDoc(doc(database, 'listings', id));
  return snap.exists() ? mapDoc(snap.id, snap.data()) : null;
}

export async function createListing(args: {
  offeredCards: TradeCardRef[];
  requestedCards: TradeListingCardRef[];
  note: string;
}): Promise<string> {
  const database = requireDb();
  const ownerId = await ensureAnonymousSession();
  const ownerNickname = (await getLocalNickname()) ?? 'Sconosciuto';

  const ref = await addDoc(collection(database, 'listings'), {
    ownerId,
    ownerNickname,
    status: 'open',
    offeredCards: args.offeredCards,
    requestedCards: args.requestedCards,
    counterCards: [],
    acceptedBy: null,
    acceptedByNickname: null,
    confirmedByOwner: false,
    confirmedByAccepter: false,
    note: args.note.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function acceptListing(listingId: string, counterCards: TradeCardRef[]): Promise<void> {
  const database = requireDb();
  const userId = await ensureAnonymousSession();
  const nickname = (await getLocalNickname()) ?? 'Sconosciuto';
  const ref = doc(database, 'listings', listingId);

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Annuncio non trovato.');
    const data = snap.data();
    if (data.status !== 'open') throw new Error('Annuncio non più disponibile.');
    if (data.ownerId === userId) throw new Error('Non puoi accettare il tuo stesso annuncio.');

    tx.update(ref, {
      status: 'accepted',
      acceptedBy: userId,
      acceptedByNickname: nickname,
      counterCards: counterCards.map((c) => ({ cardId: c.cardId, cardName: c.cardName, setId: c.setId, rarity: c.rarity })),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function confirmCompletion(listingId: string): Promise<void> {
  const database = requireDb();
  const userId = await ensureAnonymousSession();
  const ref = doc(database, 'listings', listingId);

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Annuncio non trovato.');
    const data = snap.data();
    if (data.status !== 'accepted') throw new Error('Annuncio non nello stato corretto.');

    const isOwner = data.ownerId === userId;
    const isAccepter = data.acceptedBy === userId;
    if (!isOwner && !isAccepter) throw new Error('Non fai parte di questo scambio.');

    const confirmedByOwner = isOwner ? true : Boolean(data.confirmedByOwner);
    const confirmedByAccepter = isAccepter ? true : Boolean(data.confirmedByAccepter);

    tx.update(ref, {
      confirmedByOwner,
      confirmedByAccepter,
      status: confirmedByOwner && confirmedByAccepter ? 'completed' : 'accepted',
      updatedAt: serverTimestamp(),
    });
  });
}

export async function cancelListing(listingId: string): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'listings', listingId), { status: 'cancelled', updatedAt: serverTimestamp() });
}

export function subscribeToListings(onChange: () => void): () => void {
  if (!db) return () => {};
  const unsubscribe = onSnapshot(query(collection(db, 'listings'), where('status', '==', 'open')), () => onChange());
  return unsubscribe;
}
