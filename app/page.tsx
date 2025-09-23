"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { LocationFilters } from "@/components/location-filters";
import { JobListings } from "@/components/job-listings";
import { SearchBar } from "@/components/search-bar";
import { Suspense, lazy } from "react";

// Lazy load components that aren't immediately visible
const SwissMap = lazy(() => import("@/components/swiss-map").then(module => ({ default: module.SwissMap })));
const JobContentViewer = lazy(() => import("@/components/job-content-viewer").then(module => ({ default: module.JobContentViewer })));
import { useOptimizedJobs } from "@/lib/use-optimized-jobs";
import type { TransformedJob } from "@/lib/optimized-jobs-data-service";

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export default function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<TransformedJob | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { jobs, loading, error, hasMore, totalJobs, loadMore } = useOptimizedJobs(selectedLocation, searchQuery);

  // Log the number of jobs being displayed
  console.log(`Currently showing ${jobs.length} jobs`);

  const handleLocationClick = (location: Location | null) => {
    setSelectedLocation(location);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleJobClick = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setSelectedJobId(jobId);
    }
  };

  const handleCloseJobViewer = () => {
    setSelectedJob(null);
    setSelectedJobId(null);
  };
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 w-full px-4 py-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full w-full">
          {/* Left side: Title, Filters and Job List */}
          <div className="lg:col-span-3 space-y-4 overflow-hidden flex flex-col">
            {/* Title Section */}
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold font-nunito text-[#1065bb] mb-3">
                Jobs in der Schweiz
              </h1>
            </div>

            {/* Search Section */}
            <div className="flex-shrink-0 mb-4">
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* Filters Section */}
            <div className="flex-shrink-0">
              <LocationFilters
                onLocationClick={handleLocationClick}
                selectedLocationName={selectedLocation?.name || null}
              />
            </div>

            {/* Job List Section */}
            <div className="flex-1 overflow-hidden">
              <JobListings
                jobs={jobs}
                loading={loading}
                error={error}
                selectedLocation={selectedLocation}
                hoveredJobId={hoveredJobId}
                onJobHover={setHoveredJobId}
                selectedJobId={selectedJobId}
                searchQuery={searchQuery}
                onJobClick={handleJobClick}
                hasMore={hasMore}
                totalJobs={totalJobs}
                onLoadMore={loadMore}
              />
            </div>
          </div>

          {/* Right side: Map or Job Content Viewer */}
          <div className="lg:col-span-2 h-full">
            <Suspense fallback={
              <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Lade...</p>
                </div>
              </div>
            }>
              {selectedJob ? (
                <JobContentViewer
                  selectedJob={selectedJob}
                  onClose={handleCloseJobViewer}
                />
              ) : (
                <SwissMap
                  centerCoordinates={selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : null}
                  selectedLocationName={selectedLocation?.name || null}
                  zoomLevel={selectedLocation ? 11 : 8}
                  hoveredJobId={hoveredJobId}
                  onJobHover={setHoveredJobId}
                  onJobClick={undefined}
                />
              )}
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
