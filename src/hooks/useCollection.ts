import { useCallback, useEffect, useState } from 'react';

import { getCollectionView } from '@/db/repositories/collectionRepo';
import type { CollectionFilters } from '@/db/repositories/collectionRepo';
import type { CollectionCardView } from '@/types/domain';

export function useCollection(filters: CollectionFilters) {
  const [items, setItems] = useState<CollectionCardView[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCollectionView(filters);
      setItems(data);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.setId, filters.rarity, filters.onlyOwned]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, loading, refetch };
}
