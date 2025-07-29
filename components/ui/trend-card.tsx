"use client"

import React from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { 
  Clock, 
  MessageCircle, 
  ExternalLink, 
  X, 
  Heart,
  Share2,
  Eye,
  Flame,
  BarChart3
} from "lucide-react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import { cn } from "@/lib/utils"
import type { RankedTrend } from "@/lib/trend-ranking"

interface TrendCardProps {
  trend: RankedTrend
  onDelete?: (trendId: string) => void
  className?: string
}

const TrendCard = ({ trend, onDelete, className }: TrendCardProps) => {
  // Prepare chart data for confidence visualization
  const chartData = [
    {
      category: "confidence",
      score: Math.round(trend.score.overall * 100),
      recency: Math.round(trend.score.recency * 100),
      popularity: Math.round(trend.score.popularity * 100),
      engagement: Math.round(trend.score.engagement * 100),
    }
  ]

  const chartConfig = {
    score: {
      label: "Overall Score",
      color: "hsl(var(--chart-1))",
    },
    recency: {
      label: "Recency",
      color: "hsl(var(--chart-2))",
    },
    popularity: {
      label: "Popularity", 
      color: "hsl(var(--chart-3))",
    },
    engagement: {
      label: "Engagement",
      color: "hsl(var(--chart-4))",
    },
  }

  // Get relevant icon based on highest scoring metric
  const getRelevantIcon = () => {
    const { recency, popularity, engagement } = trend.score
    const max = Math.max(recency, popularity, engagement)
    
    if (max === recency) return <Clock className="h-4 w-4 text-blue-500" />
    if (max === popularity) return <Flame className="h-4 w-4 text-red-500" />
    return <MessageCircle className="h-4 w-4 text-green-500" />
  }

  // Format time ago
  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24)
      return `${days}d ago`
    } else if (diffHours >= 1) {
      return `${diffHours}h ago`
    } else {
      return `${diffMins}m ago`
    }
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      technology: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      business: "bg-green-500/10 text-green-500 border-green-500/20",
      social: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      entertainment: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      science: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      general: "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
    return colors[category as keyof typeof colors] || colors.general
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1",
      "border-border/50 hover:border-primary/50",
      "bg-gradient-to-br from-card to-card/50",
      className
    )}>
      {/* Delete Button */}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(trend.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Confidence Chart - Top Right */}
      <div className="absolute top-4 right-12 opacity-80 group-hover:opacity-100 transition-opacity">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-16 h-16"
        >
                      <RadialBarChart
              data={chartData}
              startAngle={90}
              endAngle={450}
              innerRadius={12}
              outerRadius={28}
            >
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <PolarRadiusAxis 
                tick={false} 
                tickLine={false} 
                axisLine={false}
                domain={[0, 100]}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 2}
                            className="fill-foreground text-xs font-bold"
                          >
                            {chartData[0].score}%
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
              <RadialBar
                dataKey="score"
                cornerRadius={4}
                fill="var(--color-score)"
                className="stroke-transparent"
                background={{ fill: "hsl(var(--muted))" }}
              />
            </RadialBarChart>
        </ChartContainer>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-20">
            <div className="flex items-center gap-2 mb-2">
              {getRelevantIcon()}
              <span className={cn(
                "px-2 py-1 rounded-md text-xs font-medium border",
                getCategoryColor(trend.category)
              )}>
                {trend.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {getTimeAgo(trend.timestamp)}
              </span>
            </div>
            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
              {trend.title}
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              {trend.source} • {trend.sourceType.toUpperCase()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {trend.content}
        </p>
        
        {/* Metrics Row */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
          {trend.metrics.views && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {trend.metrics.views.toLocaleString()}
            </div>
          )}
          {trend.metrics.likes && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" />
              {trend.metrics.likes.toLocaleString()}
            </div>
          )}
          {(trend.metrics.shares || trend.metrics.retweets) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Share2 className="h-3 w-3" />
              {((trend.metrics.shares || 0) + (trend.metrics.retweets || 0)).toLocaleString()}
            </div>
          )}
          {trend.metrics.comments && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="h-3 w-3" />
              {trend.metrics.comments.toLocaleString()}
            </div>
          )}
        </div>

        {/* Tags */}
        {trend.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {trend.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-accent/50 text-accent-foreground rounded-md"
              >
                #{tag}
              </span>
            ))}
            {trend.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                +{trend.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Score: {(trend.score.overall * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="text-xs text-muted-foreground">
              R:{(trend.score.recency * 100).toFixed(0)}% 
              P:{(trend.score.popularity * 100).toFixed(0)}% 
              E:{(trend.score.engagement * 100).toFixed(0)}%
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            onClick={() => window.open(trend.url, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </CardFooter>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />
    </Card>
  )
}

export { TrendCard } 