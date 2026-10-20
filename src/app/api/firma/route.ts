import type { NextRequest } from 'next/server';
import { cautaFirma } from './firma';

export async function GET(request: NextRequest) {
  const { status, corp } = await cautaFirma(request.nextUrl.searchParams.get('cui'));
  return Response.json(corp, { status, headers: { 'Cache-Control': 'no-store' } });
}
