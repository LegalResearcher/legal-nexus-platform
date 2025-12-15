import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseVisitTrackerResult {
  visitCount: number;
  isLoading: boolean;
  error: string | null;
}

export const useVisitTracker = (pageName: string): UseVisitTrackerResult => {
  const [visitCount, setVisitCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trackAndFetchVisits = async () => {
      try {
        // Increment visit count
        await supabase.rpc('increment_visit_count', { page_key: pageName });

        // Fetch current count
        const { data, error: fetchError } = await supabase
          .from('page_visits')
          .select('visits_count')
          .eq('page_name', pageName)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching visit count:', fetchError.message);
          setError(fetchError.message);
          return;
        }

        if (data) {
          setVisitCount(data.visits_count);
        }
      } catch (err) {
        console.error('Error tracking visit:', err);
        setError('حدث خطأ في تتبع الزيارة');
      } finally {
        setIsLoading(false);
      }
    };

    trackAndFetchVisits();
  }, [pageName]);

  return { visitCount, isLoading, error };
};
