/**
 * Authentication service — wraps the auth API endpoints.
 * Provides typed methods for login, logout, token refresh, and current user.
 */

import { apiClient } from "./api-client";
import type { AuthTokens, User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  user: User;
  tokens: AuthTokens;
}

/**
 * Authenticate with email and password.
 * Returns the user profile and token pair on success.
 */
export async function login(payload: LoginPayload): Promise<LoginResult> {
  // Step 1: Obtain tokens
  const tokenResponse = await apiClient.post<{
    success: true;
    data: AuthTokens;
  }>("/auth/login", payload);

  const tokens = tokenResponse.data.data;

  // Temporarily store token so the /me request can authenticate
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);

  // Step 2: Fetch current user profile
  const userResponse = await apiClient.get<{
    success: true;
    data: User;
  }>("/auth/me");

  return { user: userResponse.data.data, tokens };
}

/**
 * Logout the current user — invalidates the server-side refresh token.
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

/**
 * Fetch the current authenticated user's profile.
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<{ success: true; data: User }>("/auth/me");
  return response.data.data;
}

/**
 * Change the current user's password.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiClient.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}
