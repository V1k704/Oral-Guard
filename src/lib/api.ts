import type { AssessmentData, AssessmentResult, ImageAssessmentResult, PatientRegistration, DatasetRegistryItem, DatasetRegistryApiItem } from './types';
import { runInference } from './rules-engine';

export const API_PRIMARY_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8010';
export const API_FALLBACK_BASE = 'http://127.0.0.1:8000';

const DEFAULT_FETCH_TIMEOUT_MS = 12000;

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'TypeError' ||
      error.name === 'AbortError' ||
      /failed to fetch|networkerror|load failed|fetch/i.test(error.message)
    );
  }
  return false;
}

export async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeout: number = DEFAULT_FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(id);
  }
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** GET/POST etc. with primary URL then fallback on transport failure; optionally attaches JWT. */
export async function fetchWithApiFailover(path: string, init?: RequestInit, attachAuth = true): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (attachAuth) {
    const extra = authHeaders();
    if (extra.Authorization) headers.set('Authorization', extra.Authorization);
  }
  const nextInit = { ...init, headers };

  try {
    return await fetchWithTimeout(`${API_PRIMARY_BASE}${path}`, nextInit);
  } catch (primaryError) {
    const shouldTryFallback = API_PRIMARY_BASE !== API_FALLBACK_BASE && isNetworkError(primaryError);
    if (!shouldTryFallback) throw primaryError;
    return await fetchWithTimeout(`${API_FALLBACK_BASE}${path}`, nextInit);
  }
}

async function postAssessment(apiBase: string, data: AssessmentData): Promise<AssessmentResult> {
  const response = await fetchWithTimeout(`${apiBase}/api/assess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Backend request failed: ${response.status}`);
  }

  return response.json();
}

async function postPatientRegistration(apiBase: string, payload: PatientRegistration): Promise<PatientRegistration> {
  const response = await fetchWithTimeout(`${apiBase}/api/register-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Patient registration failed: ${response.status}`);
  }
  return response.json();
}

export async function registerPatient(payload: PatientRegistration): Promise<PatientRegistration> {
  try {
    try {
      return await postPatientRegistration(API_PRIMARY_BASE, payload);
    } catch (primaryError) {
      const shouldTryFallback =
        API_PRIMARY_BASE !== API_FALLBACK_BASE && isNetworkError(primaryError);
      if (!shouldTryFallback) {
        throw primaryError;
      }
      return await postPatientRegistration(API_FALLBACK_BASE, payload);
    }
  } catch (err) {
    throw err instanceof Error ? err : new Error('Unable to register patient.');
  }
}

export async function submitAssessment(data: AssessmentData): Promise<AssessmentResult> {
  try {
    try {
      return await postAssessment(API_PRIMARY_BASE, data);
    } catch (primaryError) {
      const shouldTryFallback =
        API_PRIMARY_BASE !== API_FALLBACK_BASE && isNetworkError(primaryError);
      if (!shouldTryFallback) {
        throw primaryError;
      }
      return await postAssessment(API_FALLBACK_BASE, data);
    }
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn('Backend unreachable; using embedded clinical rule backup.', err);
      return runInference(data);
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
}

async function postImageAssessment(apiBase: string, file: File): Promise<ImageAssessmentResult> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetchWithTimeout(`${apiBase}/api/assess-image`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Image backend request failed: ${response.status}`);
  }
  return response.json();
}

export async function submitImageAssessment(file: File): Promise<ImageAssessmentResult> {
  try {
    try {
      return await postImageAssessment(API_PRIMARY_BASE, file);
    } catch (primaryError) {
      const shouldTryFallback =
        API_PRIMARY_BASE !== API_FALLBACK_BASE && isNetworkError(primaryError);
      if (!shouldTryFallback) {
        throw primaryError;
      }
      return await postImageAssessment(API_FALLBACK_BASE, file);
    }
  } catch (err) {
    console.warn('Image assessment backend unavailable:', err);
    throw err instanceof Error ? err : new Error('Unable to run image assessment.');
  }
}

async function postDatasetRegistry(apiBase: string, payload: DatasetRegistryItem): Promise<DatasetRegistryApiItem> {
  const response = await fetchWithTimeout(`${apiBase}/api/datasets/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Dataset registration failed: ${response.status}`);
  }
  return response.json();
}

export async function registerDataset(payload: DatasetRegistryItem): Promise<DatasetRegistryApiItem> {
  try {
    try {
      return await postDatasetRegistry(API_PRIMARY_BASE, payload);
    } catch (primaryError) {
      const shouldTryFallback =
        API_PRIMARY_BASE !== API_FALLBACK_BASE && isNetworkError(primaryError);
      if (!shouldTryFallback) throw primaryError;
      return await postDatasetRegistry(API_FALLBACK_BASE, payload);
    }
  } catch (err) {
    throw err instanceof Error ? err : new Error('Unable to register dataset.');
  }
}

async function fetchDatasets(apiBase: string): Promise<DatasetRegistryApiItem[]> {
  const response = await fetchWithTimeout(`${apiBase}/api/datasets`, { headers: { ...authHeaders() } });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Dataset fetch failed: ${response.status}`);
  }
  return response.json();
}

export async function listDatasets(): Promise<DatasetRegistryApiItem[]> {
  try {
    try {
      return await fetchDatasets(API_PRIMARY_BASE);
    } catch (primaryError) {
      const shouldTryFallback =
        API_PRIMARY_BASE !== API_FALLBACK_BASE && isNetworkError(primaryError);
      if (!shouldTryFallback) throw primaryError;
      return await fetchDatasets(API_FALLBACK_BASE);
    }
  } catch {
    return [];
  }
}

async function authPostJson(apiBase: string, path: string, body: object): Promise<Response> {
  return fetchWithTimeout(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function registerUserAccount(email: string, password: string): Promise<void> {
  let response: Response;
  try {
    response = await authPostJson(API_PRIMARY_BASE, '/api/auth/register', { email, password });
  } catch (e) {
    if (API_PRIMARY_BASE !== API_FALLBACK_BASE && isNetworkError(e)) {
      response = await authPostJson(API_FALLBACK_BASE, '/api/auth/register', { email, password });
    } else {
      throw e;
    }
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Registration failed: ${response.status}`);
  }
  const data = (await response.json()) as { access_token: string };
  localStorage.setItem('access_token', data.access_token);
}

export async function loginUser(email: string, password: string): Promise<void> {
  let response: Response;
  try {
    response = await authPostJson(API_PRIMARY_BASE, '/api/auth/login', { email, password });
  } catch (e) {
    if (API_PRIMARY_BASE !== API_FALLBACK_BASE && isNetworkError(e)) {
      response = await authPostJson(API_FALLBACK_BASE, '/api/auth/login', { email, password });
    } else {
      throw e;
    }
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Login failed: ${response.status}`);
  }
  const data = (await response.json()) as { access_token: string };
  localStorage.setItem('access_token', data.access_token);
}

export function logoutUser(): void {
  localStorage.removeItem('access_token');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}
