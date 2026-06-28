const API_PREFIX = "/api";

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

  const res = await fetch(`${API_PREFIX}${path}`, { ...options, headers, credentials: "include" });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token")
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login"
      }
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}

function setToken(token: string) {
  localStorage.setItem("token", token)
}

export const api = {
  auth: {
    register: async (email: string, name: string, password: string) => {
      const data = await request<{ access_token: string }>("/auth/register", {
        method: "POST", body: JSON.stringify({ email, name, password }),
      })
      setToken(data.access_token)
      return data
    },
    login: async (email: string, password: string) => {
      const data = await request<{ access_token: string }>("/auth/login", {
        method: "POST", body: JSON.stringify({ email, password }),
      })
      setToken(data.access_token)
      return data
    },
    me: () => request<{ id: string; email: string; name: string; balance: number; email_verified?: boolean }>("/auth/me"),
    verifyEmail: (token: string) => request<{ message: string }>(`/auth/verify-email?token=${token}`),
  },
  research: {
    create: (data: { query: string; mode: string; budget_cap?: number }) =>
      request<{ id: string; query: string; mode: string; status: string; cost_estimate: number; estimated_duration_minutes: number }>(
        "/research", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) =>
      request<{ id: string; query: string; status: string; report?: string; sources_count: number; cost_incurred: number; confidence_scores?: any; research_graph?: any }>(
        `/research/${id}`),
    list: () =>
      request<Array<{ id: string; query: string; status: string; sources_count: number; cost_incurred: number }>>("/research"),
    search: (q: string) =>
      request<Array<{ id: string; query: string; status: string; sources_count: number; cost_incurred: number }>>(`/research/search?q=${encodeURIComponent(q)}`),
    sources: (id: string) =>
      request<Array<{ id: string; url: string; title: string; quality_score?: number; fetched: boolean }>>(`/research/${id}/sources`),
  },
};
