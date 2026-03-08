"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { CoCreationPost } from "@/lib/types"
import { Calendar, User, Phone, MessageCircle, Copy, Check, Download, FileText, Mail } from "lucide-react"

interface PostDetailDialogProps {
  post: CoCreationPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}：</span>
      {hasValue ? (
        <>
          <span className="font-mono">{value}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-1"
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
  "共创中": "bg-amber-100 text-amber-800 border-amber-200",
  "已结束": "bg-muted text-muted-foreground border-border"
}

export function PostDetailDialog({ post, open, onOpenChange }: PostDetailDialogProps) {
  if (!post) return null

  const domainTags = post.domainTags || []
  const customTags = post.customTags || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <DialogTitle className="text-xl leading-relaxed flex-1">
              {post.title}
            </DialogTitle>
            <Badge 
              variant="outline" 
              className={`shrink-0 ${statusColors[post.status]}`}
            >
              {post.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* 发起人信息 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{post.authorName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>发布于 {post.createdAt}</span>
            </div>
          </div>

          <Separator />

          {/* 场景描述 */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground">场景描述</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {post.description}
            </p>
          </div>

          {/* 标签 - 先领域标签后自定义标签 */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground">相关标签</h4>
            <div className="flex flex-wrap gap-2">
              {/* 先显示领域标签 */}
              {domainTags.map((tag) => (
                <Badge key={tag} variant="default" className="font-normal">
                  {tag}
                </Badge>
              ))}
              {/* 再显示自定义标签 */}
              {customTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 共创截止时间 */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground">共创截止时间</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{post.endDate}</span>
            </div>
          </div>

          {/* 附件 */}
          {post.attachments && post.attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3 text-foreground">附件</h4>
                <div className="space-y-2">
                  {post.attachments.map((attachment, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 ml-2"
                        onClick={() => {
                          const link = document.createElement("a")
                          link.href = attachment.url
                          link.download = attachment.name
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                      >
                        <Download className="h-4 w-4 mr-1.5" />
                        下载
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* 联系方式 */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-foreground">联系方式</h4>
            <div className="space-y-2.5">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
