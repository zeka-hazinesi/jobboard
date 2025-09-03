import { Badge } from "@/components/ui/badge"

const techStack = [
  { name: "C/C++", icon: "🔷", color: "bg-blue-100 text-blue-800" },
  { name: "C#.NET", icon: "🔷", color: "bg-purple-100 text-purple-800" },
  { name: "Data", icon: "📊", color: "bg-red-100 text-red-800" },
  { name: "Golang", icon: "🐹", color: "bg-cyan-100 text-cyan-800" },
  { name: "Java", icon: "☕", color: "bg-orange-100 text-orange-800" },
  { name: "JavaScript", icon: "🟨", color: "bg-yellow-100 text-yellow-800" },
  { name: "Mobile", icon: "📱", color: "bg-green-100 text-green-800" },
  { name: "PHP", icon: "🐘", color: "bg-indigo-100 text-indigo-800" },
  { name: "Python", icon: "🐍", color: "bg-blue-100 text-blue-800" },
  { name: "Ruby", icon: "💎", color: "bg-red-100 text-red-800" },
  { name: "SAP", icon: "🔷", color: "bg-blue-100 text-blue-800" },
]

export function TechFilters() {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {techStack.map((tech) => (
        <Badge
          key={tech.name}
          variant="secondary"
          className={`${tech.color} cursor-pointer hover:opacity-80 transition-opacity`}
        >
          <span className="mr-1">{tech.icon}</span>
          {tech.name}
        </Badge>
      ))}
    </div>
  )
}
