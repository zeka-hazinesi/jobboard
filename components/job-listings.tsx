"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building, ExternalLink } from "lucide-react";
import { useRef, useEffect, memo, useMemo, useCallback } from "react";
import type { TransformedJob } from "@/lib/optimized-jobs-data-service";

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
  onJobClick?: (jobId: string) => void;
  hasMore?: boolean;
  totalJobs?: number;
  onLoadMore?: () => Promise<void>;
}

export const JobListings = memo(function JobListings({ jobs, loading, error, selectedLocation, hoveredJobId, onJobHover, selectedJobId, searchQuery, onJobClick, hasMore, totalJobs, onLoadMore }: JobListingsProps) {
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

  // Memoized job item component
  const JobItem = memo(function JobItem({ job }: { job: TransformedJob }) {
    const isSelected = selectedJobId === job.id;
    const isHovered = hoveredJobId === job.id;

    const handleMouseEnter = useCallback(() => {
      onJobHover?.(job.id);
    }, [onJobHover, job.id]);

    const handleMouseLeave = useCallback(() => {
      onJobHover?.(null);
    }, [onJobHover]);

    const handleJobItemClick = useCallback(() => {
      onJobClick?.(job.id);
    }, [onJobClick, job.id]);

    const handleJobClick = useCallback(() => {
      if (job.link) {
        window.open(job.link, '_blank');
      }
    }, [job.link]);

    const handleApplyClick = useCallback(() => {
      const baseUrl = 'https://anschreibenai.com';
      const jobUrl = job.link ? encodeURIComponent(job.link) : '';
      const finalUrl = jobUrl ? `${baseUrl}?link=${jobUrl}` : baseUrl;
      window.open(finalUrl, '_blank');
    }, [job.link]);

    const itemClass = useMemo(() =>
      `flex items-start gap-4 p-3 rounded-lg border transition-all cursor-pointer group ${
        isSelected
          ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200'
          : isHovered
            ? 'border-[#1065bb] bg-blue-50 shadow-md'
            : 'border-gray-200 hover:border-[#1065bb] bg-white hover:shadow-md hover:bg-blue-25'
      }`,
      [isSelected, isHovered]
    );

    return (
      <div
        ref={(el) => { jobItemRefs.current[job.id] = el; }}
        className={itemClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleJobItemClick}
      >
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

        <div className="flex flex-col gap-2 items-end justify-start flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-sm h-8 w-32 justify-between cursor-pointer"
            disabled={!job.link}
            onClick={handleJobClick}
          >
            <span>Zum Job</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>

          <Button
            variant="default"
            size="sm"
            className="text-sm h-8 w-32 justify-between cursor-pointer"
            onClick={handleApplyClick}
          >
            <span>Anschreiben</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    );
  });

  // Memoized job count indicator (always visible)
  const jobCountIndicator = useMemo(() => {
    const total = totalJobs || jobs.length;
    const loaded = jobs.length;
    const showLoadMore = hasMore && !loading;

    return (
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <p className="text-sm text-blue-800 font-nunito">
            {loaded} von {total} {loaded === 1 ? 'Job' : 'Jobs'} {searchQuery ? `für "${searchQuery}"` : 'verfügbar'}
          </p>
        </div>
        {showLoadMore && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-3"
            onClick={onLoadMore}
          >
            Mehr laden
          </Button>
        )}
      </div>
    );
  }, [jobs.length, totalJobs, searchQuery, hasMore, loading, onLoadMore]);

  // Memoized empty state messages
  const emptyStateMessage = useMemo(() => {
    if (jobs.length === 0 && selectedLocation && !searchQuery) {
      return (
        <div className="flex items-center justify-center p-8 rounded-lg border border-gray-200 bg-gray-50">
          <p className="text-gray-600 text-center font-nunito">
            No jobs found in {selectedLocation.name}
          </p>
        </div>
      );
    }

    if (jobs.length === 0 && searchQuery) {
      return (
        <div className="flex items-center justify-center p-8 rounded-lg border border-gray-200 bg-gray-50">
          <p className="text-gray-600 text-center font-nunito">
            Keine Jobs gefunden für &quot;{searchQuery}&quot;
          </p>
        </div>
      );
    }

    return null;
  }, [jobs.length, selectedLocation, searchQuery]);

  if (loading && jobs.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-3 space-y-4">
          {/* Job count skeleton */}
          <Skeleton className="h-12 w-full rounded-lg" />

          {/* Job items skeleton */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 bg-white">
              <Skeleton className="w-8 h-8 rounded flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-32" />
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
        {jobCountIndicator}

        {emptyStateMessage || (
          jobs.map((job, index) => {
            // Safety check for duplicate IDs
            const duplicateIndex = jobs.findIndex((j, i) => i !== index && j.id === job.id);
            if (duplicateIndex !== -1) {
              console.warn(`⚠️ Duplicate job ID detected: ${job.id} (at index ${index} and ${duplicateIndex})`);
            }

            return <JobItem key={job.id} job={job} />;
          })
        )}
      </div>
    </div>
  );
});
