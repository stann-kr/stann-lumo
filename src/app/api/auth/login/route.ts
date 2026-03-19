import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';
import { createSession, buildSessionCookieHeader } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = (await request.json()) as { password: string };

    const { ADMIN_PASSWORD } = getEnv();

    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'Admin password not configured on server' } },
        { status: 401 },
      );
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid password' } },
        { status: 401 },
      );
    }

    const sessionId = await createSession();

    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', buildSessionCookieHeader(sessionId));

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Bad request' } },
      { status: 400 },
    );
  }
}
