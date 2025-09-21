"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import { useJobs } from "@/lib/use-jobs";
import type { TransformedJob } from "@/lib/database";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Job extends TransformedJob {
  _id: string;
  name: string; // This will be mapped from title
  actualCity: string; // This will be mapped from location
}

interface SwissMapClientProps {
  centerCoordinates?: [number, number] | null;
  selectedLocationName?: string | null;
  zoomLevel?: number;
  hoveredJobId?: string | null;
  onJobHover?: (jobId: string | null) => void;
  onJobClick?: (jobId: string) => void;
}

// Component to handle map updates
function MapUpdater({ centerCoordinates, zoomLevel }: { centerCoordinates?: [number, number] | null; zoomLevel?: number }) {
  const map = useMap();

  useEffect(() => {
    if (centerCoordinates) {
      map.setView(centerCoordinates, zoomLevel || 8);
    }
  }, [centerCoordinates, zoomLevel, map]);

  return null;
}

export default function SwissMapClient({ centerCoordinates, selectedLocationName, zoomLevel = 8, hoveredJobId, onJobHover, onJobClick }: SwissMapClientProps) {
  const { jobs: rawJobs, loading } = useJobs();

  // Transform jobs to include additional fields needed by the map
  const jobs: Job[] = rawJobs
    .map((job) => ({
      ...job,
      _id: job.id,
      name: job.title,
      actualCity: job.location.split(', ').pop() || 'Unknown',
    }))
    .filter(
      (job) =>
        job.latitude >= 45.8 &&
        job.latitude <= 47.8 && // Switzerland latitude bounds
        job.longitude >= 5.9 &&
        job.longitude <= 10.5 // Switzerland longitude bounds
    );

  // Default to Switzerland center, but use provided coordinates if available
  const center: [number, number] = centerCoordinates || [46.8182, 8.2275];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-sm text-gray-600 font-nunito">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoomLevel}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater centerCoordinates={centerCoordinates} zoomLevel={zoomLevel} />
        {jobs.map((job) => (
          <Marker
            key={job._id}
            position={[job.latitude, job.longitude]}
            eventHandlers={{
              mouseover: () => onJobHover?.(job._id),
              mouseout: () => onJobHover?.(null),
              click: () => onJobClick?.(job._id),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{job.company}</h3>
                <p className="text-xs text-gray-600">{job.name}</p>
                <p className="text-xs text-gray-500">{job.actualCity}</p>
                {job.location && (
                  <p className="text-xs text-blue-600 mt-1">{job.location}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-md z-[1000]">
        <div className="text-sm font-medium text-gray-700">
          {selectedLocationName ? (
            <div className="flex items-center gap-2">
              <span className="text-[#1065bb]">📍</span>
              <span>Jobs in {selectedLocationName} area</span>
            </div>
          ) : (
            <p>{jobs.length} job{jobs.length !== 1 ? 's' : ''} across Switzerland</p>
          )}
        </div>
      </div>
    </div>
  );
}
