/**
 * Documents service — connects to the real backend documents API.
 */

import { apiClient } from "./api-client";
import type { Document, PaginatedApiResponse } from "@/types";

export interface ListDocumentsParams {
  page?: number;
  page_size?: number;
  department?: string;
  status?: string;
  file_type?: string;
  search?: string;
}

export async function listDocuments(
  params: ListDocumentsParams = {}
): Promise<PaginatedApiResponse<Document>> {
  const response = await apiClient.get<PaginatedApiResponse<Document>>(
    "/documents",
    { params }
  );
  return response.data;
}

export async function getDocument(id: string): Promise<Document> {
  const response = await apiClient.get<{ success: true; data: Document }>(
    `/documents/${id}`
  );
  return response.data.data;
}

export async function uploadDocument(
  file: File,
  department: string,
  title: string,
  description?: string
): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("department", department);
  formData.append("title", title);
  if (description) formData.append("description", description);

  const response = await apiClient.post<{ success: true; data: Document }>(
    "/documents/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}
