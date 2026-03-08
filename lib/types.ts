export type PostStatus = "待审核" | "审核通过" | "审核未通过" | "共创中" | "已结束"

export interface Attachment {
  name: string
  url: string
  size: number
}

// 预设领域标签
export const DOMAIN_TAGS = [
  "医疗健康",
  "新能源汽车",
  "政府办公",
  "智能制造",
  "金融科技",
  "教育培训",
  "电子商务",
  "物流运输",
  "智慧城市",
  "农业科技",
  "文化传媒",
  "旅游酒店",
  "房地产",
  "零售消费",
  "人工智能",
  "物联网",
  "区块链",
  "网络安全",
  "环保能源",
  "生物医药"
] as const

export type DomainTag = typeof DOMAIN_TAGS[number]

export interface CoCreationPost {
  id: string
  title: string
  description: string
  initiator: string  // 发起方
  budget: string  // 预算（单位：元）
  expectedOutput: string  // 预期成果形式
  domainTags: string[]  // 领域标签
  customTags: string[]  // 自定义标签
  descriptionFiles: Attachment[]  // 关联描述文件（必填）
  resourceFiles: Attachment[]  // 资源包（必填）
  attachments?: Attachment[]  // 保留旧字段兼容性
  endDate: string  // 共创截止时间
  contactEmail: string  // 邮箱（必填）
  contactPhone: string  // 手机号（选填）
  contactWeChat: string  // 微信号（选填）
  contactQQ: string  // QQ号（选填）
  createdAt: string
  authorId: string
  authorName: string
  status: PostStatus
  rejectionReason?: string  // 审核未通过理由
}

export type FilterStatus = "全部场景" | "共创中" | "已结束" | "我的场景"

export type QuickTimeFilter = "不限时间" | "3天内" | "一周内" | "两周内" | "一个月内"
