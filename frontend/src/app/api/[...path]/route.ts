import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = (
  process.env.LARAVEL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://127.0.0.1:8000'
).replace(/\/$/, '');
const TOKEN_COOKIE = 'siakad_access_token';

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function backendUrl(request: NextRequest, path: string[]) {
  const url = new URL(request.url);
  const backendBaseUrl = new URL(BACKEND_API_URL);
  const backendPath = `/api/${path.join('/')}`;

  if (backendBaseUrl.hostname === 'localhost') {
    backendBaseUrl.hostname = '127.0.0.1';
  }

  backendBaseUrl.pathname = backendPath;
  backendBaseUrl.search = url.search;

  return backendBaseUrl.toString();
}

function proxyHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const blockedHeaders = [
    'accept-encoding',
    'connection',
    'content-length',
    'cookie',
    'expect',
    'host',
    'keep-alive',
    'origin',
    'proxy-authenticate',
    'proxy-authorization',
    'sec-fetch-dest',
    'sec-fetch-mode',
    'sec-fetch-site',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
  ];

  for (const header of blockedHeaders) {
    headers.delete(header);
  }

  headers.delete('authorization');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  headers.set('Accept', headers.get('Accept') ?? 'application/json');
  headers.set('X-Requested-With', 'XMLHttpRequest');

  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  try {
    const method = request.method.toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);
    const params = await context.params;
    const routePath = params.path.join('/');
    const body = hasBody ? await request.arrayBuffer() : undefined;
    const response = await fetch(backendUrl(request, params.path), {
      method,
      headers: proxyHeaders(request),
      body,
      cache: 'no-store',
    });
    const contentType = response.headers.get('content-type') ?? '';
    const responseHeaders = new Headers();

    for (const [key, value] of response.headers.entries()) {
      const normalizedKey = key.toLowerCase();

      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(normalizedKey)) {
        responseHeaders.set(key, value);
      }
    }

    responseHeaders.set('Cache-Control', 'no-store, max-age=0');

    if (request.method === 'POST' && routePath === 'auth/login') {
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();
      const nextResponse = NextResponse.json(payload, {
        status: response.status,
        headers: responseHeaders,
      });

      if (response.ok && typeof payload === 'object' && payload !== null && 'access_token' in payload) {
        const expiresIn = Number((payload as { expires_in?: unknown }).expires_in ?? 0);

        nextResponse.cookies.set(TOKEN_COOKIE, String((payload as { access_token: unknown }).access_token), {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: expiresIn > 0 ? expiresIn : 60 * 60 * 8,
        });
      }

      return nextResponse;
    }

    if (request.method === 'POST' && routePath === 'auth/logout') {
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();
      const nextResponse = contentType.includes('application/json')
        ? NextResponse.json(payload, { status: response.status, headers: responseHeaders })
        : new NextResponse(payload, { status: response.status, headers: responseHeaders });

      nextResponse.cookies.set(TOKEN_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
      });

      return nextResponse;
    }

    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error
      ? ` Cause: ${error.cause.message}`
      : '';

    return NextResponse.json(
      {
        message: 'Tidak bisa menghubungi backend Laravel.',
        detail: process.env.NODE_ENV === 'production'
          ? undefined
          : error instanceof Error
            ? `${error.message}${cause}`
            : String(error),
      },
      { status: 502 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
