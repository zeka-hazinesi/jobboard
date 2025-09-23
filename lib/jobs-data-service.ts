// Import the jobs data directly
import jobsData from '../all_jobs.json';

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

  private transformJobsToTransformedJobs(jobs: Job[]): TransformedJob[] {
    const results: TransformedJob[] = [];

    jobs.forEach((job: Job) => {
      // Skip jobs without valid locations
      if (!job.locations || job.locations.length === 0) return;

      const validLocations = job.locations.filter(loc =>
        loc.latitude && loc.longitude &&
        !isNaN(loc.latitude) && !isNaN(loc.longitude)
      );

      if (validLocations.length === 0) return;

      // Process each location
      validLocations.forEach((location: Location, index: number) => {
        const city = location.city || 'Location not specified';
        const address = location.address || '';
        const categories = job.categories || [];

        // Create unique ID by combining original ID with location index to avoid duplicates
        const uniqueId = `${job.id}-${index}`;

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

    return results;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load jobs from JSON - ensure proper structure
      const jobsPayload = Array.isArray(jobsData) ? { jobs: jobsData } : jobsData;
      this.jobs = jobsPayload.jobs || [];

      console.log(`Loaded ${this.jobs.length} jobs from JSON`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize jobs data service:', error);
      throw error;
    }
  }

  async getAllJobs(): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();
    return this.transformJobsToTransformedJobs(this.jobs);
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

    return this.transformJobsToTransformedJobs(filteredJobs);
  }

  async searchJobs(query: string): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    // Check cache first
    const cacheKey = this.getCacheKey(query);
    const cachedResults = this.getCachedResults(cacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    const searchTerm = query.toLowerCase();
    const filteredJobs = this.jobs.filter(job => {
      // Search in title, company, and categories
      const titleMatch = job.title?.toLowerCase().includes(searchTerm);
      const companyMatch = job.company?.toLowerCase().includes(searchTerm);
      const categoriesMatch = job.categories?.some(category =>
        category.toLowerCase().includes(searchTerm)
      );
      const locationMatch = job.locations?.some(location =>
        location.city?.toLowerCase().includes(searchTerm) ||
        location.address?.toLowerCase().includes(searchTerm)
      );

      return titleMatch || companyMatch || categoriesMatch || locationMatch;
    });

    const results = this.transformJobsToTransformedJobs(filteredJobs);

    // Cache the results
    this.setCachedResults(cacheKey, results);

    return results;
  }

  async searchJobsByLocation(query: string, locationName: string): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    // Check cache first
    const cacheKey = this.getCacheKey(query, locationName);
    const cachedResults = this.getCachedResults(cacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    const searchTerm = query.toLowerCase();
    const locationLower = locationName.toLowerCase();

    const filteredJobs = this.jobs.filter(job => {
      // Check if job is in the specified location
      const hasLocation = job.locations?.some(location =>
        location.city?.toLowerCase().includes(locationLower) ||
        location.address?.toLowerCase().includes(locationLower)
      );

      if (!hasLocation) return false;

      // Search in title, company, and categories
      const titleMatch = job.title?.toLowerCase().includes(searchTerm);
      const companyMatch = job.company?.toLowerCase().includes(searchTerm);
      const categoriesMatch = job.categories?.some(category =>
        category.toLowerCase().includes(searchTerm)
      );

      return titleMatch || companyMatch || categoriesMatch;
    });

    const results = this.transformJobsToTransformedJobs(filteredJobs);

    // Cache the results
    this.setCachedResults(cacheKey, results);

    return results;
  }

  getJobCount(): number {
    return this.jobs.length;
  }

  close(): void {
    this.clearCache();
    this.initialized = false;
  }
}

// Export singleton instance
export const jobsDataService = new JobsDataService();
