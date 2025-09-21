"use client";

import { useState } from "react";

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

const locations: Location[] = [
  { name: "Zürich", latitude: 47.3769, longitude: 8.5417 },
  { name: "Aarau", latitude: 47.3925, longitude: 8.0444 },
  { name: "Baden", latitude: 47.4722, longitude: 8.3083 },
  { name: "Basel", latitude: 47.5596, longitude: 7.5886 },
  { name: "Bern", latitude: 46.9480, longitude: 7.4474 },
  { name: "Biel", latitude: 47.1368, longitude: 7.2470 },
  { name: "Chur", latitude: 46.8500, longitude: 9.5333 },
  { name: "Freiburg", latitude: 46.8065, longitude: 7.1615 },
  { name: "Genf", latitude: 46.2044, longitude: 6.1432 },
  { name: "Olten", latitude: 47.3500, longitude: 7.9167 },
];

interface LocationFiltersProps {
  onLocationClick?: (location: Location | null) => void;
  selectedLocationName?: string | null;
}

export function LocationFilters({ onLocationClick, selectedLocationName }: LocationFiltersProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const handleLocationClick = (locationName: string) => {
    const newSelectedLocation = selectedLocation === locationName ? null : locationName;
    setSelectedLocation(newSelectedLocation);

    // Find the location object and call the callback
    if (onLocationClick) {
      const location = newSelectedLocation
        ? locations.find(l => l.name === newSelectedLocation) || null
        : null;
      onLocationClick(location);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {locations.map((location) => {
        const isSelected = selectedLocation === location.name;
        const isAnySelected = selectedLocation !== null;
        const shouldBeGrey = isAnySelected && !isSelected;
        const isFocused = selectedLocationName === location.name;

        return (
          <button
            key={location.name}
            className={`cursor-pointer transition-all duration-300 font-nunito font-medium text-sm px-4 py-2 rounded-lg border-2 ${
              isFocused
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : shouldBeGrey
                  ? "bg-gray-100 text-gray-400 border-gray-200"
                  : isSelected
                    ? "bg-[#1065bb] text-white border-[#1065bb] shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#1065bb] hover:bg-blue-50 hover:text-[#1065bb]"
            }`}
            onClick={() => handleLocationClick(location.name)}
          >
            <span className="mr-2">{isFocused ? "📍" : ""}</span>
            {location.name}
          </button>
        );
      })}
    </div>
  );
}
