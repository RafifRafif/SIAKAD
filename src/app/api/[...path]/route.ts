import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000/api/v1';

async function forwardRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const backendUrl = new URL(`${BACKEND_API_BASE_URL}/${path.join('/')}`);

    request.nextUrl.searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const requestBody =
      request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();

    const response = await fetch(backendUrl.toString(), {
      method: request.method,
      headers: {
        Accept: 'application/json',
        ...(request.headers.get('content-type')
          ? { 'Content-Type': request.headers.get('content-type') as string }
          : {}),
      },
      body: requestBody,
      cache: 'no-store',
    });

    const responseText = await response.text();
    const contentType = response.headers.get('content-type') ?? '';
    const looksLikeJson = contentType.includes('application/json') || isJsonString(responseText);

    if (looksLikeJson && responseText.trim() !== '') {
      return new NextResponse(responseText, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (response.ok) {
      return NextResponse.json(
        {
          message: 'Proxy API menerima respons kosong atau non-JSON dari backend.',
          backend_status: response.status,
          backend_content_type: contentType || null,
          backend_body_preview: responseText.slice(0, 200) || null,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        message: 'Backend mengembalikan respons yang tidak valid.',
        backend_status: response.status,
        backend_content_type: contentType || null,
        backend_body_preview: responseText.slice(0, 200) || null,
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Proxy API gagal meneruskan request.',
      },
      { status: 502 }
    );
  }
}

function isJsonString(value: string): boolean {
  const trimmedValue = value.trim();

  return trimmedValue.startsWith('{') || trimmedValue.startsWith('[');
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}
