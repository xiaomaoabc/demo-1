"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, ArrowRight, CalendarIcon, X, Check, Upload, AlertCircle, Mail, Phone, MessageCircle, FileText, User, Download, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { addPost, getPostById, updatePost } from "@/lib/store"
import type { Attachment } from "@/lib/types"
import { DOMAIN_TAGS } from "@/lib/types"

interface FormData {
  title: string
  description: string
  initiator: string  // 发起方
  budget: string  // 预算（单位：元）
  expectedOutput: string  // 预期成果形式
  domainTags: string[]
  customTags: string[]
  descriptionFiles: Attachment[]  // 关联描述文件（必填）
  resourceFiles: Attachment[]  // 资源包（必填）
  endDate: Date | undefined  // 共创截止时间
  contactEmail: string  // 邮箱（必填）
  contactPhone: string  // 手机号（选填）
  contactWeChat: string  // 微信号（选填）
  contactQQ: string  // QQ号（选填）
}

const initialFormData: FormData = {
  title: "",
  description: "",
  initiator: "",
  budget: "",
  expectedOutput: "",
  domainTags: [],
  customTags: [],
  descriptionFiles: [],
  resourceFiles: [],
  endDate: undefined,
  contactEmail: "",
  contactPhone: "",
  contactWeChat: "",
  contactQQ: ""
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">加载中...</div>}>
      <CreatePageContent />
    </Suspense>
  )
}

function CreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  
  const [step, setStep] = useState(1)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showContactConfirmDialog, setShowContactConfirmDialog] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [customTagInput, setCustomTagInput] = useState("")
  const [isEditMode, setIsEditMode] = useState(false)
  const [rejectionReason, setRejectionReason] = useState<string | undefined>(undefined)

  // 编辑模式：加载帖子数据（支持待审核和审核未通过状态）
  useEffect(() => {
    if (editId) {
      const post = getPostById(editId)
      if (post && (post.status === "审核未通过" || post.status === "待审核")) {
        setIsEditMode(true)
        if (post.status === "审核未通过") {
          setRejectionReason(post.rejectionReason)
        }
        setFormData({
          title: post.title,
          description: post.description,
          initiator: post.initiator,
          budget: post.budget,
          expectedOutput: post.expectedOutput,
          domainTags: post.domainTags,
          customTags: post.customTags,
          descriptionFiles: post.descriptionFiles || [],
          resourceFiles: post.resourceFiles || [],
          endDate: post.endDate ? new Date(post.endDate) : undefined,
          contactEmail: post.contactEmail,
          contactPhone: post.contactPhone,
          contactWeChat: post.contactWeChat,
          contactQQ: post.contactQQ
        })
      }
    }
  }, [editId])

  const updateFormData = (field: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleDomainTag = (tag: string) => {
    if (formData.domainTags.includes(tag)) {
      updateFormData("domainTags", formData.domainTags.filter((t) => t !== tag))
    } else {
      updateFormData("domainTags", [...formData.domainTags, tag])
    }
  }

  const addCustomTag = () => {
    if (customTagInput.trim() && !formData.customTags.includes(customTagInput.trim())) {
      updateFormData("customTags", [...formData.customTags, customTagInput.trim()])
      setCustomTagInput("")
    }
  }

  const removeCustomTag = (tag: string) => {
    updateFormData("customTags", formData.customTags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addCustomTag()
    }
  }

  const canProceedStep1 = formData.title && formData.description && formData.initiator && formData.budget && formData.expectedOutput && formData.domainTags.length > 0 && formData.descriptionFiles.length > 0
  const canProceedStep2 = formData.endDate
  const canProceedStep3 = formData.contactEmail.trim() !== "" // 邮箱必填
  const canProceedStep4 = true // 预览确认步骤总是可以继续

  const hasOptionalContactInfo = formData.contactPhone.trim() !== "" || formData.contactWeChat.trim() !== "" || formData.contactQQ.trim() !== ""

  const handleNext = () => {
    if (step < 4) {
      // 第三步且有选填联系方式时，显示确认弹窗
      if (step === 3 && hasOptionalContactInfo) {
        setShowContactConfirmDialog(true)
        return
      }
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handleContactConfirm = () => {
    setShowContactConfirmDialog(false)
    setStep(4)
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = () => {
    const postData = {
      title: formData.title,
      description: formData.description,
      initiator: formData.initiator,
      budget: formData.budget,
      expectedOutput: formData.expectedOutput,
      domainTags: formData.domainTags,
      customTags: formData.customTags,
      descriptionFiles: formData.descriptionFiles,
      resourceFiles: formData.resourceFiles,
      endDate: formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : "",
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      contactWeChat: formData.contactWeChat,
      contactQQ: formData.contactQQ
    }
    
    if (isEditMode && editId) {
      // 编辑模式：更新帖子
      const success = updatePost(editId, postData)
      if (success) {
        setShowSuccessDialog(true)
      } else {
        alert("修改失败，请重试")
      }
    } else {
      // 新建模式：添加帖子
      addPost(postData)
      setShowSuccessDialog(true)
    }
  }

  const handleDialogClose = () => {
    setShowSuccessDialog(false)
    router.push("/")
  }

  const canProceed = step === 1 ? canProceedStep1 : step === 2 ? canProceedStep2 : step === 3 ? canProceedStep3 : canProceedStep4

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">返回</span>
            </Link>
            <h1 className="flex-1 text-center text-lg font-semibold text-foreground">
              {isEditMode ? "修改共创" : "发起共创"}
            </h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* 步骤指示器 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 步骤圆圈和连接线 */}
        <div className="flex items-center justify-center">
          {[1, 2, 3, 4].map((s) => {
            const stepTitle = s === 1 ? "场景信息" : s === 2 ? "展示时间" : s === 3 ? "联系方式" : "确认预览"
            
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      s === step
                        ? "bg-primary text-primary-foreground"
                        : s < step
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s < step ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <span className={`mt-1.5 text-xs ${s === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {stepTitle}
                  </span>
                </div>
                {s < 4 && (
                  <div
                    className={`w-10 sm:w-14 h-0.5 mx-1 mb-5 transition-colors ${
                      s < step ? "bg-primary/30" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
        
        {/* 当前步骤的提示文字 - 单独一行显示 */}
        <div className="mt-4 text-center">
          <p className="text-sm text-foreground">
            {step === 1 && "描述您想要共创的场景，让其他人更好地了解您的需求"}
            {step === 2 && (
              <>
                选择帖子展示的截止时间，帖子将在截止时间后自动变为<span className="font-semibold text-destructive">已结束</span>状态
              </>
            )}
            {step === 3 && "至少填写邮箱，方便感兴趣的人联系您"}
            {step === 4 && (
              <>
                以下为最终的发布内容，<span className="text-destructive">确认信息无误后点击发布</span>
              </>
            )}
          </p>
        </div>

        {/* 编辑模式：显示审核未通过理由 */}
        {isEditMode && rejectionReason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-800">审核未通过理由及修改意见</h4>
                <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{rejectionReason}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 表单内容 */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-4">
          {/* 步骤1：场景信息 - 单个大卡片，从上到下依次为基本信息、场景标签、附件资料 */}
          {step === 1 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">基本信息</h3>
                  
<div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-medium">场景标题（最多不超过20个字） *</Label>
                                    <Input
                                      id="title"
                                      placeholder="例如：智能家居场景交互设计共创"
                                      value={formData.title}
                                      onChange={(e) => {
                                        if (e.target.value.length <= 20) {
                                          updateFormData("title", e.target.value)
                                        }
                                      }}
                                      maxLength={20}
                                      className="h-10"
                                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">场景描述 *</Label>
                    <textarea
                      id="description"
                      placeholder="详细描述您想要共创的场景、背景、目标..."
                      value={formData.description}
                      onChange={(e) => updateFormData("description", e.target.value)}
                      className="w-full h-[160px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none overflow-y-auto"
                    />
                  </div>

                  {/* 发起方、预算、预期成果形式 - 同一行 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="initiator" className="text-sm font-medium">发起方 *</Label>
                      <Input
                        id="initiator"
                        placeholder="XX公司/团队"
                        value={formData.initiator}
                        onChange={(e) => updateFormData("initiator", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="text-sm font-medium">预算（元） *</Label>
                      <Input
                        id="budget"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="10000"
                        value={formData.budget}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "" || parseFloat(value) >= 0) {
                            updateFormData("budget", value)
                          }
                        }}
                        className="h-10"
                      />
                    </div>
<div className="space-y-2">
                                      <Label htmlFor="expectedOutput" className="text-sm font-medium flex items-center gap-1">
                                        预期作品形式 *
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="max-w-[200px] text-xs">预期作品形式是指您希望最终产出的成果类型，如原型设计、分析报告、代码实现等</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </Label>
                                      <Input
                                        id="expectedOutput"
                                        placeholder="原型/报告/代码"
                                        value={formData.expectedOutput}
                                        onChange={(e) => updateFormData("expectedOutput", e.target.value)}
                                        className="h-10"
                                      />
                                    </div>
                  </div>
                </div>

                <Separator />

                {/* 场景标签 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">场景标签</h3>
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">所属领域 *</Label>
                      <p className="text-xs text-muted-foreground mt-1">选择一个或多个领域标签</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DOMAIN_TAGS.map((tag) => (
                        <Badge
                          key={tag}
                          variant={formData.domainTags.includes(tag) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors text-xs px-3 py-1 ${
                            formData.domainTags.includes(tag)
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => toggleDomainTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">自定义标签（选填）</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入标签后按回车"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-10"
                      />
                      <Button type="button" variant="outline" onClick={addCustomTag} className="h-10 px-4">
                        添加
                      </Button>
                    </div>
                    {/* 已选标签展示区：领域标签在前，自定义标签在后 */}
                    {(formData.domainTags.length > 0 || formData.customTags.length > 0) && (
                      <div className="max-h-[80px] overflow-y-auto rounded-md border border-input bg-muted/30 p-3">
                        <div className="flex flex-wrap gap-2">
                          {formData.domainTags.map((tag) => (
                            <Badge key={tag} variant="default" className="pr-1 text-xs">
                              {tag}
                              <button
                                onClick={() => toggleDomainTag(tag)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          {formData.customTags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="pr-1 text-xs">
                              {tag}
                              <button
                                onClick={() => removeCustomTag(tag)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* 附件资料 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">附件资料</h3>
                  
                  {/* 关联描述附件 */}
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-1">
                        关联描述附件 *
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-[200px] text-xs">关联描述附件是与场景相关的补充说明文件，如需求文档、设计稿、参考资料等</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">需求文档、设计稿等</p>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center relative hover:border-muted-foreground/50 transition-colors">
                      <input
                        type="file"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const files = e.target.files
                          if (files) {
                            const newFiles: Attachment[] = Array.from(files).map((file) => ({
                              name: file.name,
                              url: URL.createObjectURL(file),
                              size: file.size
                            }))
                            updateFormData("descriptionFiles", [...formData.descriptionFiles, ...newFiles])
                          }
                        }}
                      />
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">点击或拖拽上传</p>
                    </div>
                    {formData.descriptionFiles.length > 0 && (
                      <div className="space-y-1 max-h-[80px] overflow-y-auto">
                        {formData.descriptionFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border text-sm">
                            <span className="truncate flex-1">{file.name}</span>
                            <button
                              onClick={() => {
                                updateFormData("descriptionFiles", formData.descriptionFiles.filter((_, i) => i !== index))
                              }}
                              className="text-muted-foreground hover:text-destructive shrink-0 ml-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 步骤2：时间安排 */}
          {step === 2 && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">设置共创展示截止时间 *</h3>
                <p className="text-xs text-muted-foreground">共创最多展示3个月</p>

                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? (
                          format(formData.endDate, "yyyy年MM月dd日", { locale: zhCN })
                        ) : (
                          <span className="text-muted-foreground">选择截止日期</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => updateFormData("endDate", date)}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          // 计算3个月后的日期
                          const maxDate = new Date(today)
                          maxDate.setMonth(maxDate.getMonth() + 3)
                          // 禁用今天之前和3个月之后的日期
                          return date < today || date > maxDate
                        }}
                        locale={zhCN}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {formData.endDate && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm">
                      <span className="text-muted-foreground">距离截止还有：</span>
                      <span className="font-medium text-foreground ml-1">
                        {Math.max(0, Math.ceil((formData.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} 天
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 步骤3：联系方式 */}
          {step === 3 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">填写联系方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">邮箱 *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData("contactEmail", e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium">
                    填写微信/手机号/QQ号则默认同意公开展示该联系方式！
                  </p>
                </div>

                <Separator />

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">手机号（选填）</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="请输入手机号"
                      value={formData.contactPhone}
                      onChange={(e) => updateFormData("contactPhone", e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wechat" className="text-sm font-medium">微信号（选填）</Label>
                    <Input
                      id="wechat"
                      placeholder="请输入微信号"
                      value={formData.contactWeChat}
                      onChange={(e) => updateFormData("contactWeChat", e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qq" className="text-sm font-medium">QQ号（选填）</Label>
                    <Input
                      id="qq"
                      placeholder="请输入QQ号"
                      value={formData.contactQQ}
                      onChange={(e) => updateFormData("contactQQ", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 步骤4：确认预览 - 合并为一个大卡片 */}
          {step === 4 && (
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-6 space-y-6">
                {/* 基本信息 */}
                <div>
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
                        <p className="text-sm font-medium">当前用户</p>
                        <p className="text-xs text-muted-foreground">发布者</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground shrink-0 whitespace-nowrap">发起方：</span>
                        <span className="truncate">{formData.initiator || "未填写"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground shrink-0 whitespace-nowrap">共创截止时间：</span>
                        <span className="truncate">{formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : "未设置"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground shrink-0 whitespace-nowrap">预期作品形式：</span>
                        <span className="truncate">{formData.expectedOutput || "未填写"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground shrink-0 whitespace-nowrap">预算：</span>
                        <span className="truncate">{formData.budget ? `${formData.budget} 元` : "未填写"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 联系方式 */}
                <div>
                  <h3 className="text-sm font-medium mb-4 text-foreground">联系方式</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground shrink-0 whitespace-nowrap">邮箱：</span>
                      <span className="font-mono truncate">{formData.contactEmail || "无"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground shrink-0 whitespace-nowrap">手机号：</span>
                      <span className="font-mono truncate">{formData.contactPhone || "无"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground shrink-0 whitespace-nowrap">微信号：</span>
                      <span className="font-mono truncate">{formData.contactWeChat || "无"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground shrink-0 whitespace-nowrap">QQ号：</span>
                      <span className="font-mono truncate">{formData.contactQQ || "无"}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 标题 */}
                <div>
                  <h3 className="text-sm font-medium mb-3 text-foreground">标题</h3>
                  <p className="text-lg font-semibold text-foreground">{formData.title}</p>
                </div>

                <Separator />

                {/* 场景描述 */}
                <div>
                  <h3 className="text-sm font-medium mb-3 text-foreground">场景描述</h3>
                  <textarea
                    readOnly
                    value={formData.description}
                    className="w-full h-[200px] px-3 py-2 text-sm text-muted-foreground rounded-md border border-input bg-muted/30 resize-none overflow-y-auto leading-relaxed"
                  />
                </div>

                <Separator />

                {/* 相关标签 */}
                <div>
                  <h3 className="text-sm font-medium mb-3 text-foreground">相关标签</h3>
                  {(formData.domainTags.length > 0 || formData.customTags.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.domainTags.map((tag) => (
                        <Badge key={tag} variant="default" className="font-normal text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {formData.customTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="font-normal text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">无</p>
                  )}
                </div>

                <Separator />

                {/* 附件 */}
                <div>
                  <h3 className="text-sm font-medium mb-3 text-foreground">附件</h3>
                  {formData.descriptionFiles.length > 0 ? (
                    <div className="space-y-4">
                      {/* 关联描述附件 */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">关联描述附件</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {formData.descriptionFiles.map((file, index) => (
                            <div 
                              key={index} 
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm truncate max-w-[180px]" title={file.name}>{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">无</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            上一步
          </Button>

          <Button onClick={handleNext} disabled={!canProceed}>
            {step === 4 ? (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                确认发布
              </>
            ) : (
              <>
                下一步
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </main>

      {/* 联系方式公开确认弹窗 */}
      <Dialog open={showContactConfirmDialog} onOpenChange={setShowContactConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">确认提示</DialogTitle>
            <DialogDescription className="text-center pt-2">
              为了方便他人联系您，您选填的手机号、微信、QQ将统一公开展示，请您确认是否依旧填写。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setShowContactConfirmDialog(false)}>
              否
            </Button>
            <Button onClick={handleContactConfirm}>
              是
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 提交成功弹窗 */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">提交成功</DialogTitle>
            <DialogDescription className="text-center pt-2">
              已提交，请等待管理员审核通过
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handleDialogClose}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
