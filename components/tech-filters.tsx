"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const techStack = [
  { name: "C/C++", icon: "🔷" },
  { name: "C#.NET", icon: "🔷" },
  { name: "Data", icon: "📊" },
  { name: "Golang", icon: "🐹" },
  { name: "Java", icon: "☕" },
  { name: "JavaScript", icon: "🟨" },
  { name: "Mobile", icon: "📱" },
  { name: "PHP", icon: "🐘" },
  { name: "Python", icon: "🐍" },
  { name: "Ruby", icon: "💎" },
  { name: "SAP", icon: "🔷" },
];

export function TechFilters() {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  const handleTechClick = (techName: string) => {
    setSelectedTech(selectedTech === techName ? null : techName);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {techStack.map((tech) => {
        const isSelected = selectedTech === tech.name;
        const isAnySelected = selectedTech !== null;
        const shouldBeGrey = isAnySelected && !isSelected;

        return (
          <Badge
            key={tech.name}
            variant="secondary"
            className={`cursor-pointer transition-all duration-200 hover:opacity-80 ${
              shouldBeGrey
                ? "bg-gray-200 text-gray-500"
                : isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => handleTechClick(tech.name)}
          >
            <span className="mr-1">{tech.icon}</span>
            {tech.name}
          </Badge>
        );
      })}
    </div>
  );
}
