import MiniSearch from 'minisearch';

export interface Job {
  id: string;
  title: string;
  company: string;
  locations: Location[];
  workload_min_percent: number | null;
  workload_max_percent: number | null;
  employment_types: string[];
  categories: string[];
  language: string | null;
  posted_at: string | null;
  valid_until: string | null;
  link: string | null;
  apply_link: string | null;
  source_file: string;
}

export interface Location {
  city: string;
  region: string | null;
  country: string | null;
  address: string;
  postal_code: string;
  latitude: number;
  longitude: number;
}

export interface TransformedJob {
  id: string;
  originalId: string;
  title: string;
  company: string;
  location: string;
  latitude: number;
  longitude: number;
  link: string | null;
  salary: string;
  tags: string[];
  logo: string;
}

export class OptimizedJobsDataService {
  private jobs: Job[] = [];
  private initialized = false;
  private miniSearch: MiniSearch | null = null;
  private searchCache = new Map<string, { results: TransformedJob[], timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly CHUNK_SIZE = 500; // Load jobs in chunks of 500
  private dataLoadPromise: Promise<void> | null = null;
  private transformationCache = new Map<string, TransformedJob[]>();

  private getCacheKey(query: string, locationName?: string): string {
    return locationName ? `${query}:${locationName}` : query;
  }

  private getCachedResults(key: string): TransformedJob[] | null {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.results;
    }
    if (cached) {
      this.searchCache.delete(key);
    }
    return null;
  }

  private setCachedResults(key: string, results: TransformedJob[]): void {
    this.searchCache.set(key, { results, timestamp: Date.now() });
  }

  private clearCache(): void {
    this.searchCache.clear();
  }

  private initializeMiniSearch(): void {
    this.miniSearch = new MiniSearch({
      fields: ['title', 'company', 'categories', 'locations'],
      storeFields: ['id', 'title', 'company', 'locations', 'categories', 'link', 'employment_types', 'language', 'posted_at', 'valid_until', 'apply_link', 'source_file'],
      searchOptions: {
        boost: { title: 3, company: 2, categories: 1.5, locations: 1 },
        prefix: true,
        fuzzy: 0.15, // Reduced fuzzy matching for better performance
        combineWith: 'AND' // Only return results that match all terms
      }
    });

    // Create search documents with unique IDs - optimized
    const searchDocuments = this.jobs.map((job, index) => ({
      id: `${job.id}_${index}`,
      title: job.title || '',
      company: job.company || '',
      categories: job.categories || [],
      locations: job.locations?.map(loc => `${loc.city || ''} ${loc.address || ''}`).join(' ') || '',
      link: job.link || '',
      employment_types: job.employment_types || [],
      language: job.language || '',
      posted_at: job.posted_at || '',
      valid_until: job.valid_until || '',
      apply_link: job.apply_link || '',
      source_file: job.source_file || ''
    }));

    // Add all jobs to the search index in batches for better performance
    const BATCH_SIZE = 1000;
    for (let i = 0; i < searchDocuments.length; i += BATCH_SIZE) {
      const batch = searchDocuments.slice(i, i + BATCH_SIZE);
      this.miniSearch.addAll(batch);
    }
  }

  /**
   * Loads jobs data from a remote URL or local JSON file
   */
  private async loadJobsData(): Promise<void> {
    if (this.dataLoadPromise) {
      return this.dataLoadPromise;
    }

    this.dataLoadPromise = this.performDataLoad();
    await this.dataLoadPromise;
  }

