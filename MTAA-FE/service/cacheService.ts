// service/cacheService.ts

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export function useCachedData<T>(
  cacheKey: string,
  fetcher: () => Promise<T[]>
): { data: T[]; loading: boolean; offline: boolean; error?: any } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<any>();

  useEffect(() => {
    let active = true;
    // Sledujeme zmenu konektivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(!state.isConnected);
    });

    const load = async () => {
      setLoading(true);
      try {
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          // Online: fetch z API, uložiť do cache
          const items = await fetcher();
          if (!active) return;
          setData(items);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(items));
        } else {
          // Offline: načítať z cache
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) setData(JSON.parse(cached));
        }
      } catch (err) {
        setError(err);
        // ak fetch padne, skúsi cache
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) setData(JSON.parse(cached));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [cacheKey, fetcher]);

  return { data, loading, offline, error };
}


export async function getCachedItemById<T>(
  cacheKey: string,
  id: string | number,
  idField: keyof T
): Promise<T | null> {
  const json = await AsyncStorage.getItem(cacheKey);
  if (!json) return null;
  const items: T[] = JSON.parse(json);
  const found = items.find(item => String(item[idField]) === String(id));
  return found || null;
}
