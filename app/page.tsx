import { Header } from "@/components/header"
import { TechFilters } from "@/components/tech-filters"
import { LocationFilters } from "@/components/location-filters"
import { JobListings } from "@/components/job-listings"
import { SwissMap } from "@/components/swiss-map"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            IT & Softwareentwickler Stellenangebote in der Schweiz
          </h1>

          <TechFilters />
          <LocationFilters />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <JobListings />
          </div>

          <div className="lg:sticky lg:top-6 h-fit">
            <SwissMap />
          </div>
        </div>
      </main>
    </div>
  )
}