  private async performDataLoad(): Promise<void> {
    try {
      console.log('Loading jobs data...');

      // Try to load from browser cache first
      const cachedData = this.getCachedJobsData();
      if (cachedData) {
        this.jobs = cachedData;
        console.log(`Loaded ${this.jobs.length} jobs from cache`);
        return;
      }

      // Load from JSON file (from public directory)
      const response = await fetch('/all_jobs.json');
      if (!response.ok) {
        throw new Error(`Failed to load jobs data: ${response.statusText}`);
      }

      const jobsPayload = await response.json();
      const jobsData = Array.isArray(jobsPayload) ? jobsPayload : jobsPayload.jobs || [];

      this.jobs = jobsData;
      console.log(`Loaded ${this.jobs.length} jobs from JSON`);

      // Cache the data in browser storage
      this.cacheJobsData(jobsData);

      // Count jobs with and without locations for debugging
      const jobsWithLocations = this.jobs.filter(job => job.locations && job.locations.length > 0).length;
      const jobsWithoutLocations = this.jobs.filter(job => !job.locations || job.locations.length === 0).length;
      console.log(`- Jobs with locations: ${jobsWithLocations}`);
      console.log(`- Jobs without locations: ${jobsWithoutLocations}`);
    } catch (error) {
      console.error('Failed to load jobs data:', error);
      throw error;
    }
  }

  private getCachedJobsData(): Job[] | null {
    try {
      const cached = localStorage.getItem('jobsData');
      const cacheTimestamp = localStorage.getItem('jobsDataTimestamp');

      if (!cached || !cacheTimestamp) {
        return null;
      }

      const age = Date.now() - parseInt(cacheTimestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age > maxAge) {
        localStorage.removeItem('jobsData');
        localStorage.removeItem('jobsDataTimestamp');
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.warn('Failed to load cached jobs data:', error);
      return null;
    }
  }

  private cacheJobsData(jobs: Job[]): void {
    try {
      localStorage.setItem('jobsData', JSON.stringify(jobs));
      localStorage.setItem('jobsDataTimestamp', Date.now().toString());
    } catch (error) {
      console.warn('Failed to cache jobs data:', error);
    }
  }

  private getTransformationCacheKey(jobs: Job[], offset: number = 0, limit?: number): string {
    const jobIds = jobs.slice(offset, limit ? offset + limit : undefined)
      .map(job => job.id)
      .sort()
      .join(',');
    return `${jobIds}-${offset}-${limit || 'all'}`;
  }

  private transformJobsToTransformedJobs(jobs: Job[], offset: number = 0, limit?: number): TransformedJob[] {
    // Check transformation cache first
    const cacheKey = this.getTransformationCacheKey(jobs, offset, limit);
    const cached = this.transformationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const jobsToProcess = limit ? jobs.slice(offset, offset + limit) : jobs.slice(offset);
    const results: TransformedJob[] = [];
    const usedIds = new Set<string>();

    // Pre-allocate array for better performance
    results.length = jobsToProcess.length * 2; // Rough estimate for multiple locations per job
    let resultIndex = 0;

    for (let jobIndex = 0; jobIndex < jobsToProcess.length; jobIndex++) {
      const job = jobsToProcess[jobIndex];
      const categories = job.categories || [];

      // Handle jobs without valid locations - optimized
      if (!job.locations || job.locations.length === 0) {
        let uniqueId = `${job.id}-no-location`;
        let counter = 0;
        while (usedIds.has(uniqueId)) {
          counter++;
          uniqueId = `${job.id}-no-location-${counter}`;
        }
        usedIds.add(uniqueId);

        results[resultIndex++] = {
          id: uniqueId,
          originalId: job.id,
          title: job.title || 'No Title',
          company: job.company || 'Unknown Company',
          location: 'Location not specified',
          latitude: 0,
          longitude: 0,
          link: job.link,
          salary: 'Salary not specified',
          tags: categories,
          logo: '/globe.svg'
        };
        continue;
      }

      // Filter valid locations more efficiently
      const validLocations = job.locations.filter(loc =>
        loc.latitude && loc.longitude &&
        !isNaN(loc.latitude) && !isNaN(loc.longitude)
      );

      // If no valid locations, create one entry with placeholder location
      if (validLocations.length === 0) {
        let uniqueId = `${job.id}-invalid-location`;
        let counter = 0;
        while (usedIds.has(uniqueId)) {
          counter++;
          uniqueId = `${job.id}-invalid-location-${counter}`;
        }
        usedIds.add(uniqueId);

        results[resultIndex++] = {
          id: uniqueId,
          originalId: job.id,
          title: job.title || 'No Title',
          company: job.company || 'Unknown Company',
          location: 'Location not specified',
          latitude: 0,
          longitude: 0,
          link: job.link,
          salary: 'Salary not specified',
          tags: categories,
          logo: '/globe.svg'
        };
        continue;
      }

      // Process each valid location - optimized loop
      for (let index = 0; index < validLocations.length; index++) {
        const location = validLocations[index];
        const city = location.city || 'Location not specified';
        const address = location.address || '';

        let uniqueId = `${job.id}-${index}-${jobIndex}`;
        let counter = 0;
        while (usedIds.has(uniqueId)) {
          counter++;
          uniqueId = `${job.id}-${index}-${jobIndex}-${counter}`;
        }
        usedIds.add(uniqueId);

        results[resultIndex++] = {
          id: uniqueId,
          originalId: job.id,
          title: job.title || 'No Title',
          company: job.company || 'Unknown Company',
          location: address ? `${address}, ${city}` : city,
          latitude: location.latitude,
          longitude: location.longitude,
          link: job.link,
          salary: 'Salary not specified',
          tags: categories,
          logo: '/globe.svg'
        };
      }
    }

    // Trim array to actual size and filter duplicates
    const finalResults = results.slice(0, resultIndex).filter((job, index, self) =>
      index === self.findIndex(j => j.id === job.id)
    );

    // Cache the results
    this.transformationCache.set(cacheKey, finalResults);

    return finalResults;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.loadJobsData();

      if (this.jobs.length > 0) {
        this.initializeMiniSearch();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize optimized jobs data service:', error);
      throw error;
    }
  }

  async getAllJobs(limit?: number, offset: number = 0): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    return this.transformJobsToTransformedJobs(this.jobs, offset, limit);
  }

