const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}

export const api = {
  auth: {
    register: (email: string, name: string, password: string) =>
      request<{ access_token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, name, password }),
      }),
    login: (email: string, password: string) =>
      request<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ id: string; email: string; name: string; balance: number; email_verified?: boolean }>("/auth/me"),
    verifyEmail: (token: string) =>
      request<{ message: string }>(`/auth/verify-email?token=${token}`),
  },
  research: {
    create: (data: { query: string; mode: string; budget_cap?: number }) =>
      request<{
        id: string; query: string; mode: string; status: string;
        cost_estimate: number; estimated_duration_minutes: number;
      }>("/research", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) =>
      request<{
        id: string; query: string; status: string; report?: string;
        sources_count: number; cost_incurred: number;
        confidence_scores?: Record<string, any>; research_graph?: any;
      }>(`/research/${id}`),
    list: () =>
      request<Array<{ id: string; query: string; status: string; sources_count: number; cost_incurred: number }>>("/research"),
  },
};
