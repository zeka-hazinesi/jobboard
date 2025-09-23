import { useState, useEffect, useCallback, useMemo } from 'react';
import { jobsDataService, type TransformedJob } from './jobs-data-service';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export function useJobs(selectedLocation?: Location | null, searchQuery?: string) {
  const [jobs, setJobs] = useState<TransformedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize data service on first load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!initialized) {
          await jobsDataService.init();
          setInitialized(true);
        }

        // Load jobs based on search query and/or selected location
        let jobsData: TransformedJob[];

        if (searchQuery && searchQuery.trim()) {
          // Search across all jobs or within location
          if (selectedLocation) {
            jobsData = await jobsDataService.searchJobsByLocation(searchQuery, selectedLocation.name);
          } else {
            jobsData = await jobsDataService.searchJobs(searchQuery);
          }
        } else if (selectedLocation) {
          // Load jobs for selected location
          jobsData = await jobsDataService.getJobsByLocation(selectedLocation.name);
        } else {
          // Load all jobs
          jobsData = await jobsDataService.getAllJobs();
        }

        setJobs(jobsData);
      } catch (err) {
        console.error('Error loading jobs:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [initialized, selectedLocation, searchQuery]);

  const searchJobs = useCallback(async (query: string): Promise<TransformedJob[]> => {
    try {
      if (!initialized) {
        await jobsDataService.init();
        setInitialized(true);
      }

      return await jobsDataService.searchJobs(query);
    } catch (err) {
      console.error('Error searching jobs:', err);
      return [];
    }
  }, [initialized]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    jobs,
    loading,
    error,
    searchJobs,
    initialized
  }), [jobs, loading, error, searchJobs, initialized]);
}