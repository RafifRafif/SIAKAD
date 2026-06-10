const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
const inflightGetRequests = new Map<string, Promise<unknown>>();

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(typeof payload === 'object' && payload !== null && 'message' in payload
      ? String((payload as { message?: string }).message)
      : 'Terjadi kesalahan saat menghubungi server.');
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('X-Requested-With', 'XMLHttpRequest');

  const hasBody = options.body !== undefined;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const method = options.method?.toUpperCase() ?? 'GET';
  const requestUrl = `${API_BASE_URL}${path}`;
  const requestKey = method === 'GET' && !hasBody ? requestUrl : null;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (requestKey && inflightGetRequests.has(requestKey)) {
    return inflightGetRequests.get(requestKey) as Promise<T>;
  }

  const requestPromise = (async () => {
    const response = await fetch(requestUrl, {
      ...options,
      headers,
      credentials: 'include',
      body: hasBody
        ? (isFormData ? (options.body as BodyInit) : JSON.stringify(options.body))
        : undefined,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new ApiError(response.status, payload);
    }

    return payload as T;
  })();

  if (!requestKey) {
    return requestPromise;
  }

  inflightGetRequests.set(requestKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inflightGetRequests.delete(requestKey);
  }
}

export const apiGet = <T>(path: string) => apiRequest<T>(path);

export const apiPost = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: 'POST', body });

export const apiPut = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: 'PUT', body });

export const apiPatch = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: 'PATCH', body });

export const apiDelete = <T>(path: string) =>
  apiRequest<T>(path, { method: 'DELETE' });

export const apiUpload = <T>(path: string, body: FormData) =>
  apiRequest<T>(path, { method: 'POST', body });

export async function apiDownload(path: string, fallbackFilename: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/pdf',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    throw new ApiError(response.status, payload);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') ?? '';
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  const filename = filenameMatch?.[1] ?? fallbackFilename;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
