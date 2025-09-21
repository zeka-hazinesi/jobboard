import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function Header() {
  return (
    <header className="bg-[#1066bc] text-white">
      <div className="w-full px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold font-nunito">Jobboard</div>
          </div>
        </div>
      </div>
    </header>
  );
}
