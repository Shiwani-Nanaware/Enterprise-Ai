/**
 * Shared TypeScript type definitions.
 */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// =============================================================================
// API
// =============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string; detail?: Record<string, unknown> };
  request_id?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// =============================================================================
// Auth
// =============================================================================

export type UserRole = "user" | "analyst" | "manager" | "admin" | "super_admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url: Nullable<string>;
  department: Nullable<string>;
  job_title: Nullable<string>;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// =============================================================================
// Documents
// =============================================================================

export type DocumentStatus = "pending" | "processing" | "indexed" | "failed" | "archived";

export interface Document {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  status: DocumentStatus;
  chunk_count: number;
  collection_name: string;
  uploaded_by: string;
  description: Nullable<string>;
  tags: Nullable<string[]>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Chat
// =============================================================================

export type MessageRole = "user" | "assistant" | "system";

export interface MessageSource {
  document_id: string;
  document_title: string;
  chunk_index: number;
  content_preview: string;
  similarity_score: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tokens_used: number;
  sources: Nullable<MessageSource[]>;
  latency_ms: Nullable<number>;
  feedback: Nullable<"positive" | "negative">;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  status: "active" | "archived";
  total_tokens_used: number;
  model_used: Nullable<string>;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// =============================================================================
// Analytics
// =============================================================================

export interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  change_period: string;
  trend: "up" | "down" | "neutral";
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface UsageStats {
  total_conversations: number;
  total_messages: number;
  total_documents: number;
  total_tokens_used: number;
  active_users: number;
  avg_response_time_ms: number;
}

// =============================================================================
// Navigation
// =============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
  requiresRole?: UserRole[];
}

// =============================================================================
// UI
// =============================================================================

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
export type ButtonSize = "default" | "sm" | "lg" | "icon";
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "accent";
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

export interface FilterConfig {
  field: string;
  value: string | string[] | number | boolean;
  operator?: "eq" | "contains" | "gt" | "lt" | "gte" | "lte";
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
