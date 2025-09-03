import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold">Jobboard</div>
          </div>
        </div>
      </div>
    </header>
  );
}
