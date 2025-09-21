import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

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

class JobDatabase {
  private db: any = null;
  private sqlite3: any = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.sqlite3 = await sqlite3InitModule({
        print: console.log,
        printErr: console.error,
      });

      this.db = new this.sqlite3.oo1.DB();

      // Create tables with indexes
      this.createTables();
      this.createIndexes();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize SQLite:', error);
      throw error;
    }
  }

  private createTables(): void {
    // Create jobs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        original_id TEXT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        workload_min_percent REAL,
        workload_max_percent REAL,
        employment_types TEXT, -- JSON array as string
        categories TEXT, -- JSON array as string
        language TEXT,
        posted_at TEXT,
        valid_until TEXT,
        link TEXT,
        apply_link TEXT,
        source_file TEXT
      )
    `);

    // Create locations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        city TEXT,
        region TEXT,
        country TEXT,
        address TEXT,
        postal_code TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        FOREIGN KEY (job_id) REFERENCES jobs(id)
      )
    `);
  }

  private createIndexes(): void {
    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
      CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
      CREATE INDEX IF NOT EXISTS idx_jobs_categories ON jobs(categories);
      CREATE INDEX IF NOT EXISTS idx_locations_job_id ON locations(job_id);
      CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
      CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_locations_postal_code ON locations(postal_code);
    `);
  }

  async loadJobsFromJSON(jobsData: { jobs: Job[] }): Promise<void> {
    if (!this.initialized) await this.init();

    // Begin transaction for better performance
    this.db.exec('BEGIN TRANSACTION');

    try {
      // Clear existing data
      this.db.exec('DELETE FROM locations');
      this.db.exec('DELETE FROM jobs');

      const insertJobStmt = this.db.prepare(`
        INSERT INTO jobs (
          id, original_id, title, company, workload_min_percent, workload_max_percent,
          employment_types, categories, language, posted_at, valid_until, link, apply_link, source_file
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertLocationStmt = this.db.prepare(`
        INSERT INTO locations (job_id, city, region, country, address, postal_code, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      jobsData.jobs.forEach((job: Job) => {
        // Skip jobs without valid locations
        if (!job.locations || job.locations.length === 0) return;

        const validLocations = job.locations.filter(loc =>
          loc.latitude && loc.longitude &&
          !isNaN(loc.latitude) && !isNaN(loc.longitude)
        );

        if (validLocations.length === 0) return;

        // Insert job
        insertJobStmt.bind([
          job.id,
          job.id, // original_id same as id
          job.title || 'No Title',
          job.company || 'Unknown Company',
          job.workload_min_percent,
          job.workload_max_percent,
          JSON.stringify(job.employment_types || []),
          JSON.stringify(job.categories || []),
          job.language,
          job.posted_at,
          job.valid_until,
          job.link,
          job.apply_link,
          job.source_file
        ]);
        insertJobStmt.step();
        insertJobStmt.reset();

        // Insert locations
        validLocations.forEach((location: Location) => {
          insertLocationStmt.bind([
            job.id,
            location.city,
            location.region,
            location.country,
            location.address,
            location.postal_code,
            location.latitude,
            location.longitude
          ]);
          insertLocationStmt.step();
          insertLocationStmt.reset();
        });
      });

      insertJobStmt.finalize();
      insertLocationStmt.finalize();

      this.db.exec('COMMIT');
      console.log('Successfully loaded jobs into SQLite database');
    } catch (error) {
      this.db.exec('ROLLBACK');
      console.error('Error loading jobs into database:', error);
      throw error;
    }
  }

  async getAllJobs(): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    const results: TransformedJob[] = [];
    const stmt = this.db.prepare(`
      SELECT
        j.id,
        j.original_id,
        j.title,
        j.company,
        j.link,
        j.categories,
        l.city,
        l.address,
        l.latitude,
        l.longitude,
        ROW_NUMBER() OVER (PARTITION BY j.id ORDER BY l.id) as location_rank
      FROM jobs j
      INNER JOIN locations l ON j.id = l.job_id
      WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
    `);

    try {
      while (stmt.step()) {
        const row = stmt.get({});
        const city = row.city || 'Location not specified';
        const address = row.address || '';
        const categories = row.categories ? JSON.parse(row.categories) : [];

        // Create unique ID by combining original ID with location rank to avoid duplicates
        const uniqueId = `${row.original_id}-${row.location_rank}`;

        results.push({
          id: uniqueId,
          originalId: row.original_id,
          title: row.title || 'No Title',
          company: row.company || 'Unknown Company',
          location: address ? `${address}, ${city}` : city,
          latitude: row.latitude,
          longitude: row.longitude,
          link: row.link,
          salary: 'Salary not specified',
          tags: categories,
          logo: '/globe.svg'
        });
      }
    } finally {
      stmt.finalize();
    }

    return results;
  }

  async getJobsByLocation(locationName: string): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    const results: TransformedJob[] = [];
    const stmt = this.db.prepare(`
      SELECT
        j.id,
        j.original_id,
        j.title,
        j.company,
        j.link,
        j.categories,
        l.city,
        l.address,
        l.latitude,
        l.longitude,
        ROW_NUMBER() OVER (PARTITION BY j.id ORDER BY l.id) as location_rank
      FROM jobs j
      INNER JOIN locations l ON j.id = l.job_id
      WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        AND (LOWER(l.city) LIKE LOWER(?) OR LOWER(l.address) LIKE LOWER(?))
    `);

    const searchTerm = `%${locationName}%`;

    try {
      stmt.bind([searchTerm, searchTerm]);

      while (stmt.step()) {
        const row = stmt.get({});
        const city = row.city || 'Location not specified';
        const address = row.address || '';
        const categories = row.categories ? JSON.parse(row.categories) : [];

        const uniqueId = `${row.original_id}-${row.location_rank}`;

        results.push({
          id: uniqueId,
          originalId: row.original_id,
          title: row.title || 'No Title',
          company: row.company || 'Unknown Company',
          location: address ? `${address}, ${city}` : city,
          latitude: row.latitude,
          longitude: row.longitude,
          link: row.link,
          salary: 'Salary not specified',
          tags: categories,
          logo: '/globe.svg'
        });
      }
    } finally {
      stmt.finalize();
    }

    return results;
  }

  async searchJobs(query: string): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    const results: TransformedJob[] = [];
    const stmt = this.db.prepare(`
      SELECT
        j.id,
        j.original_id,
        j.title,
        j.company,
        j.link,
        j.categories,
        l.city,
        l.address,
        l.latitude,
        l.longitude,
        ROW_NUMBER() OVER (PARTITION BY j.id ORDER BY l.id) as location_rank
      FROM jobs j
      INNER JOIN locations l ON j.id = l.job_id
      WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        AND (
          LOWER(j.title) LIKE LOWER(?) OR
          LOWER(j.company) LIKE LOWER(?) OR
          LOWER(j.categories) LIKE LOWER(?)
        )
    `);

    const searchTerm = `%${query}%`;

    try {
      stmt.bind([searchTerm, searchTerm, searchTerm]);

      while (stmt.step()) {
        const row = stmt.get({});
        const city = row.city || 'Location not specified';
        const address = row.address || '';
        const categories = row.categories ? JSON.parse(row.categories) : [];

        const uniqueId = `${row.original_id}-${row.location_rank}`;

        results.push({
          id: uniqueId,
          originalId: row.original_id,
          title: row.title || 'No Title',
          company: row.company || 'Unknown Company',
          location: address ? `${address}, ${city}` : city,
          latitude: row.latitude,
          longitude: row.longitude,
          link: row.link,
          salary: 'Salary not specified',
          tags: categories,
          logo: '/globe.svg'
        });
      }
    } finally {
      stmt.finalize();
    }

    return results;
  }

  async searchJobsByLocation(query: string, locationName: string): Promise<TransformedJob[]> {
    if (!this.initialized) await this.init();

    const results: TransformedJob[] = [];
    const stmt = this.db.prepare(`
      SELECT
        j.id,
        j.original_id,
        j.title,
        j.company,
        j.link,
        j.categories,
        l.city,
        l.address,
        l.latitude,
        l.longitude,
        ROW_NUMBER() OVER (PARTITION BY j.id ORDER BY l.id) as location_rank
      FROM jobs j
      INNER JOIN locations l ON j.id = l.job_id
      WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        AND (LOWER(l.city) LIKE LOWER(?) OR LOWER(l.address) LIKE LOWER(?))
        AND (
          LOWER(j.title) LIKE LOWER(?) OR
          LOWER(j.company) LIKE LOWER(?) OR
          LOWER(j.categories) LIKE LOWER(?)
        )
    `);

    const searchTerm = `%${query}%`;
    const locationTerm = `%${locationName}%`;

    try {
      stmt.bind([locationTerm, locationTerm, searchTerm, searchTerm, searchTerm]);

      while (stmt.step()) {
        const row = stmt.get({});
        const city = row.city || 'Location not specified';
        const address = row.address || '';
        const categories = row.categories ? JSON.parse(row.categories) : [];

        const uniqueId = `${row.original_id}-${row.location_rank}`;

        results.push({
          id: uniqueId,
          originalId: row.original_id,
          title: row.title || 'No Title',
          company: row.company || 'Unknown Company',
          location: address ? `${address}, ${city}` : city,
          latitude: row.latitude,
          longitude: row.longitude,
          link: row.link,
          salary: 'Salary not specified',
          tags: categories,
          logo: '/globe.svg'
        });
      }
    } finally {
      stmt.finalize();
    }

    return results;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Export singleton instance
export const jobDatabase = new JobDatabase();