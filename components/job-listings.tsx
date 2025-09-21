"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building, ExternalLink } from "lucide-react";
import { useRef, useEffect } from "react";
import type { TransformedJob } from "@/lib/database";

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface JobListingsProps {
  jobs: TransformedJob[];
  loading: boolean;
  error: string | null;
  selectedLocation?: Location | null;
  hoveredJobId?: string | null;
  onJobHover?: (jobId: string | null) => void;
  selectedJobId?: string | null;
  searchQuery?: string;
}

export function JobListings({ jobs, loading, error, selectedLocation, hoveredJobId, onJobHover, selectedJobId, searchQuery }: JobListingsProps) {
  const jobItemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Scroll to selected job when selectedJobId changes
  useEffect(() => {
    if (selectedJobId && jobItemRefs.current[selectedJobId]) {
      jobItemRefs.current[selectedJobId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedJobId]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-3 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-lg border border-gray-200 animate-pulse bg-white">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-8 bg-gray-200 rounded w-32"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-center p-8 rounded-lg border border-red-200 bg-red-50">
            <p className="text-red-600 text-center font-nunito">Error loading jobs: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-4">
        {/* Search Results Indicator */}
        {searchQuery && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-blue-800 font-nunito">
                {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} für <span className="font-medium">"{searchQuery}"</span>
              </p>
            </div>
          </div>
        )}

        {jobs.length === 0 && selectedLocation && !searchQuery ? (
          <div className="flex items-center justify-center p-8 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-gray-600 text-center font-nunito">
              No jobs found in {selectedLocation.name}
            </p>
          </div>
        ) : jobs.length === 0 && searchQuery ? (
          <div className="flex items-center justify-center p-8 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-gray-600 text-center font-nunito">
              Keine Jobs gefunden für "{searchQuery}"
            </p>
          </div>
        ) : (
          jobs.map((job) => (
          <div
            key={job.id}
            ref={(el) => { jobItemRefs.current[job.id] = el; }}
            className={`flex items-start gap-4 p-3 rounded-lg border transition-all cursor-pointer group ${
              selectedJobId === job.id
                ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200'
                : hoveredJobId === job.id
                  ? 'border-[#1065bb] bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-[#1065bb] bg-white hover:shadow-md'
            }`}
            onMouseEnter={() => onJobHover?.(job.id)}
            onMouseLeave={() => onJobHover?.(null)}
          >
            {/* Job Content - Left Side */}
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <img
                src="/globe.svg"
                alt="Company logo"
                className="w-8 h-8 rounded object-cover flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 hover:text-[#1065bb] text-base leading-tight group-hover:text-[#1065bb]">
                    {job.title}
                  </h3>

                <div className="flex items-center text-base text-muted-foreground mt-2">
                  <Building className="w-4 h-4 mr-2" />
                  <span className="truncate mr-3 font-medium">{job.company}</span>
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate font-medium">{job.location}</span>
                </div>

              </div>
            </div>

            {/* Action Buttons - Right Side */}
            <div className="flex flex-col gap-2 items-end justify-start flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-sm h-8 w-32 justify-between cursor-pointer"
                disabled={!job.link}
                onClick={(e) => {
                  e.stopPropagation();
                  if (job.link) {
                    window.open(job.link, '_blank');
                  }
                }}
              >
                <span>Zum Job</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>

              <Button
                variant="default"
                size="sm"
                className="text-sm h-8 w-32 justify-between cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const baseUrl = 'https://anschreibenai.com';
                  const jobUrl = job.link ? encodeURIComponent(job.link) : '';
                  const finalUrl = jobUrl ? `${baseUrl}?link=${jobUrl}` : baseUrl;
                  window.open(finalUrl, '_blank');
                }}
              >
                <span>Anschreiben</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
