"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const locations = [
  "remote",
  "Zürich",
  "Aarau",
  "Baden",
  "Basel",
  "Bern",
  "Biel",
  "Chur",
  "Freiburg",
  "Genf",
  "Olten",
];

export function LocationFilters() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const handleLocationClick = (locationName: string) => {
    setSelectedLocation(
      selectedLocation === locationName ? null : locationName
    );
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {locations.map((location) => {
        const isSelected = selectedLocation === location;
        const isAnySelected = selectedLocation !== null;
        const shouldBeGrey = isAnySelected && !isSelected;

        return (
          <Badge
            key={location}
            variant="outline"
            className={`cursor-pointer transition-all duration-200 hover:opacity-80 ${
              shouldBeGrey
                ? "bg-gray-200 text-gray-500"
                : isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => handleLocationClick(location)}
          >
            {location}
          </Badge>
        );
      })}
    </div>
  );
}
