import client from "./client";
import type { LoginPayload, RegisterPayload, TokenResponse, User } from "@/types/auth";

export async function register(payload: RegisterPayload): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>("/auth/register", payload);
  return res.data;
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>("/auth/login", payload);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await client.get<User>("/auth/me");
  return res.data;
}

export async function listUsers(): Promise<User[]> {
  const res = await client.get<User[]>("/admin/users");
  return res.data;
}

export async function updateUser(
  userId: string,
  payload: { role?: "admin" | "member"; is_active?: boolean },
): Promise<User> {
  const res = await client.patch<User>(`/admin/users/${userId}`, payload);
  return res.data;
}

export async function deleteUser(userId: string): Promise<void> {
  await client.delete(`/admin/users/${userId}`);
}
