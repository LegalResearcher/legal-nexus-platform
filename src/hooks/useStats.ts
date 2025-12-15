import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseStatsResult {
  visitCount: number;
  downloadCount: number;
  isLoading: boolean;
  trackDownload: () => Promise<void>;
}

export const useStats = (visitPageName: string, downloadPageName: string): UseStatsResult => {
  const [visitCount, setVisitCount] = useState<number>(0);
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Track visit and fetch both counts
  useEffect(() => {
    const initializeStats = async () => {
      try {
        // Increment visit count
        await supabase.rpc('increment_visit_count', { page_key: visitPageName });

        // Fetch both counts
        const { data, error } = await supabase
          .from('page_visits')
          .select('page_name, visits_count')
          .in('page_name', [visitPageName, downloadPageName]);

        if (error) {
          console.error('Error fetching stats:', error.message);
          return;
        }

        if (data) {
          data.forEach((item) => {
            if (item.page_name === visitPageName) {
              setVisitCount(item.visits_count);
            } else if (item.page_name === downloadPageName) {
              setDownloadCount(item.visits_count);
            }
          });
        }
      } catch (err) {
        console.error('Error initializing stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStats();
  }, [visitPageName, downloadPageName]);

  // Track download
  const trackDownload = useCallback(async () => {
    try {
      await supabase.rpc('increment_visit_count', { page_key: downloadPageName });
      setDownloadCount((prev) => prev + 1);
    } catch (err) {
      console.error('Error tracking download:', err);
    }
  }, [downloadPageName]);

  return { visitCount, downloadCount, isLoading, trackDownload };
};
