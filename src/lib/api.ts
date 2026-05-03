/**
 * CALLSUP API client
 * Base URL is configured via VITE_API_URL env variable.
 * Falls back to http://localhost:8010 for local development.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

const TOKEN_KEY = "callsup_token";
const USER_KEY = "callsup_user";

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ─── User storage helpers ─────────────────────────────────────────────────────

export function saveUser(user: TokenResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSavedUser(): TokenResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as TokenResponse) : null;
  } catch {
    return null;
  }
}

export function clearUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  options: {
    body?: unknown;
    params?: Record<string, string>;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { body, params, auth = true } = options;

  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url = `${url}?${qs}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as { detail?: string };
      if (err.detail) message = String(err.detail);
    } catch {
      // ignore parse failure
    }
    if (res.status === 401) {
      clearToken();
      clearUser();
      window.location.href = "/login";
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  token_type: string;
  business_id: string;
  username: string;
  business_name: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  business_id: string;
  business_name: string;
  created_at: string;
}

export interface TranscriptSegment {
  business_id: string;
  conv_id: string;
  segment_id: string;
  speaker: "customer" | "agent" | null;
  start_ts: string;
  end_ts: string;
  text: string;
  confidence: number;
}

export interface EscalationTicket {
  id: string;
  business_id: string;
  conv_id: string | null;
  session_id: string;
  reason: string;
  priority: "high" | "medium" | "low";
  summary: string | null;
  rule_triggered: string | null;
  status: "pending" | "claimed" | "resolved";
  created_at: string;
  claimed_by: string | null;
  resolved_at: string | null;
  conversation_history: { role: string; content: string }[];
}

export interface DashboardStats {
  calls_handled_today: number;
  pending_escalations: number;
  resolved_today: number;
  avg_handling_time_seconds: number | null;
}

export interface EscalationRule {
  id: string;
  business_id: string;
  rule_text: string;
  ai_refined_text: string | null;
  priority: "high" | "medium" | "low";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContextItem {
  id: string;
  label: string;
  type: string;
  file_name: string | null;
  is_alert: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  content: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  async login(username: string, password: string): Promise<TokenResponse> {
    const data = await request<TokenResponse>("POST", "/auth/login", {
      body: { username, password },
      auth: false,
    });
    setToken(data.access_token);
    saveUser(data);
    return data;
  },

  async register(
    username: string,
    email: string,
    password: string,
    business_name: string
  ): Promise<TokenResponse> {
    const data = await request<TokenResponse>("POST", "/auth/register", {
      body: { username, email, password, business_name },
      auth: false,
    });
    setToken(data.access_token);
    saveUser(data);
    return data;
  },

  async me(): Promise<UserProfile> {
    return request<UserProfile>("GET", "/auth/me");
  },

  logout(): void {
    clearToken();
    clearUser();
  },
};

// ─── Escalation Queue ─────────────────────────────────────────────────────────

export const queue = {
  list(status?: "pending" | "claimed" | "resolved"): Promise<EscalationTicket[]> {
    const params = status ? { status } : undefined;
    return request<EscalationTicket[]>("GET", "/escalation-queue", { params });
  },

  get(ticketId: string): Promise<EscalationTicket> {
    return request<EscalationTicket>("GET", `/escalation-queue/${ticketId}`);
  },

  update(
    ticketId: string,
    data: { status: "pending" | "claimed" | "resolved"; claimed_by?: string }
  ): Promise<EscalationTicket> {
    return request<EscalationTicket>("PUT", `/escalation-queue/${ticketId}`, { body: data });
  },

  create(data: {
    session_id: string;
    reason: string;
    priority?: "high" | "medium" | "low";
    rule_triggered?: string;
    conv_id?: string;
    summary?: string;
  }): Promise<EscalationTicket> {
    return request<EscalationTicket>("POST", "/escalation-queue", { body: data });
  },

  stats(): Promise<DashboardStats> {
    return request<DashboardStats>("GET", "/escalation-queue/stats");
  },

  /**
   * Opens a Server-Sent Events connection for real-time ticket updates.
   * The JWT is passed as a query parameter (backend requirement).
   * Returns the EventSource instance — call .close() when done.
   */
  stream(onTicket: (ticket: EscalationTicket) => void): EventSource {
    const token = getToken() ?? "";
    const url = `${API_BASE}/escalation-queue/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);
    source.onmessage = (event: MessageEvent<string>) => {
      if (event.data === "connected") return;
      try {
        const ticket = JSON.parse(event.data) as EscalationTicket;
        onTicket(ticket);
      } catch {
        // ignore malformed events
      }
    };
    return source;
  },
};

// ─── Escalation Rules ─────────────────────────────────────────────────────────

export const rules = {
  list(): Promise<EscalationRule[]> {
    return request<EscalationRule[]>("GET", "/escalation-rules");
  },

  create(data: {
    rule_text: string;
    priority?: "high" | "medium" | "low";
    refine_with_ai?: boolean;
  }): Promise<EscalationRule> {
    return request<EscalationRule>("POST", "/escalation-rules", { body: data });
  },

  update(
    ruleId: string,
    data: {
      rule_text?: string;
      ai_refined_text?: string;
      priority?: "high" | "medium" | "low";
      is_active?: boolean;
      refine_with_ai?: boolean;
    }
  ): Promise<EscalationRule> {
    return request<EscalationRule>("PUT", `/escalation-rules/${ruleId}`, { body: data });
  },

  delete(ruleId: string): Promise<void> {
    return request<void>("DELETE", `/escalation-rules/${ruleId}`);
  },
};

// ─── Business Context ─────────────────────────────────────────────────────────

export const context = {
  list(): Promise<ContextItem[]> {
    return request<ContextItem[]>("GET", "/context");
  },

  create(data: {
    label: string;
    content: string;
    type?: string;
    file_name?: string;
    refine_with_ai?: boolean;
    is_alert?: boolean;
    expires_at?: string | null;
  }): Promise<ContextItem> {
    return request<ContextItem>("POST", "/context", { body: data });
  },

  update(
    itemId: string,
    data: {
      label?: string;
      content?: string;
      refine_with_ai?: boolean;
      is_alert?: boolean;
      expires_at?: string | null;
    }
  ): Promise<ContextItem> {
    return request<ContextItem>("PUT", `/context/${itemId}`, { body: data });
  },

  delete(itemId: string): Promise<void> {
    return request<void>("DELETE", `/context/${itemId}`);
  },
};

// ─── Audio / Conversations ────────────────────────────────────────────────────

export const audio = {
  getTranscript(convId: string): Promise<TranscriptSegment[]> {
    return request<TranscriptSegment[]>("GET", `/audio/transcript/${convId}`, { auth: false });
  },
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const health = {
  check(): Promise<{ status: string; version: string }> {
    return request<{ status: string; version: string }>("GET", "/health", { auth: false });
  },
};
