/**
 * Application Type Definitions
 * Centralized type definitions for better maintainability
 */

import { Database, Tables } from '@/types/database'

/**
 * User profile type with proper typing
 */
export type UserProfile = Tables<'profiles'>

/**
 * User role type
 */
export type UserRole = Database['public']['Enums']['user_role']

/**
 * Plan type enum
 */
export type PlanType = Database['public']['Enums']['plan_type']

/**
 * Organization type
 */
export type Organization = Tables<'organizations'>

/**
 * Supplier type
 */
export type Supplier = Tables<'suppliers'>

/**
 * Forum post type
 */
export type ForumPost = Tables<'forum_posts'>

/**
 * Conversation type
 */
export type Conversation = Tables<'conversations'>

/**
 * Direct message type
 */
export type DirectMessage = Tables<'direct_messages'>

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * ESG scenario type
 */
export interface ESGScenario {
  id: string
  organization_id: string
  name: string
  description?: string
  baseline_year: number
  target_year: number
  reduction_target: number
  status: 'draft' | 'active' | 'completed'
  created_at: string
  updated_at: string
}

/**
 * Supplier emissions type
 */
export interface SupplierEmissions {
  id: string
  supplier_id: string
  year: number
  scope1: number
  scope2: number
  scope3: number
  total: number
  data_quality: 'high' | 'medium' | 'low'
  created_at: string
  updated_at: string
}

/**
 * Dashboard stats
 */
export interface DashboardStats {
  totalSuppliers: number
  totalEmissions: number
  averageEmissionsPerSupplier: number
  suppliersWithData: number
  dataCompleteness: number
}
