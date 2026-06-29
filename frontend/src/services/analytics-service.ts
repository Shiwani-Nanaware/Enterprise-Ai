/**
 * Analytics service — connects to the real backend analytics API.
 */

import { apiClient } from "./api-client";

export interface OverviewData {
  total_conversations: number;
  total_messages: number;
  total_documents: number;
  total_users: number;
  month_conversations: number;
  month_messages: number;
  avg_response_time_ms: number;
  total_tokens_used: number;
}

export interface DailyActivity {
  date: string;
  conversations: number;
  messages: number;
}

export interface DepartmentUsage {
  department: string;
  queries: number;
}

export interface TopUser {
  user_id: string;
  full_name: string;
  email: string;
  department: string | null;
  query_count: number;
}

export interface DocumentStats {
  total: number;
  indexed: number;
  failed: number;
  total_chunks: number;
  total_size_bytes: number;
  by_type: Array<{ type: string; count: number }>;
}

export async function getOverview(): Promise<OverviewData> {
  const r = await apiClient.get<{ success: true; data: OverviewData }>("/analytics/overview");
  return r.data.data;
}

export async function getDailyActivity(days = 14): Promise<DailyActivity[]> {
  const r = await apiClient.get<{ success: true; data: DailyActivity[] }>(
    "/analytics/daily-activity",
    { params: { days } }
  );
  return r.data.data;
}

export async function getDepartmentUsage(): Promise<DepartmentUsage[]> {
  const r = await apiClient.get<{ success: true; data: DepartmentUsage[] }>(
    "/analytics/department-usage"
  );
  return r.data.data;
}

export async function getTopUsers(limit = 10): Promise<TopUser[]> {
  const r = await apiClient.get<{ success: true; data: TopUser[] }>(
    "/analytics/top-users",
    { params: { limit } }
  );
  return r.data.data;
}

export async function getDocumentStats(): Promise<DocumentStats> {
  const r = await apiClient.get<{ success: true; data: DocumentStats }>(
    "/analytics/documents"
  );
  return r.data.data;
}

export async function getRecentUploads(limit = 10): Promise<any[]> {
  const r = await apiClient.get<{ success: true; data: any[] }>(
    "/analytics/recent-uploads",
    { params: { limit } }
  );
  return r.data.data;
}
