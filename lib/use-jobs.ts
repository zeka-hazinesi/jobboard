import { useState, useEffect, useCallback, useMemo } from 'react';
import { jobDatabase, type TransformedJob } from './database';
import { initializeDatabase } from './init-database';

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

  // Memoize the dependencies to prevent unnecessary effect runs
  const dependencies = useMemo(() => [selectedLocation, searchQuery, initialized], [selectedLocation, searchQuery, initialized]);

  // Initialize database on first load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!initialized) {
          await initializeDatabase();
          setInitialized(true);
        }

        // Load jobs based on search query and/or selected location
        let jobsData: TransformedJob[];

        if (searchQuery && searchQuery.trim()) {
          // Search across all jobs or within location
          if (selectedLocation) {
            jobsData = await jobDatabase.searchJobsByLocation(searchQuery, selectedLocation.name);
          } else {
            jobsData = await jobDatabase.searchJobs(searchQuery);
          }
        } else if (selectedLocation) {
          // Load jobs for selected location
          jobsData = await jobDatabase.getJobsByLocation(selectedLocation.name);
        } else {
          // Load all jobs
          jobsData = await jobDatabase.getAllJobs();
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
  }, dependencies);

  const searchJobs = useCallback(async (query: string): Promise<TransformedJob[]> => {
    try {
      if (!initialized) {
        await initializeDatabase();
        setInitialized(true);
      }

      return await jobDatabase.searchJobs(query);
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