"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CoCreationPost } from "@/lib/types"
import { Calendar, User, Wallet } from "lucide-react"

interface PostCardProps {
  post: CoCreationPost
  isMyPost?: boolean  // 是否在"我的场景"模式
  onEnd?: (id: string) => void  // 结束帖子回调
  onEdit?: (id: string) => void  // 修改帖子回调
}

const statusColors: Record<string, string> = {
  "待审核": "bg-blue-100 text-blue-800 border-blue-200",
  "审核通过": "bg-green-100 text-green-800 border-green-200",
  "审核未通过": "bg-red-100 text-red-800 border-red-200",
  "共创中": "bg-amber-100 text-amber-800 border-amber-200",
  "已结束": "bg-muted text-muted-foreground border-border"
}

function PostCardContent({ post, displayTitle, domainTags, customTags }: { 
  post: CoCreationPost
  displayTitle: string
  domainTags: string[]
  customTags: string[] 
}) {
  return (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground leading-snug group-hover:text-foreground/80 transition-colors">
            {displayTitle}
          </h3>
          <Badge 
            variant="outline" 
            className={`shrink-0 text-xs ${statusColors[post.status]}`}
          >
            {post.status}
          </Badge>
        </div>
        {/* 发起方和预算 - 标题下方 */}
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>{post.initiator || "未知发起方"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">{post.budget ? `${post.budget} 元` : "面议"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {post.description}
        </p>
        
        <div className="flex flex-wrap gap-1.5 mb-4">
          {/* 先显示领域标签 */}
          {domainTags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="default" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
          {/* 再显示自定义标签 */}
          {customTags.slice(0, Math.max(0, 3 - domainTags.slice(0, 2).length)).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
          {(domainTags.length + customTags.length) > 3 && (
            <Badge variant="secondary" className="text-xs font-normal">
              +{domainTags.length + customTags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>展示截止时间：{post.endDate}</span>
          </div>
          <span className="text-primary font-medium">
            还剩{Math.max(0, Math.ceil((new Date(post.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}天
          </span>
        </div>
      </CardContent>
    </>
  )
}

export function PostCard({ post, isMyPost, onEnd, onEdit }: PostCardProps) {
  const domainTags = post.domainTags || []
  const customTags = post.customTags || []
  
  // 标题超过9个字时，显示前9个字符并添加省略号
  const MAX_TITLE_LENGTH = 9
  const displayTitle = post.title.length > MAX_TITLE_LENGTH 
    ? post.title.slice(0, MAX_TITLE_LENGTH) + "..." 
    : post.title

  // 处理结束
  const handleEnd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onEnd) {
      onEnd(post.id)
    }
  }

  // 处理修改
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onEdit) {
      onEdit(post.id)
    }
  }

  // 判断帖子状态
  const isEnded = post.status === "已结束"
  const isPending = post.status === "待审核"
  const isRejected = post.status === "审核未通过"
  const canEnd = post.status === "审核通过" || post.status === "共创中"
  
  // 已结束的帖子显示为不可操作状态
  if (isEnded) {
    return (
      <Card className="opacity-50 group relative">
        <PostCardContent 
          post={post} 
          displayTitle={displayTitle} 
          domainTags={domainTags} 
          customTags={customTags} 
        />
      </Card>
    )
  }

  // 待审核的帖子，在我的场景模式下显示修改按钮
  if (isPending) {
    if (isMyPost) {
      return (
        <Link href={`/post/${post.id}`}>
          <Card className="transition-all duration-200 cursor-pointer hover:shadow-md hover:border-foreground/20 group h-full">
            <PostCardContent 
              post={post} 
              displayTitle={displayTitle} 
              domainTags={domainTags} 
              customTags={customTags} 
            />
            <div className="px-4 pb-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={handleEdit}
              >
                修改共创
              </Button>
            </div>
          </Card>
        </Link>
      )
    }
    return (
      <Link href={`/post/${post.id}`}>
        <Card className="transition-all duration-200 cursor-pointer hover:shadow-md hover:border-foreground/20 group h-full">
          <PostCardContent 
            post={post} 
            displayTitle={displayTitle} 
            domainTags={domainTags} 
            customTags={customTags} 
          />
        </Card>
      </Link>
    )
  }

  // 审核未通过的帖子，显示修改按钮
  if (isMyPost && isRejected) {
    return (
      <Card className="group relative">
        <PostCardContent 
          post={post} 
          displayTitle={displayTitle} 
          domainTags={domainTags} 
          customTags={customTags} 
        />
        <div className="px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleEdit}
          >
            修改共创
          </Button>
        </div>
      </Card>
    )
  }

  // 我的场景模式下，审核通过/共创中的帖子显示结束按钮
  if (isMyPost && canEnd) {
    return (
      <Link href={`/post/${post.id}`}>
        <Card className="transition-all duration-200 cursor-pointer hover:shadow-md hover:border-foreground/20 group h-full">
          <PostCardContent 
            post={post} 
            displayTitle={displayTitle} 
            domainTags={domainTags} 
            customTags={customTags} 
          />
          <div className="px-4 pb-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleEnd}
            >
              结束共创
            </Button>
          </div>
        </Card>
      </Link>
    )
  }

  // 默认情况：可点击跳转到详情页
  return (
    <Link href={`/post/${post.id}`}>
      <Card className="transition-all duration-200 cursor-pointer hover:shadow-md hover:border-foreground/20 group h-full">
        <PostCardContent 
          post={post} 
          displayTitle={displayTitle} 
          domainTags={domainTags} 
          customTags={customTags} 
        />
      </Card>
    </Link>
  )
}
