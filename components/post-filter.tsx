"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import type { FilterStatus } from "@/lib/types"
import { DOMAIN_TAGS } from "@/lib/types"
import { Search, X, ChevronDown, ChevronUp, Filter } from "lucide-react"

interface PostFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: FilterStatus
  onStatusChange: (status: FilterStatus) => void
  selectedDomainTags: string[]
  onDomainTagsChange: (tags: string[]) => void
}

const statusOptions: FilterStatus[] = ["全部场景", "共创中", "已结束", "我的场景"]

export function PostFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  selectedDomainTags,
  onDomainTagsChange
}: PostFilterProps) {
  const [mounted, setMounted] = useState(false)
  const [showDomainTags, setShowDomainTags] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleDomainTagToggle = (tag: string) => {
    if (selectedDomainTags.includes(tag)) {
      onDomainTagsChange(selectedDomainTags.filter(t => t !== tag))
    } else {
      onDomainTagsChange([...selectedDomainTags, tag])
    }
  }

  const clearDomainTags = () => {
    onDomainTagsChange([])
  }

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 第一行：搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索标题或标签..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* 第二行：状态筛选 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 状态筛选 */}
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`px-3 py-1.5 text-sm rounded-full transition-all ${
              statusFilter === status
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* 第三行：领域标签（可折叠） */}
      <div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowDomainTags(!showDomainTags)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>领域筛选</span>
            {selectedDomainTags.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {selectedDomainTags.length}
              </span>
            )}
            {showDomainTags ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          
          {/* 清除已选按钮 - 放在标题行右侧，更显眼 */}
          {selectedDomainTags.length > 0 && (
            <button
              onClick={clearDomainTags}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
            >
              <X className="h-3 w-3" />
              清除已选
            </button>
          )}
        </div>
        
        {showDomainTags && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex flex-wrap gap-1.5">
              {DOMAIN_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleDomainTagToggle(tag)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                    selectedDomainTags.includes(tag)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
