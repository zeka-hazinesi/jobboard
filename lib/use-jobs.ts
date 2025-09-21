import { useState, useEffect } from 'react';
import { jobDatabase, type TransformedJob } from './database';
import { initializeDatabase } from './init-database';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export function useJobs(selectedLocation?: Location | null) {
  const [jobs, setJobs] = useState<TransformedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

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

        // Load jobs based on selected location
        let jobsData: TransformedJob[];

        if (selectedLocation) {
          jobsData = await jobDatabase.getJobsByLocation(selectedLocation.name);
        } else {
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
  }, [selectedLocation, initialized]);

  const searchJobs = async (query: string): Promise<TransformedJob[]> => {
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
  };

  return {
    jobs,
    loading,
    error,
    searchJobs,
    initialized
  };
}