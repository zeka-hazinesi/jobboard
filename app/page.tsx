"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { LocationFilters } from "@/components/location-filters";
import { JobListings } from "@/components/job-listings";
import { SwissMap } from "@/components/swiss-map";
import { SearchBar } from "@/components/search-bar";
import { useJobs } from "@/lib/use-jobs";

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export default function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { jobs, loading, error } = useJobs(selectedLocation, searchQuery);

  const handleLocationClick = (location: Location | null) => {
    setSelectedLocation(location);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
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
              />
            </div>
          </div>

          {/* Right side: Map */}
          <div className="lg:col-span-2 h-full">
            <SwissMap
              centerCoordinates={selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : null}
              selectedLocationName={selectedLocation?.name || null}
              zoomLevel={selectedLocation ? 11 : 8}
              hoveredJobId={hoveredJobId}
              onJobHover={setHoveredJobId}
              onJobClick={handleJobClick}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
