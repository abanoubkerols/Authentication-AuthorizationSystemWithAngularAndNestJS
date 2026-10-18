export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  accessToken: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface User {
  userId: string;
  sessionId: string;
  role: string;
  email: string;
  name: string;
}
