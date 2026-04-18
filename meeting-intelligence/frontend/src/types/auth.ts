export interface User {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "member";
  created_at: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  display_name: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
