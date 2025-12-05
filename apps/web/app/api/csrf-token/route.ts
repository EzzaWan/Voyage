import { NextResponse } from 'next/server';
import { getCsrfToken } from '@/lib/csrf';

// Mark route as dynamic since it uses cookies
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const token = await getCsrfToken();
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Failed to generate CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

