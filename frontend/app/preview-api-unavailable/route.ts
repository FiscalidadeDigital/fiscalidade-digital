import { NextResponse } from 'next/server';

const responseHeaders = {
  'Cache-Control': 'no-store',
};

function previewApiUnavailable() {
  return NextResponse.json(
    {
      message:
        'O ambiente de pré-publicação ainda não está configurado para processar esta operação.',
    },
    {
      status: 503,
      headers: responseHeaders,
    },
  );
}

export const GET = previewApiUnavailable;
export const POST = previewApiUnavailable;
export const PUT = previewApiUnavailable;
export const PATCH = previewApiUnavailable;
export const DELETE = previewApiUnavailable;
export const OPTIONS = previewApiUnavailable;
