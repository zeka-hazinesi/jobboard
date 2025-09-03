import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold">SD:&gt;_</div>

            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="hover:text-blue-200">
                Jobs
              </a>
              <a href="#" className="hover:text-blue-200">
                Transparente Arbeitgeber
              </a>

              <div className="flex items-center space-x-1 hover:text-blue-200 cursor-pointer">
                <span>Gehälter</span>
                <ChevronDown className="w-4 h-4" />
              </div>

              <div className="flex items-center space-x-1 hover:text-blue-200 cursor-pointer">
                <span>Für Jobsuchende</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-1 hover:text-blue-200 cursor-pointer">
                <span>Andere Länder</span>
                <ChevronDown className="w-4 h-4" />
              </div>

              <a href="#" className="hover:text-blue-200">
                Über uns
              </a>

              <div className="flex items-center space-x-1 hover:text-blue-200 cursor-pointer">
                <span>Für Arbeitgeber</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <Button variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white">
              Job veröffentlichen / Einloggen
            </Button>

            <div className="flex items-center space-x-2">
              <img src="/uk-flag.png" alt="English" className="w-6 h-4" />
              <img src="/german-flag.png" alt="Deutsch" className="w-6 h-4" />
              <img src="/french-flag.png" alt="Français" className="w-6 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
