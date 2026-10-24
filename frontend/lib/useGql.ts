'use client';
import { useCallback, useEffect, useState } from 'react';
import { gql } from './api';

export function useGql<T = any>(query: string, variables: Record<string, unknown> = {}, pollMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(variables);

  const reload = useCallback(async () => {
    try {
      setData(await gql<T>(query, JSON.parse(key)));
      setError('');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [query, key]);

  useEffect(() => {
    reload();
    if (!pollMs) return;
    const t = setInterval(reload, pollMs);
    return () => clearInterval(t);
  }, [reload, pollMs]);

  return { data, error, loading, reload };
}
