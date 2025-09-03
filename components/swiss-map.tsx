import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Filter, ToggleLeft, Eye } from "lucide-react"

export function SwissMap() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Weitere Filter
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-sm">Salary stats</span>
              <ToggleLeft className="w-5 h-5 text-primary" />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm">Karte verstecken</span>
              <Eye className="w-4 h-4" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative">
          <img
            src="/placeholder-zz6w0.png"
            alt="Switzerland job map"
            className="w-full h-96 object-cover rounded-lg"
          />

          {/* Job location markers would be positioned absolutely over the map */}
          <div className="absolute top-1/4 left-1/3 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
            3
          </div>
          <div className="absolute top-1/3 right-1/4 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
            5
          </div>
          <div className="absolute bottom-1/3 left-1/4 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
            2
          </div>
          <div className="absolute top-1/2 right-1/3 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-sm font-semibold">
            117
          </div>
        </div>

        <div className="mt-4 flex justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded"></div>
            <span className="text-sm">LinkedIn</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded"></div>
            <span className="text-sm">Facebook</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-400 rounded"></div>
            <span className="text-sm">Twitter</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
