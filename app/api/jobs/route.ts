import { NextResponse } from 'next/server';
import jobsData from '../../../transformed_jobs.json';

export async function GET() {
  try {
    // Extract jobs array from the transformed data
    const jobs = jobsData.jobs;

    // Transform the data to match the expected format in the component
    const transformedJobs = jobs
      .filter((job: any) => job.locations && job.locations.length > 0) // Filter out jobs without locations
      .filter((job: any) => {
        const location = job.locations[0];
        return location.latitude && location.longitude &&
               !isNaN(location.latitude) && !isNaN(location.longitude);
      }) // Filter out jobs with invalid coordinates
      .map((job: any, index: number) => {
        // Get the first location (assuming there's at least one)
        const location = job.locations[0];
        const city = location.city || 'Location not specified';
        const address = location.address || '';

        // Create unique ID by combining original ID with index to avoid duplicates
        const uniqueId = job.id ? `${job.id}-${index}` : `job-${index}`;

        return {
          id: uniqueId,
          originalId: job.id, // Keep original ID for reference
          title: job.title || 'No Title',
          company: job.company || 'Unknown Company',
          location: address ? `${address}, ${city}` : city,
          latitude: location.latitude,
          longitude: location.longitude,
          link: job.link || null, // Job application link
          salary: 'Salary not specified', // This data is not available in transformed_jobs.json
          tags: job.categories || [],
          logo: '/globe.svg', // This data is not available in transformed_jobs.json
        };
      });

    return NextResponse.json(transformedJobs);
  } catch (error) {
    console.error('Error loading jobs data:', error);
    return NextResponse.json(
      { error: 'Failed to load jobs data' },
      { status: 500 }
    );
  }
}
