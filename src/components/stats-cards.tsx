import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatsCardsProps {
  stats: {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    trend?: string
  }[]
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">{stat.title}</CardTitle>
            <stat.icon size={18} className="text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.trend && (
              <p className="text-xs text-zinc-500 mt-1">{stat.trend}</p>
            )}
            {stat.description && (
              <p className="text-xs text-zinc-500 mt-1">{stat.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
