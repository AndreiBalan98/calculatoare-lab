import type { NextRequest } from 'next/server';
import { cautaFirma } from './firma';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const { status, corp } = await cautaFirma(q.get('cui'), process.env, q.get('istoric') === '1');
  return Response.json(corp, { status, headers: { 'Cache-Control': 'no-store' } });
}
