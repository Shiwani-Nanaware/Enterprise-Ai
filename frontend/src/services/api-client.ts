/**
 * Axios HTTP client configured for the Enterprise AI API.
 *
 * Handles:
 * - Base URL configuration from environment
 * - JWT Bearer token injection via interceptor
 * - Automatic token refresh on 401 responses
 * - Standardized error transformation
 */

import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from "axios";
import type { ApiErrorResponse } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${BASE_URL}${API_PREFIX}`,
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: false,
  });

  // -------------------------------------------------------------------------
  // Request interceptor — inject JWT access token
  // -------------------------------------------------------------------------
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // -------------------------------------------------------------------------
  // Response interceptor — handle 401 and transform errors
  // -------------------------------------------------------------------------
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean };

      // Attempt token refresh on 401 (once)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
          try {
            const refreshResponse = await axios.post(`${BASE_URL}${API_PREFIX}/auth/refresh`, {
              refresh_token: refreshToken,
            });
            const { access_token } = refreshResponse.data.data;
            localStorage.setItem("access_token", access_token);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return client(originalRequest);
          } catch {
            // Refresh failed — clear tokens and redirect to login
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/login";
          }
        } else {
          window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient();

// ---------------------------------------------------------------------------
// Typed request helpers
// ---------------------------------------------------------------------------

/**
 * Extract the data field from a standard API success response.
 */
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<{ success: true; data: T }>(url, { params });
  return response.data.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.post<{ success: true; data: T }>(url, body);
  return response.data.data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.put<{ success: true; data: T }>(url, body);
  return response.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.patch<{ success: true; data: T }>(url, body);
  return response.data.data;
}

export async function apiDelete<T = void>(url: string): Promise<T> {
  const response = await apiClient.delete<{ success: true; data: T }>(url);
  return response.data.data;
}
