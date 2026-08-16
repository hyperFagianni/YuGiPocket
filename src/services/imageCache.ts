import { Directory, File, Paths } from 'expo-file-system';

const cardImagesDir = new Directory(Paths.document, 'card-images');

function ensureCardImagesDir(): void {
  if (!cardImagesDir.exists) {
    cardImagesDir.create({ intermediates: true, idempotent: true });
  }
}

/** Returns the local file uri for a card image if it's already cached, without touching the network. */
export function getCachedCardImageUri(cardId: number): string | null {
  const file = new File(cardImagesDir, `${cardId}.jpg`);
  return file.exists ? file.uri : null;
}

/**
 * Downloads a card image exactly once and returns its local file uri from then on.
 * YGOPRODeck explicitly forbids repeatedly hotlinking their CDN — every card image
 * must be persisted locally the first time it's needed and served from disk after that.
 */
export async function ensureCardImageCached(cardId: number, remoteUrl: string): Promise<string> {
  ensureCardImagesDir();
  const file = new File(cardImagesDir, `${cardId}.jpg`);
  if (file.exists) {
    return file.uri;
  }
  const downloaded = await File.downloadFileAsync(remoteUrl, file, { idempotent: true });
  return downloaded.uri;
}
