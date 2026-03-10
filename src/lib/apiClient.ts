// API Client - replaces Supabase SDK with fetch calls to VPS backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://soft.smelitehajj.com/api";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  count?: number;
}

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function setToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}

export function getStoredUser() {
  const user = localStorage.getItem("auth_user");
  return user ? JSON.parse(user) : null;
}

export function setStoredUser(user: any) {
  localStorage.setItem("auth_user", JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem("auth_user");
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || result.message || "Request failed" };
    }

    return { data: result.data ?? result, count: result.count };
  } catch (error: any) {
    return { error: error.message || "Network error" };
  }
}

export const api = {
  get: <T = any>(endpoint: string) => request<T>(endpoint),
  post: <T = any>(endpoint: string, body: any) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T = any>(endpoint: string, body: any) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T = any>(endpoint: string, body: any) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T = any>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};

// Auth-specific API calls
export const authApi = {
  login: async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: any }>("/auth/login", { email, password });
    if (result.data?.token) {
      setToken(result.data.token);
      setStoredUser(result.data.user);
    }
    return result;
  },

  signup: async (email: string, password: string, fullName: string) => {
    return api.post("/auth/signup", { email, password, full_name: fullName });
  },

  logout: () => {
    clearToken();
    clearStoredUser();
  },

  resetPassword: async (email: string) => {
    return api.post("/auth/reset-password", { email });
  },

  updatePassword: async (token: string, password: string) => {
    return api.post("/auth/update-password", { token, password });
  },

  getProfile: async () => {
    return api.get("/auth/profile");
  },
};
