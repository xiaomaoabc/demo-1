"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAllPosts } from "@/lib/store"
import type { CoCreationPost } from "@/lib/types"
import { Phone, MessageCircle, Copy, Check, Download, FileText, Mail, ArrowLeft, User, Pencil } from "lucide-react"

interface CopyableContactProps {
  icon: React.ReactNode
  label: string
  value: string | undefined
}

function CopyableContact({ icon, label, value }: CopyableContactProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const hasValue = value && value.trim() !== ""
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground shrink-0 whitespace-nowrap">{label}：</span>
      {hasValue ? (
        <>
          <span className="font-mono truncate">{value}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </>
      ) : (
        <span className="text-muted-foreground">无</span>
      )}
    </div>
  )
}

const statusColors: Record<string, string> = {
  "待审核": "bg-blue-100 text-blue-800 border-blue-200",
  "共创中": "bg-amber-100 text-amber-800 border-amber-200",
  "已结束": "bg-muted text-muted-foreground border-border"
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<CoCreationPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const posts = getAllPosts()
    const foundPost = posts.find(p => p.id === params.id)
    setPost(foundPost || null)
    setLoading(false)
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">帖子不存在或已被删除</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Button>
      </div>
    )
  }

  const domainTags = post.domainTags || []
  const customTags = post.customTags || []
  const hasAttachments = (post.descriptionFiles && post.descriptionFiles.length > 0) || (post.resourceFiles && post.resourceFiles.length > 0)

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  共创详情
                </h1>
              </div>
            </div>
            {/* 待审核状态显示修改按钮 */}
            {post.status === "待审核" && (
              <Button
                size="sm"
                onClick={() => router.push(`/create?edit=${post.id}`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                修改共创
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 - 左右两栏布局 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* 左栏：标题、场景描述、相关标签、附件 - 合并为一个大卡片 */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* 标题 */}
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold text-foreground leading-relaxed">
                  {post.title}
                </h2>
                <Badge 
                  variant="outline" 
                  className={`shrink-0 text-sm px-3 py-1 ${statusColors[post.status]}`}
                >
                  {post.status}
                </Badge>
              </div>

              {/* 场景描述 */}
              <div>
                <h3 className="text-sm font-medium mb-3 text-foreground">场景描述</h3>
                <textarea
                  readOnly
                  value={post.description}
                  className="w-full h-[200px] px-3 py-2 text-sm text-muted-foreground rounded-md border border-input bg-muted/30 resize-none overflow-y-auto leading-relaxed"
                />
              </div>

              {/* 相关标签 */}
              <div>
                <h3 className="text-sm font-medium mb-3 text-foreground">相关标签</h3>
                {(domainTags.length > 0 || customTags.length > 0) ? (
                  <div className="flex flex-wrap gap-2">
                    {domainTags.map((tag) => (
                      <Badge key={tag} variant="default" className="font-normal text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {customTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="font-normal text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">无</p>
                )}
              </div>

              {/* 附件 */}
              <div>
                <h3 className="text-sm font-medium mb-3 text-foreground">附件</h3>
                {hasAttachments ? (
                  <div className="space-y-4">
                    {/* 关联描述文件 */}
                    {post.descriptionFiles && post.descriptionFiles.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">关联描述文件</p>
                        <div className="space-y-2">
                          {post.descriptionFiles.map((file, index) => (
                            <div 
                              key={index} 
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm truncate" title={file.name}>{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs shrink-0"
                                onClick={() => {
                                  const link = document.createElement("a")
                                  link.href = file.url
                                  link.download = file.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 资源包 */}
                    {post.resourceFiles && post.resourceFiles.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">资源包</p>
                        <div className="space-y-2">
                          {post.resourceFiles.map((file, index) => (
                            <div 
                              key={index} 
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm truncate" title={file.name}>{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs shrink-0"
                                onClick={() => {
                                  const link = document.createElement("a")
                                  link.href = file.url
                                  link.download = file.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">无</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 右栏：基本信息、联系方式 */}
          <div className="space-y-4">
            {/* 基本信息 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-4 text-foreground">基本信息</h3>
                <div className="space-y-4">
                  {/* 用户头像及账号 */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{post.authorName}</p>
                      <p className="text-xs text-muted-foreground">发布者</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0 whitespace-nowrap">发起方：</span>
                      <span className="truncate">{post.initiator || "未填写"}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0 whitespace-nowrap">共创截止时间：</span>
                      <span className="truncate">{post.endDate}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0 whitespace-nowrap">预期成果形式：</span>
                      <span className="truncate">{post.expectedOutput || "未填写"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0 whitespace-nowrap">预算：</span>
                      <span className="truncate">{post.budget ? `${post.budget} 元` : "未填写"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 联系方式 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-4 text-foreground">联系方式</h3>
                <div className="space-y-3">
                  <CopyableContact
                    icon={<Mail className="h-4 w-4" />}
                    label="邮箱"
                    value={post.contactEmail}
                  />
                  <CopyableContact
                    icon={<Phone className="h-4 w-4" />}
                    label="手机号"
                    value={post.contactPhone}
                  />
                  <CopyableContact
                    icon={<MessageCircle className="h-4 w-4" />}
                    label="微信号"
                    value={post.contactWeChat}
                  />
                  <CopyableContact
                    icon={<MessageCircle className="h-4 w-4" />}
                    label="QQ号"
                    value={post.contactQQ}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
