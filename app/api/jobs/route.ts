import { NextResponse } from 'next/server';
import jobsData from '../../../jobsLight.json';

export async function GET() {
  try {
    // Transform the data to match the expected format in the component
    const transformedJobs = jobsData.map((job: any, index: number) => ({
      id: index + 1,
      title: job.name || job.title || 'No Title',
      company: job.company || 'Unknown Company',
      location: job.address && job.actualCity 
        ? `${job.address}, ${job.actualCity}` 
        : job.actualCity || job.address || 'Location not specified',
      salary: job.annualSalaryFrom && job.annualSalaryTo 
        ? `CHF ${job.annualSalaryFrom.toLocaleString()} - ${job.annualSalaryTo.toLocaleString()}`
        : job.annualSalaryFrom 
          ? `CHF ${job.annualSalaryFrom.toLocaleString()}+`
          : 'Salary not specified',
      tags: job.technologies || job.filterTags || job.techTags || job.tags || [],
      logo: job.logoImg ? `/logos/${job.logoImg}` : '/globe.svg',
    }));

    return NextResponse.json(transformedJobs);
  } catch (error) {
    console.error('Error loading jobs data:', error);
    return NextResponse.json(
      { error: 'Failed to load jobs data' },
      { status: 500 }
    );
  }
}
