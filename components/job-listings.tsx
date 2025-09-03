import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building } from "lucide-react";

const jobs = [
  {
    id: 1,
    title: "SAP Sales & Distribution Engineer",
    company: "Ypsomed AG",
    location: "Brunmattstrasse 6, Burgdorf",
    salary: "CHF 120'000 - 145'000",
    tags: ["CRM", "Support", "ROS"],
    logo: "/ypsomed-logo.jpg",
  },
  {
    id: 2,
    title: "Senior Rust Engineer (a)",
    company: "ERNI Schweiz AG",
    location: "Löwenstrasse 11, Zürich",
    salary: "CHF 100'000 - 130'000",
    tags: ["Azure", "C#", "CI/CD"],
    logo: "/placeholder-dyddw.png",
  },
  {
    id: 3,
    title: "Business Development Manager - Industry (a)",
    company: "ERNI Schweiz AG",
    location: "Löwenstrasse 11, Zürich",
    salary: "CHF 100'000 - 130'000",
    tags: [],
    logo: "/placeholder-dyddw.png",
  },
  {
    id: 4,
    title: "Cloud Support Engineer (f/x/m) 60-100% - Zürich",
    company: "Ventoo AG",
    location: "Raffelstrasse 24, Zürich",
    salary: "CHF 70'000 - 85'000",
    tags: [],
    logo: "/ventoo-logo.jpg",
  },
  {
    id: 5,
    title: "Chief Technology Officer (pre-IPO)",
    company: "Rockstar Recruiting AG",
    location: "Seidengasse 6, Zürich",
    salary: "CHF 300'000 - 340'000",
    tags: ["Azure", "Salesforce", "Python"],
    logo: "/rockstar-logo.jpg",
  },
  {
    id: 6,
    title: "Senior .NET Software Engineer (bis 80% remote)",
    company: "Domino Graph-Tech AG",
    location: "Binzenholzstrasse 18, Eglisau",
    salary: "CHF 110'000 - 130'000",
    tags: ["C#", "Confluence", "Git"],
    logo: "/placeholder-ww0if.png",
  },
];

export function JobListings() {
  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card
          key={job.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <img
                  src="/globe.svg"
                  alt="Globe"
                  className="w-10 h-10 rounded object-cover"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-card-foreground hover:text-primary">
                        {job.title}
                      </h3>

                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Building className="w-4 h-4 mr-1" />
                        <span className="mr-3">{job.company}</span>
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{job.location}</span>
                      </div>

                      {job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-green-600 font-semibold text-sm">
                        {job.salary}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
