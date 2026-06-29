/**
 * Document API service — upload, list, get, delete.
 */

import { apiClient } from "./api-client";
import type { ApiSuccessResponse, Document, PaginatedApiResponse } from "@/types";

export interface UploadDocumentPayload {
  file: File;
  department: string;
  title: string;
  description?: string;
}

export interface ListDocumentsParams {
  page?: number;
  page_size?: number;
  department?: string;
  status?: string;
  file_type?: string;
  search?: string;
}

export async function uploadDocument(payload: UploadDocumentPayload): Promise<Document> {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("department", payload.department);
  form.append("title", payload.title);
  if (payload.description) form.append("description", payload.description);

  const res = await apiClient.post<ApiSuccessResponse<Document>>("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120_000, // 2 min for large files + embedding
  });
  return res.data.data;
}

export async function listDocuments(
  params: ListDocumentsParams = {}
): Promise<PaginatedApiResponse<Document>> {
  const res = await apiClient.get<PaginatedApiResponse<Document>>("/documents", { params });
  return res.data;
}

export async function getDocument(id: string): Promise<Document> {
  const res = await apiClient.get<ApiSuccessResponse<Document>>(`/documents/${id}`);
  return res.data.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}
