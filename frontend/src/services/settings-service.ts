/**
 * Settings service — connects to the real backend settings API.
 */

import { apiClient } from "./api-client";

export interface AppSettings {
  theme: string;
  language: string;
  llm_model: string;
  llm_temperature: number;
  llm_top_p: number;
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  top_k: number;
  similarity_threshold: number;
  notifications_email: boolean;
  notifications_in_app: boolean;
  guardrails_enabled: boolean;
  pii_masking_enabled: boolean;
}

export async function getSettings(): Promise<AppSettings> {
  const r = await apiClient.get<{ success: true; data: AppSettings }>("/settings");
  return r.data.data;
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const r = await apiClient.put<{ success: true; data: AppSettings }>("/settings", updates);
  return r.data.data;
}

export async function resetSettings(): Promise<AppSettings> {
  const r = await apiClient.delete<{ success: true; data: AppSettings }>("/settings");
  return r.data.data;
}

export async function getDefaults(): Promise<AppSettings> {
  const r = await apiClient.get<{ success: true; data: AppSettings }>("/settings/defaults");
  return r.data.data;
}
