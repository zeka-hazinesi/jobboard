import { useState, useEffect, useCallback, useMemo } from 'react';
import { optimizedJobsDataService, type TransformedJob } from './optimized-jobs-data-service';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface UseJobsResult {
  jobs: TransformedJob[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalJobs: number;
  loadMore: () => Promise<void>;
  searchJobs: (query: string) => Promise<void>;
  initialized: boolean;
}

export function useOptimizedJobs(selectedLocation?: Location | null, searchQuery?: string): UseJobsResult {
  const [jobs, setJobs] = useState<TransformedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);

  const CHUNK_SIZE = 50; // Load 50 jobs at a time

  // Initialize data service on first load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!initialized) {
          await optimizedJobsDataService.init();
          setInitialized(true);
        }
      } catch (err) {
        console.error('Error initializing jobs data service:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [initialized]);

  // Load jobs when dependencies change
  useEffect(() => {
    if (!initialized) return;

    const loadJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        setCurrentOffset(0);

        let jobsData: TransformedJob[];
        let totalCount: number;

        if (searchQuery && searchQuery.trim()) {
          // Search across all jobs or within location
          if (selectedLocation) {
            const searchResults = await optimizedJobsDataService.searchJobsByLocation(
              searchQuery,
              selectedLocation.name,
              CHUNK_SIZE,
              0
            );
            jobsData = searchResults.jobs;
            totalCount = searchResults.total;
          } else {
            const searchResults = await optimizedJobsDataService.searchJobs(
              searchQuery,
              CHUNK_SIZE,
              0
            );
            jobsData = searchResults.jobs;
            totalCount = searchResults.total;
          }
        } else if (selectedLocation) {
          // Load jobs for selected location
          const locationResults = await optimizedJobsDataService.getJobsByLocation(
            selectedLocation.name,
            CHUNK_SIZE,
            0
          );
          jobsData = locationResults;
          totalCount = optimizedJobsDataService.getJobCount(); // Approximate total for location filtering
        } else {
          // Load all jobs (first chunk)
          jobsData = await optimizedJobsDataService.getAllJobs(CHUNK_SIZE, 0);
          totalCount = optimizedJobsDataService.getJobCount();
        }

        setJobs(jobsData);
        setCurrentOffset(CHUNK_SIZE);
        setTotalJobs(totalCount);
        setHasMore(jobsData.length === CHUNK_SIZE);
      } catch (err) {
        console.error('Error loading jobs:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [initialized, selectedLocation, searchQuery]);

  const loadMore = useCallback(async () => {
    if (!initialized || loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      let moreJobs: TransformedJob[];

      if (searchQuery && searchQuery.trim()) {
        // Load more search results
        if (selectedLocation) {
          const searchResults = await optimizedJobsDataService.searchJobsByLocation(
            searchQuery,
            selectedLocation.name,
            CHUNK_SIZE,
            currentOffset
          );
          moreJobs = searchResults.jobs;
        } else {
          const searchResults = await optimizedJobsDataService.searchJobs(
            searchQuery,
            CHUNK_SIZE,
            currentOffset
          );
          moreJobs = searchResults.jobs;
        }
      } else if (selectedLocation) {
        // Load more location results
        moreJobs = await optimizedJobsDataService.getJobsByLocation(
          selectedLocation.name,
          CHUNK_SIZE,
          currentOffset
        );
      } else {
        // Load more jobs
        moreJobs = await optimizedJobsDataService.getAllJobs(CHUNK_SIZE, currentOffset);
      }

      setJobs(prevJobs => [...prevJobs, ...moreJobs]);
      setCurrentOffset(prev => prev + CHUNK_SIZE);
      setHasMore(moreJobs.length === CHUNK_SIZE);
    } catch (err) {
      console.error('Error loading more jobs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [initialized, loading, hasMore, searchQuery, selectedLocation, currentOffset]);

  const searchJobs = useCallback(async (query: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setCurrentOffset(0);

      const searchResults = await optimizedJobsDataService.searchJobs(query, CHUNK_SIZE, 0);

      setJobs(searchResults.jobs);
      setCurrentOffset(CHUNK_SIZE);
      setTotalJobs(searchResults.total);
      setHasMore(searchResults.jobs.length === CHUNK_SIZE);
    } catch (err) {
      console.error('Error searching jobs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    jobs,
    loading,
    error,
    hasMore,
    totalJobs,
    loadMore,
    searchJobs,
    initialized
  }), [jobs, loading, error, hasMore, totalJobs, loadMore, searchJobs, initialized]);
}
