"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

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

interface Job {
  _id: string;
  company: string;
  name: string;
  actualCity: string;
  latitude: number;
  longitude: number;
  workplace?: string;
}

export default function SwissMapClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await fetch("/jobsLight.json");
        const jobsData = await response.json();

        // Filter jobs with valid coordinates
        const validJobs = jobsData.filter(
          (job: any) =>
            job.latitude &&
            job.longitude &&
            job.latitude >= 45.8 &&
            job.latitude <= 47.8 && // Switzerland latitude bounds
            job.longitude >= 5.9 &&
            job.longitude <= 10.5 // Switzerland longitude bounds
        );

        setJobs(validJobs);
      } catch (error) {
        console.error("Error loading jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  // Switzerland center coordinates
  const center: [number, number] = [46.8182, 8.2275];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-sm text-gray-500">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <MapContainer
        center={center}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {jobs.map((job) => (
          <Marker key={job._id} position={[job.latitude, job.longitude]}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{job.company}</h3>
                <p className="text-xs text-gray-600">{job.name}</p>
                <p className="text-xs text-gray-500">{job.actualCity}</p>
                {job.workplace && (
                  <p className="text-xs text-blue-600 mt-1">{job.workplace}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