  async getJobsByLocation(locationName: string, limit?: number, offset: number = 0): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    const locationLower = locationName.toLowerCase();
    const filteredJobs = this.jobs.filter(job => {
      if (!job.locations || job.locations.length === 0) return false;

      return job.locations.some(location =>
        location.city?.toLowerCase().includes(locationLower) ||
        location.address?.toLowerCase().includes(locationLower)
      );
    });

    return this.transformJobsToTransformedJobs(filteredJobs, offset, limit);
  }

  async searchJobs(query: string, limit?: number, offset: number = 0): Promise<{ jobs: TransformedJob[], total: number }> {
    if (!this.initialized) await this.init();

    // Check cache first
    const cacheKey = this.getCacheKey(query);
    const cachedResults = this.getCachedResults(cacheKey);
    if (cachedResults) {
      const paginatedJobs = limit ? cachedResults.slice(offset, offset + limit) : cachedResults.slice(offset);
      return { jobs: paginatedJobs, total: cachedResults.length };
    }

    if (!this.miniSearch) {
      console.warn('MiniSearch not initialized');
      return { jobs: [], total: 0 };
    }

    // Use MiniSearch for fast and accurate search
    const searchResults = this.miniSearch.search(query, {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 3, company: 2, categories: 1 }
    });

    // Convert search results back to Job objects
    const matchedJobs = searchResults.map(result => {
      const originalId = result.id.split('_')[0];
      const job = this.jobs.find(j => j.id === originalId);
      return job;
    }).filter(Boolean) as Job[];

    const results = this.transformJobsToTransformedJobs(matchedJobs, offset, limit);

    // Cache the results (full results, not paginated)
    if (!limit) {
      this.setCachedResults(cacheKey, results);
    }

    return { jobs: results, total: matchedJobs.length };
  }

  async searchJobsByLocation(query: string, locationName: string, limit?: number, offset: number = 0): Promise<{ jobs: TransformedJob[], total: number }> {
    if (!this.initialized) await this.init();

    // Check cache first
    const cacheKey = this.getCacheKey(query, locationName);
    const cachedResults = this.getCachedResults(cacheKey);
    if (cachedResults) {
      const paginatedJobs = limit ? cachedResults.slice(offset, offset + limit) : cachedResults.slice(offset);
      return { jobs: paginatedJobs, total: cachedResults.length };
    }

    if (!this.miniSearch) {
      console.warn('MiniSearch not initialized');
      return { jobs: [], total: 0 };
    }

    const locationLower = locationName.toLowerCase();

    // Use MiniSearch for the main search
    const searchResults = this.miniSearch.search(query, {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 3, company: 2, categories: 1 }
    });

    // Filter by location
    const matchedJobs = searchResults.map(result => {
      const originalId = result.id.split('_')[0];
      const job = this.jobs.find(j => j.id === originalId);
      return job;
    }).filter(Boolean) as Job[];

    // Additional location filtering
    const locationFilteredJobs = matchedJobs.filter(job => {
      return job.locations?.some(location =>
        location.city?.toLowerCase().includes(locationLower) ||
        location.address?.toLowerCase().includes(locationLower)
      );
    });

    const results = this.transformJobsToTransformedJobs(locationFilteredJobs, offset, limit);

    // Cache the results (full results, not paginated)
    if (!limit) {
      this.setCachedResults(cacheKey, results);
    }

    return { jobs: results, total: locationFilteredJobs.length };
  }

  getJobCount(): number {
    return this.jobs.length;
  }

  close(): void {
    this.clearCache();
    this.transformationCache.clear();
    this.miniSearch = null;
    this.initialized = false;
    this.dataLoadPromise = null;
  }

  // Method to reinitialize search index (useful for updating search data)
  reinitializeSearch(): void {
    if (this.jobs.length > 0) {
      this.initializeMiniSearch();
    }
  }

  // Optimized search with debouncing and better caching
  async searchJobsOptimized(query: string, limit?: number, offset: number = 0): Promise<{ jobs: TransformedJob[], total: number }> {
    if (!this.initialized) await this.init();

    // Normalize query
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      // Return paginated results for empty query
      const allJobs = await this.getAllJobs(limit, offset);
      return { jobs: allJobs, total: this.jobs.length };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(normalizedQuery);
    const cachedResults = this.getCachedResults(cacheKey);
    if (cachedResults && !limit) {
      const paginatedJobs = cachedResults.slice(offset, offset + (limit || cachedResults.length));
      return { jobs: paginatedJobs, total: cachedResults.length };
    }

    if (!this.miniSearch) {
      console.warn('MiniSearch not initialized');
      return { jobs: [], total: 0 };
    }

    // Perform search with optimized options
    const searchResults = this.miniSearch.search(normalizedQuery, {
      prefix: true,
      fuzzy: normalizedQuery.length > 3 ? 0.1 : 0.2, // Less fuzzy for longer queries
      boost: { title: 3, company: 2, categories: 1.5, locations: 1 },
      combineWith: 'AND'
    });

    // Convert search results back to Job objects
    const matchedJobs = searchResults.map(result => {
      const originalId = result.id.split('_')[0];
      const job = this.jobs.find(j => j.id === originalId);
      return job;
    }).filter(Boolean) as Job[];

    const results = this.transformJobsToTransformedJobs(matchedJobs, offset, limit);

    // Cache the results (full results, not paginated)
    if (!limit) {
      this.setCachedResults(cacheKey, results);
    }

    return { jobs: results, total: matchedJobs.length };
  }
}

// Export singleton instance
export const optimizedJobsDataService = new OptimizedJobsDataService();
