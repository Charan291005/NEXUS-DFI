import { useState, useEffect } from 'react';
import { casesApi } from '../utils/api';
import type { DashboardStats } from '../types';

export function useRealtimeStats(initialStats: DashboardStats | null, intervalMs: number = 30000) {
  const [stats, setStats] = useState<DashboardStats | null>(initialStats);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (initialStats) {
      const t = setTimeout(() => setStats(initialStats), 0);
      return () => clearTimeout(t);
    }
  }, [initialStats]);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        const res = await casesApi.stats();
        if (mounted) {
          setStats(res.data);
          setIsLive(true);
        }
      } catch {
        if (mounted) setIsLive(false);
      }
    };

    const interval = setInterval(fetchStats, intervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return { stats, setStats, isLive };
}
