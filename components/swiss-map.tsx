"use client";

import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const DynamicMap = dynamic(() => import("@/components/swiss-map-client"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-sm text-gray-600 font-nunito">Loading map...</div>
    </div>
  ),
});

interface SwissMapProps {
  centerCoordinates?: [number, number] | null;
  selectedLocationName?: string | null;
  zoomLevel?: number;
  hoveredJobId?: string | null;
  onJobHover?: (jobId: string | null) => void;
  onJobClick?: (jobId: string) => void;
}

export function SwissMap({ centerCoordinates, selectedLocationName, zoomLevel, hoveredJobId, onJobHover, onJobClick }: SwissMapProps) {
  return <DynamicMap centerCoordinates={centerCoordinates} selectedLocationName={selectedLocationName} zoomLevel={zoomLevel} hoveredJobId={hoveredJobId} onJobHover={onJobHover} onJobClick={onJobClick} />;
}
