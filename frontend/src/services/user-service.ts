/**
 * User management API service.
 */

import { apiClient } from "./api-client";
import type { ApiSuccessResponse, PaginatedApiResponse, User } from "@/types";

export async function listUsers(params?: {
  page?: number;
  page_size?: number;
  role?: string;
  department?: string;
}): Promise<PaginatedApiResponse<User>> {
  const res = await apiClient.get<PaginatedApiResponse<User>>("/users", { params });
  return res.data;
}

export async function getUser(id: string): Promise<User> {
  const res = await apiClient.get<ApiSuccessResponse<User>>(`/users/${id}`);
  return res.data.data;
}

export async function updateUser(
  id: string,
  updates: { full_name?: string; department?: string; job_title?: string; avatar_url?: string }
): Promise<User> {
  const res = await apiClient.patch<ApiSuccessResponse<User>>(`/users/${id}`, updates);
  return res.data.data;
}

export async function assignRole(id: string, role: string): Promise<User> {
  const res = await apiClient.post<ApiSuccessResponse<User>>(`/users/${id}/role`, null, {
    params: { new_role: role },
  });
  return res.data.data;
}

export async function deactivateUser(id: string): Promise<User> {
  const res = await apiClient.post<ApiSuccessResponse<User>>(`/users/${id}/deactivate`);
  return res.data.data;
}
