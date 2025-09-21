import { jobDatabase } from './database';
import jobsData from '../transformed_jobs.json';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing SQLite database...');

    // Initialize the database
    await jobDatabase.init();

    // Load jobs from JSON
    console.log('Loading jobs from JSON into SQLite...');
    await jobDatabase.loadJobsFromJSON(jobsData);

    // Get count to verify
    const allJobs = await jobDatabase.getAllJobs();
    console.log(`Successfully loaded ${allJobs.length} jobs into SQLite database`);

    return Promise.resolve();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// For manual testing/initialization
if (typeof window !== 'undefined') {
  (window as any).initDatabase = initializeDatabase;
}