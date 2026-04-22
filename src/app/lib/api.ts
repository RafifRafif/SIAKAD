const API_BASE_URL = '/api';

type ErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
  backend_status?: number;
  backend_content_type?: string | null;
  backend_body_preview?: string | null;
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? ((await response.json()) as T | ErrorPayload)
    : null;

  if (!response.ok) {
    const fallbackMessage = 'Permintaan ke backend gagal diproses.';
    const validationMessages =
      payload && typeof payload === 'object' && 'errors' in payload && payload.errors
        ? Object.entries(payload.errors).flatMap(([field, messages]) =>
            messages.map((message) => mapValidationMessage(field, message))
          )
        : [];

    const message = validationMessages.length
      ? validationMessages.join(' ')
      : payload && typeof payload === 'object' && 'message' in payload && payload.message
        ? String(payload.message)
        : fallbackMessage;

    throw new Error(message);
  }

  if (payload === null) {
    throw new Error('Backend mengembalikan respons kosong atau bukan JSON yang valid.');
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { headers, body, ...restOptions } = options;

  const resolvedBody =
    body && typeof body === 'object' && !(body instanceof FormData) ? JSON.stringify(body) : body;

  let response: Response;

  try {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...restOptions,
      headers: {
        ...(resolvedBody instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: resolvedBody,
    });
  } catch {
    throw new Error('Tidak dapat terhubung ke backend. Pastikan server API aktif.');
  }

  return parseResponse<T>(response);
}

function mapValidationMessage(field: string, message: string): string {
  if (message === 'validation.unique') {
    if (field === 'nis') {
      return 'NIS sudah terdaftar.';
    }

    if (field === 'email') {
      return 'Email sudah terdaftar.';
    }

    return `${field} sudah digunakan.`;
  }

  if (message === 'validation.exists') {
    if (field === 'class_id') {
      return 'Kelas yang dipilih tidak valid.';
    }

    if (field === 'academic_year_id') {
      return 'Tahun ajaran yang dipilih tidak valid.';
    }

    return `${field} tidak ditemukan.`;
  }

  return message;
}

export { API_BASE_URL };
