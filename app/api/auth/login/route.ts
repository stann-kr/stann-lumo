import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json() as { password: string };
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
