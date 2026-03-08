"use client"

import type { CoCreationPost } from "./types"
import { mockPosts, CURRENT_USER_ID } from "./mock-data"

const STORAGE_KEY = "co-creation-posts"
const VERSION_KEY = "co-creation-posts-version"
const CURRENT_VERSION = "v5" // 更新此版本号以强制刷新数据

// 根据ID获取单个帖子
export function getPostById(postId: string): CoCreationPost | undefined {
  const posts = getAllPosts()
  return posts.find(p => p.id === postId)
}

// 获取所有帖子
export function getAllPosts(): CoCreationPost[] {
  if (typeof window === "undefined") return mockPosts
  
  const storedVersion = localStorage.getItem(VERSION_KEY)
  const stored = localStorage.getItem(STORAGE_KEY)
  
  // 如果版本不匹配或没有存储数据，重新初始化
  if (storedVersion !== CURRENT_VERSION || !stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPosts))
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
    return mockPosts
  }
  
  try {
    return JSON.parse(stored) as CoCreationPost[]
  } catch {
    return mockPosts
  }
}

// 附件类型
export interface Attachment {
  name: string
  url: string
  size: number
}

// 添加新帖子
export function addPost(post: Omit<CoCreationPost, "id" | "createdAt" | "authorId" | "authorName" | "status">): CoCreationPost {
  const posts = getAllPosts()
  
  const newPost: CoCreationPost = {
    id: `user-post-${Date.now()}`,
    title: post.title,
    description: post.description,
    initiator: post.initiator || "",
    budget: post.budget || "",
    expectedOutput: post.expectedOutput || "",
    domainTags: post.domainTags,
    customTags: post.customTags,
    descriptionFiles: post.descriptionFiles || [],
    resourceFiles: post.resourceFiles || [],
    endDate: post.endDate,
    contactEmail: post.contactEmail,
    contactPhone: post.contactPhone,
    contactWeChat: post.contactWeChat,
    contactQQ: post.contactQQ,
    createdAt: new Date().toISOString().split("T")[0],
    authorId: CURRENT_USER_ID,
    authorName: "当前用户",
    status: determineStatus(post.endDate)
  }
  
  const updatedPosts = [newPost, ...posts]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts))
  
  return newPost
}

// 新发布的帖子默认为待审核状态
function determineStatus(_endDate: string): CoCreationPost["status"] {
  return "待审核"
}

// 结束单个帖子（只能结束审核通过/共创中的帖子）
export function endPost(postId: string): boolean {
  const posts = getAllPosts()
  const postIndex = posts.findIndex(p => p.id === postId)
  
  if (postIndex === -1) return false
  
  // 只能结束自己发布的帖子
  if (posts[postIndex].authorId !== CURRENT_USER_ID) return false
  
  // 只能结束"审核通过"或"共创中"状态的帖子
  if (posts[postIndex].status !== "审核通过" && posts[postIndex].status !== "共创中") return false
  
  posts[postIndex].status = "已结束"
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  
  return true
}

// 更新帖子（用于修改审核未通过的帖子）
export function updatePost(postId: string, updates: Partial<Omit<CoCreationPost, "id" | "createdAt" | "authorId" | "authorName">>): boolean {
  const posts = getAllPosts()
  const postIndex = posts.findIndex(p => p.id === postId)
  
  if (postIndex === -1) return false
  
  // 只能修改自己发布的帖子
  if (posts[postIndex].authorId !== CURRENT_USER_ID) return false
  
  // 只能修改"审核未通过"状态的帖子
  if (posts[postIndex].status !== "审核未通过") return false
  
  // 更新帖子内容，修改后重新进入待审核状态
  posts[postIndex] = {
    ...posts[postIndex],
    ...updates,
    status: "待审核"
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  return true
}

// 重置为初始数据（用于测试）
export function resetPosts(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPosts))
}

export { CURRENT_USER_ID }
