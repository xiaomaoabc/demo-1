"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PostCard } from "@/components/post-card"
import { PostFilter } from "@/components/post-filter"
import { getAllPosts, CURRENT_USER_ID, endPost } from "@/lib/store"
import type { CoCreationPost, FilterStatus } from "@/lib/types"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const POSTS_PER_PAGE = 9

export default function HomePage() {
  const [posts, setPosts] = useState<CoCreationPost[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("全部场景")
  const [selectedDomainTags, setSelectedDomainTags] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("1")
  const router = useRouter()

  // 从 localStorage 加载帖子数据
  useEffect(() => {
    setPosts(getAllPosts())
  }, [])

  const filteredPosts = useMemo(() => {
    // 先筛选
    const filtered = posts.filter((post) => {
      // 搜索过滤（支持标题和标签）
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchTitle = post.title.toLowerCase().includes(query)
        const domainTags = post.domainTags || []
        const customTags = post.customTags || []
        const matchTags = [...domainTags, ...customTags].some(tag => tag.toLowerCase().includes(query))
        if (!matchTitle && !matchTags) {
          return false
        }
      }

      // 状态过滤
      if (statusFilter === "我的场景") {
        // 我的场景：只显示当前用户的帖子
        if (post.authorId !== CURRENT_USER_ID) return false
      } else if (statusFilter === "全部场景") {
        // 全部场景：不显示待审核和审核未通过的帖子
        if (post.status === "待审核" || post.status === "审核未通过") return false
      } else {
        // 其他状态筛选（共创中、已结束）
        if (post.status !== statusFilter) return false
      }

      // 领域标签过滤
      if (selectedDomainTags.length > 0) {
        const postDomainTags = post.domainTags || []
        // 帖子至少包含一个选中的领域标签
        const hasMatchingTag = selectedDomainTags.some(tag => postDomainTags.includes(tag))
        if (!hasMatchingTag) {
          return false
        }
      }

      return true
    })

    // 排序：已结束的帖子永远排在后面，其他按发布时间倒序（新的靠前）
    return filtered.sort((a, b) => {
      // 如果一个已结束，一个未结束，已结束的排后面
      if (a.status === "已结束" && b.status !== "已结束") return 1
      if (a.status !== "已结束" && b.status === "已结束") return -1
      // 其他情况按发布时间倒序
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [posts, searchQuery, statusFilter, selectedDomainTags])

  // 计算分页
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE))
  
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE
    return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE)
  }, [filteredPosts, currentPage])

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1)
    setPageInput("1")
  }, [searchQuery, statusFilter, selectedDomainTags])

  // 当页码变化时，更新输入框
  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const page = parseInt(pageInput, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    } else {
      setPageInput(String(currentPage))
    }
  }

  // 结束单个帖子
  const handleEndPost = (id: string) => {
    if (confirm("确定要结束这个共创帖吗？结束后将不能再接收新的参与者。")) {
      const success = endPost(id)
      if (success) {
        setPosts(getAllPosts())
      }
    }
  }

  // 修改帖子（跳转到编辑页面）
  const handleEditPost = (id: string) => {
    router.push(`/create?edit=${id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                共创中心
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                分享AI应用场景，找到志同道合的共创伙伴
              </p>
            </div>
            <div className="text-right">
              <Link href="/create">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  发起共创
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-1.5">
                发布后将进行内容审核，审核通过后即可展示
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选区域 */}
        <div className="mb-8">
          <PostFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            selectedDomainTags={selectedDomainTags}
            onDomainTagsChange={setSelectedDomainTags}
          />
        </div>

        {/* 共创帖列表 */}
        {paginatedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isMyPost={statusFilter === "我的场景"}
                onEnd={handleEndPost}
                onEdit={handleEditPost}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">暂无符合条件的共创帖</p>
          </div>
        )}

        {/* 分页控制 */}
        {filteredPosts.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>第</span>
              <form onSubmit={handlePageInputSubmit} className="inline">
                <Input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handlePageInputSubmit}
                  className="w-12 h-8 text-center px-1"
                />
              </form>
              <span>/ {totalPages} 页</span>
              <span className="ml-2 text-xs">(共 {filteredPosts.length} 条)</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

    </div>
  )
}
