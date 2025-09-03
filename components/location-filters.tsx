import { Badge } from "@/components/ui/badge"

const locations = ["remote", "Zürich", "Aarau", "Baden", "Basel", "Bern", "Biel", "Chur", "Freiburg", "Genf", "Olten"]

export function LocationFilters() {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {locations.map((location) => (
        <Badge key={location} variant="outline" className="cursor-pointer hover:bg-muted transition-colors">
          {location}
        </Badge>
      ))}
    </div>
  )
}
