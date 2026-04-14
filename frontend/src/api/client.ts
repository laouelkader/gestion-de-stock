export const apiBase = import.meta.env.VITE_API_URL ?? ''

export function apiUrl(path: string): string {
  return `${apiBase}${path}`
}

export async function parseApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown }
    const { detail } = data
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((d: { msg?: string; loc?: unknown }) => d.msg ?? JSON.stringify(d))
        .join(' · ')
    }
    if (detail && typeof detail === 'object') {
      return JSON.stringify(detail)
    }
  } catch {
    /* ignore */
  }
  return res.statusText || 'Erreur réseau'
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBase}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (res.status === 204) {
    return undefined as T
  }
  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}
