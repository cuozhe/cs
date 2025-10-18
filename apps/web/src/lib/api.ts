export function getApiBaseUrl() {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return 'http://localhost:4000';
}

export type ApiItem = {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
  path: string;
  status: string;
  lastCalledAt: string | null;
};

export type Stats = {
  totalCalls: number;
  success: number;
  fail: number;
  successRate: number;
};

export type ApiKey = {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  rateLimitPerMin: number;
  createdAt: string;
};
