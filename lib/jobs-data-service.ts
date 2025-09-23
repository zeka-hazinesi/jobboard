// Import the jobs data directly
import jobsData from '../all_jobs.json';
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

export class JobsDataService {
  private jobs: Job[] = [];
  private initialized = false;
  private miniSearch: MiniSearch | null = null;
  private searchCache = new Map<string, { results: TransformedJob[], timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
        boost: { title: 3, company: 2, categories: 1 },
        prefix: true,
        fuzzy: 0.2
      }
    });

    // Create search documents with unique IDs
    const searchDocuments = this.jobs.map((job, index) => ({
      id: `${job.id}_${index}`, // Create unique ID
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

    // Add all jobs to the search index
    this.miniSearch.addAll(searchDocuments);
  }

  /**
   * Transforms raw Job objects to TransformedJob objects for display.
   * Ensures unique IDs for React components and handles edge cases.
   *
   * @param jobs - Array of raw Job objects from the data source
   * @returns Array of TransformedJob objects with guaranteed unique IDs
   */
  private transformJobsToTransformedJobs(jobs: Job[]): TransformedJob[] {
    const results: TransformedJob[] = [];
    const usedIds = new Set<string>(); // Track used IDs to prevent duplicates
    console.log(`Transforming ${jobs.length} jobs to TransformedJob format...`);

    // Note: This method handles three cases:
    // 1. Jobs without locations: Get ID like "job123-no-location"
    // 2. Jobs with invalid locations: Get ID like "job123-invalid-location"
    // 3. Jobs with valid locations: Get ID like "job123-0-5" (id-index-jobIndex)
    // Each ID is guaranteed to be unique using the usedIds Set

    jobs.forEach((job: Job, jobIndex: number) => {
      const categories = job.categories || [];

      // Handle jobs without valid locations - create a single entry without coordinates
      if (!job.locations || job.locations.length === 0) {
        let uniqueId = `${job.id}-no-location`;

        // Ensure uniqueness by adding job index if there's a conflict
        let counter = 0;
        while (usedIds.has(uniqueId)) {
          counter++;
          uniqueId = `${job.id}-no-location-${counter}`;
        }
        usedIds.add(uniqueId);

        results.push({
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
        });
        return;
      }

      const validLocations = job.locations.filter(loc =>
        loc.latitude && loc.longitude &&
        !isNaN(loc.latitude) && !isNaN(loc.longitude)
      );

      // If no valid locations, create one entry with placeholder location
      if (validLocations.length === 0) {
        let uniqueId = `${job.id}-invalid-location`;

        // Ensure uniqueness by adding job index if there's a conflict
        let counter = 0;
        while (usedIds.has(uniqueId)) {
          counter++;
          uniqueId = `${job.id}-invalid-location-${counter}`;
        }
        usedIds.add(uniqueId);

        results.push({
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
        });
        return;
      }

      // Process each valid location
      validLocations.forEach((location: Location, index: number) => {
        const city = location.city || 'Location not specified';
        const address = location.address || '';

        // Create unique ID by combining original ID with location index and job index
        let uniqueId = `${job.id}-${index}-${jobIndex}`;

        // Ensure uniqueness by adding a counter if there's still a conflict
        let counter = 0;
        while (usedIds.has(uniqueId)) {
          counter++;
          uniqueId = `${job.id}-${index}-${jobIndex}-${counter}`;
        }
        usedIds.add(uniqueId);

        results.push({
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
        });
      });
    });

    // Filter out any remaining duplicates (safety net)
    const uniqueResults = results.filter((job, index, self) =>
      index === self.findIndex(j => j.id === job.id)
    );

    console.log(`Successfully transformed ${results.length} jobs (filtered to ${uniqueResults.length} unique jobs)`);
    return uniqueResults;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load jobs from JSON - ensure proper structure
      const jobsPayload = Array.isArray(jobsData) ? { jobs: jobsData } : jobsData;
      this.jobs = jobsPayload.jobs || [];

      console.log(`Loaded ${this.jobs.length} jobs from JSON`);

      // Count jobs with and without locations for debugging
      const jobsWithLocations = this.jobs.filter(job => job.locations && job.locations.length > 0).length;
      const jobsWithoutLocations = this.jobs.filter(job => !job.locations || job.locations.length === 0).length;
      console.log(`- Jobs with locations: ${jobsWithLocations}`);
      console.log(`- Jobs without locations: ${jobsWithoutLocations}`);

      // Initialize MiniSearch with the loaded jobs
      this.initializeMiniSearch();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize jobs data service:', error);
      throw error;
    }
  }

  async getAllJobs(): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    const transformedJobs = this.transformJobsToTransformedJobs(this.jobs);

    // Check for duplicates and log warnings
    const duplicateInfo = this.getDuplicateInfo(transformedJobs);
    if (duplicateInfo.hasDuplicates) {
      console.warn(`⚠️ Found ${duplicateInfo.totalDuplicates} duplicate job IDs:`, duplicateInfo.duplicateIds);
    } else {
      console.log(`✅ No duplicate job IDs found`);
    }

    return transformedJobs;
  }

  async getJobsByLocation(locationName: string): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    const locationLower = locationName.toLowerCase();
    const filteredJobs = this.jobs.filter(job => {
      if (!job.locations || job.locations.length === 0) return false;

      return job.locations.some(location =>
        location.city?.toLowerCase().includes(locationLower) ||
        location.address?.toLowerCase().includes(locationLower)
      );
    });

    const results = this.transformJobsToTransformedJobs(filteredJobs);

    // Check for duplicates and filter them out (safety net)
    const uniqueResults = results.filter((job, index, self) =>
      index === self.findIndex(j => j.id === job.id)
    );

    // Log duplicate information
    if (results.length !== uniqueResults.length) {
      const removedCount = results.length - uniqueResults.length;
      console.warn(`⚠️ Removed ${removedCount} duplicate jobs from location filter results`);
    }

    return uniqueResults;
  }

  async searchJobs(query: string): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    // Check cache first
    const cacheKey = this.getCacheKey(query);
    const cachedResults = this.getCachedResults(cacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    if (!this.miniSearch) {
      console.warn('MiniSearch not initialized');
      return [];
    }

    // Use MiniSearch for fast and accurate search
    const searchResults = this.miniSearch.search(query, {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 3, company: 2, categories: 1 }
    });

    // Convert search results back to Job objects
    const matchedJobs = searchResults.map(result => {
      const originalId = result.id.split('_')[0]; // Extract original job ID
      const job = this.jobs.find(j => j.id === originalId);
      return job;
    }).filter(Boolean) as Job[];

    const results = this.transformJobsToTransformedJobs(matchedJobs);

    // Check for duplicates and filter them out (safety net)
    const uniqueResults = results.filter((job, index, self) =>
      index === self.findIndex(j => j.id === job.id)
    );

    // Log duplicate information
    if (results.length !== uniqueResults.length) {
      const removedCount = results.length - uniqueResults.length;
      console.warn(`⚠️ Removed ${removedCount} duplicate jobs from search results`);
    }

    // Cache the results
    this.setCachedResults(cacheKey, uniqueResults);

    return uniqueResults;
  }

  async searchJobsByLocation(query: string, locationName: string): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    // Check cache first
    const cacheKey = this.getCacheKey(query, locationName);
    const cachedResults = this.getCachedResults(cacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    if (!this.miniSearch) {
      console.warn('MiniSearch not initialized');
      return [];
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
      const originalId = result.id.split('_')[0]; // Extract original job ID
      const job = this.jobs.find(j => j.id === originalId);
      return job;
    }).filter(Boolean) as Job[];

    // Additional location filtering (since MiniSearch might not be perfect with location matching)
    const locationFilteredJobs = matchedJobs.filter(job => {
      return job.locations?.some(location =>
        location.city?.toLowerCase().includes(locationLower) ||
        location.address?.toLowerCase().includes(locationLower)
      );
    });

    const results = this.transformJobsToTransformedJobs(locationFilteredJobs);

    // Check for duplicates and filter them out (safety net)
    const uniqueResults = results.filter((job, index, self) =>
      index === self.findIndex(j => j.id === job.id)
    );

    // Log duplicate information
    if (results.length !== uniqueResults.length) {
      const removedCount = results.length - uniqueResults.length;
      console.warn(`⚠️ Removed ${removedCount} duplicate jobs from location search results`);
    }

    // Cache the results
    this.setCachedResults(cacheKey, uniqueResults);

    return uniqueResults;
  }

  getJobCount(): number {
    return this.jobs.length;
  }

  // Utility method to check for duplicate IDs in a job list
  private checkForDuplicates(jobs: TransformedJob[]): { hasDuplicates: boolean; duplicateIds: string[] } {
    const seenIds = new Set<string>();
    const duplicateIds: string[] = [];

    jobs.forEach(job => {
      if (seenIds.has(job.id)) {
        duplicateIds.push(job.id);
      } else {
        seenIds.add(job.id);
      }
    });

    return {
      hasDuplicates: duplicateIds.length > 0,
      duplicateIds: [...new Set(duplicateIds)] // Remove duplicates from the duplicates list
    };
  }

  // Public method to get duplicate information
  getDuplicateInfo(jobs?: TransformedJob[]): { hasDuplicates: boolean; duplicateIds: string[]; totalDuplicates: number } {
    const jobList = jobs || [];
    const duplicateCheck = this.checkForDuplicates(jobList);

    return {
      hasDuplicates: duplicateCheck.hasDuplicates,
      duplicateIds: duplicateCheck.duplicateIds,
      totalDuplicates: duplicateCheck.duplicateIds.length
    };
  }

  close(): void {
    this.clearCache();
    this.miniSearch = null;
    this.initialized = false;
  }

  // Method to reinitialize search index (useful for updating search data)
  reinitializeSearch(): void {
    if (this.jobs.length > 0) {
      this.initializeMiniSearch();
    }
  }
}

// Export singleton instance
export const jobsDataService = new JobsDataService();
