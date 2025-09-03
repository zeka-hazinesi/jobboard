"use client";

import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const DynamicMap = dynamic(() => import("@/components/swiss-map-client"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-sm text-gray-500">Loading map...</div>
    </div>
  ),
});

export function SwissMap() {
  return <DynamicMap />;
}
